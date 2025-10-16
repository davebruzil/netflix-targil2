/**
 * Test Statistics Endpoint Logic
 * Simulates what the ProfileController.getStatistics does
 */

const mongoose = require('mongoose');
const Profile = require('./schemas/ProfileSchema');
const ProfileInteraction = require('./schemas/ProfileInteractionSchema');
const Content = require('./schemas/ContentSchema');
const User = require('./schemas/UserSchema');

const MONGODB_URI = 'mongodb+srv://davidbruzil_db_user:HsDK9gcjmf5jdBSj@cluster0.uvfwkum.mongodb.net/netflix?retryWrites=true&w=majority&appName=Cluster0';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    bright: '\x1b[1m',
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function testStatisticsLogic() {
    try {
        await mongoose.connect(MONGODB_URI);
        log('✅ Connected to MongoDB\n', 'green');

        // Get first user to test
        const user = await User.findOne();
        if (!user) {
            log('❌ No users found', 'red');
            return;
        }

        const userId = user._id;
        log(`Testing statistics for user: ${user.email}`, 'cyan');
        log(`User ID: ${userId}\n`, 'cyan');

        // Get all profiles for this user
        const profiles = await Profile.find({ userId });
        log(`📊 User has ${profiles.length} profile(s):`, 'bright');
        profiles.forEach(p => log(`  - ${p.name} (ID: ${p._id})`, 'cyan'));

        if (profiles.length === 0) {
            log('\n⚠️ No profiles found for this user', 'yellow');
            return;
        }

        const profileIds = profiles.map(p => p._id);

        // ============ TEST 1: Daily Views (Bar Chart) ============
        log('\n' + '='.repeat(60), 'bright');
        log('TEST 1: Daily Views by Profile (Bar Chart)', 'bright');
        log('='.repeat(60) + '\n', 'bright');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        log(`Searching for watch activities from: ${sevenDaysAgo.toLocaleDateString()}`, 'cyan');

        const dailyViewsData = await ProfileInteraction.aggregate([
            {
                $match: {
                    profileId: { $in: profileIds },
                    'activityLog.timestamp': { $gte: sevenDaysAgo },
                    'activityLog.action': 'watch'
                }
            },
            { $unwind: '$activityLog' },
            {
                $match: {
                    'activityLog.action': 'watch',
                    'activityLog.timestamp': { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        profileId: '$profileId',
                        date: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$activityLog.timestamp'
                            }
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.date': 1 }
            }
        ]);

        log(`\n✅ Found ${dailyViewsData.length} data points`, 'green');

        // Format daily views for Chart.js
        const dailyViews = {};
        profiles.forEach(profile => {
            dailyViews[profile.name] = [];
        });

        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push(dateStr);

            profiles.forEach(profile => {
                dailyViews[profile.name].push(0);
            });
        }

        dailyViewsData.forEach(item => {
            const profile = profiles.find(p => p._id.toString() === item._id.profileId.toString());
            if (profile) {
                const dateIndex = dates.indexOf(item._id.date);
                if (dateIndex !== -1) {
                    dailyViews[profile.name][dateIndex] = item.count;
                }
            }
        });

        log('\n📊 Daily Views Chart Data:', 'bright');
        log('Dates:', 'cyan');
        const formattedDates = dates.map(d => {
            const date = new Date(d);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        log(`  ${formattedDates.join(', ')}`, 'cyan');

        log('\nDatasets:', 'cyan');
        Object.keys(dailyViews).forEach((profileName, index) => {
            const total = dailyViews[profileName].reduce((a, b) => a + b, 0);
            log(`  ${profileName}: [${dailyViews[profileName].join(', ')}] (Total: ${total})`, 'green');
        });

        // ============ TEST 2: Genre Popularity (Pie Chart) ============
        log('\n' + '='.repeat(60), 'bright');
        log('TEST 2: Content Popularity by Genre (Pie Chart)', 'bright');
        log('='.repeat(60) + '\n', 'bright');

        // Get like activities
        const likeActivities = await ProfileInteraction.aggregate([
            {
                $match: {
                    profileId: { $in: profileIds },
                    'activityLog.action': 'like'
                }
            },
            { $unwind: '$activityLog' },
            {
                $match: {
                    'activityLog.action': 'like'
                }
            },
            {
                $group: {
                    _id: '$activityLog.contentId',
                    count: { $sum: 1 }
                }
            }
        ]);

        log(`✅ Found ${likeActivities.length} liked content items`, 'green');

        // Get genre statistics from activity log
        let genreData = [];
        if (likeActivities.length > 0) {
            // Extract ObjectIds only (filter out string IDs)
            const validContentIds = likeActivities
                .map(item => item._id)
                .filter(id => id && typeof id === 'object'); // Only MongoDB ObjectIds

            log(`\n📊 Valid content IDs to lookup: ${validContentIds.length}`, 'cyan');

            if (validContentIds.length > 0) {
                const contents = await Content.find({
                    _id: { $in: validContentIds }
                }).select('genre title');

                log(`✅ Found ${contents.length} matching content items in DB`, 'green');

                // Count genres
                const genreCounts = {};
                contents.forEach(content => {
                    const genre = content.genre || 'Unknown';
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });

                // Convert to array and sort
                genreData = Object.entries(genreCounts)
                    .map(([genre, count]) => ({ _id: genre, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10); // Top 10 genres
            }
        }

        log('\n📊 Genre Popularity Chart Data:', 'bright');
        if (genreData.length > 0) {
            log('Top Genres:', 'cyan');
            genreData.forEach(g => {
                log(`  ${g._id}: ${g.count}`, 'green');
            });

            log('\nChart.js format:', 'cyan');
            log(`  Labels: [${genreData.map(g => `"${g._id}"`).join(', ')}]`, 'cyan');
            log(`  Data: [${genreData.map(g => g.count).join(', ')}]`, 'cyan');
        } else {
            log('⚠️ No genre data available', 'yellow');
        }

        // ============ FINAL API RESPONSE FORMAT ============
        log('\n' + '='.repeat(60), 'bright');
        log('FINAL API RESPONSE (what frontend receives)', 'bright');
        log('='.repeat(60) + '\n', 'bright');

        const apiResponse = {
            success: true,
            data: {
                dailyViews: {
                    labels: formattedDates,
                    datasets: Object.keys(dailyViews).map((profileName, index) => ({
                        label: profileName,
                        data: dailyViews[profileName],
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                    }))
                },
                genrePopularity: {
                    labels: genreData.map(g => g._id || 'Unknown'),
                    data: genreData.map(g => g.count)
                }
            }
        };

        log(JSON.stringify(apiResponse, null, 2), 'cyan');

        log('\n' + '='.repeat(60), 'bright');
        log('✅ STATISTICS TEST COMPLETED SUCCESSFULLY!', 'green');
        log('='.repeat(60), 'bright');

        log('\n📝 Summary:', 'bright');
        log(`  ✓ Daily views data points: ${dailyViewsData.length}`, 'green');
        log(`  ✓ Genre categories: ${genreData.length}`, 'green');
        log(`  ✓ Total profiles: ${profiles.length}`, 'green');

        log('\n💡 Next: Open http://localhost:5000/settings.html to see the charts!', 'yellow');

    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await mongoose.connection.close();
        log('\n🔌 Database connection closed', 'cyan');
    }
}

testStatisticsLogic();
