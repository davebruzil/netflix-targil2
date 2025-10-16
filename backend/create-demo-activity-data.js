/**
 * Create Demo Activity Data for Statistics Testing
 * Adds watch and like activities to existing profiles
 */

const mongoose = require('mongoose');
const Profile = require('./schemas/ProfileSchema');
const ProfileInteraction = require('./schemas/ProfileInteractionSchema');
const Content = require('./schemas/ContentSchema');

const MONGODB_URI = 'mongodb+srv://davidbruzil_db_user:HsDK9gcjmf5jdBSj@cluster0.uvfwkum.mongodb.net/netflix?retryWrites=true&w=majority&appName=Cluster0';

// Colors for console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function createDemoActivityData() {
    try {
        await mongoose.connect(MONGODB_URI);
        log('✅ Connected to MongoDB', 'green');

        // Get all profiles
        const profiles = await Profile.find();
        log(`\n📊 Found ${profiles.length} profiles`, 'cyan');

        if (profiles.length === 0) {
            log('⚠️ No profiles found. Please create profiles first.', 'yellow');
            return;
        }

        // Get all content
        const contents = await Content.find();
        log(`📊 Found ${contents.length} content items`, 'cyan');

        if (contents.length === 0) {
            log('⚠️ No content found. Please add content first.', 'yellow');
            return;
        }

        log('\n🔧 Creating activity log entries...\n', 'cyan');

        let totalActivities = 0;

        for (const profile of profiles) {
            log(`Processing profile: ${profile.name}`, 'cyan');

            // Find or create ProfileInteraction
            let interaction = await ProfileInteraction.findOne({ profileId: profile._id });

            if (!interaction) {
                interaction = new ProfileInteraction({
                    profileId: profile._id,
                    likedContent: [],
                    myList: [],
                    activityLog: []
                });
            }

            // Clear existing activity log for fresh start
            interaction.activityLog = [];

            // Create watch activities (last 7 days)
            const watchActivities = [];
            for (let i = 0; i < 15; i++) {
                const daysAgo = Math.floor(Math.random() * 7);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);
                date.setHours(Math.floor(Math.random() * 24));
                date.setMinutes(Math.floor(Math.random() * 60));

                const randomContent = contents[Math.floor(Math.random() * contents.length)];
                watchActivities.push({
                    action: 'watch',
                    contentId: randomContent._id,
                    contentTitle: randomContent.title,
                    timestamp: date,
                    extra: { duration: Math.floor(Math.random() * 120) + 10 }
                });
            }

            // Create like activities
            const likeActivities = [];
            const uniqueContent = [...new Set(Array(8).fill().map(() =>
                contents[Math.floor(Math.random() * contents.length)]
            ))];

            for (const content of uniqueContent) {
                const daysAgo = Math.floor(Math.random() * 30);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);

                likeActivities.push({
                    action: 'like',
                    contentId: content._id,
                    contentTitle: content.title,
                    timestamp: date
                });
            }

            // Add all activities
            interaction.activityLog.push(...watchActivities, ...likeActivities);
            await interaction.save();

            totalActivities += watchActivities.length + likeActivities.length;
            log(`  ✅ Added ${watchActivities.length} watch + ${likeActivities.length} like activities`, 'green');
        }

        log(`\n✅ Created ${totalActivities} total activity log entries!`, 'green');
        log('\n💡 You can now test the statistics charts at: http://localhost:5000/settings.html', 'yellow');

        // Show statistics summary
        log('\n📊 Statistics Summary:', 'cyan');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const watchCount = await ProfileInteraction.aggregate([
            { $unwind: '$activityLog' },
            {
                $match: {
                    'activityLog.action': 'watch',
                    'activityLog.timestamp': { $gte: sevenDaysAgo }
                }
            },
            { $count: 'total' }
        ]);

        const likeCount = await ProfileInteraction.aggregate([
            { $unwind: '$activityLog' },
            {
                $match: { 'activityLog.action': 'like' }
            },
            { $count: 'total' }
        ]);

        log(`  📺 Watch activities (last 7 days): ${watchCount[0]?.total || 0}`, 'green');
        log(`  ❤️ Like activities: ${likeCount[0]?.total || 0}`, 'green');

        // Show genre distribution
        const genreStats = await ProfileInteraction.aggregate([
            { $unwind: '$activityLog' },
            {
                $match: { 'activityLog.action': 'like' }
            },
            {
                $lookup: {
                    from: 'contents',
                    localField: 'activityLog.contentId',
                    foreignField: '_id',
                    as: 'content'
                }
            },
            { $unwind: '$content' },
            {
                $group: {
                    _id: '$content.genre',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        log('\n  Genre Popularity:', 'cyan');
        genreStats.forEach(stat => {
            log(`    ${stat._id}: ${stat.count}`, 'cyan');
        });

    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await mongoose.connection.close();
        log('\n🔌 Database connection closed', 'cyan');
    }
}

createDemoActivityData();
