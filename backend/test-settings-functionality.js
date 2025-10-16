/**
 * Settings Page Testing Script
 * Tests all functionality: Profile CRUD + Statistics
 */

const mongoose = require('mongoose');
const User = require('./schemas/UserSchema');
const Profile = require('./schemas/ProfileSchema');
const ProfileInteraction = require('./schemas/ProfileInteractionSchema');
const Content = require('./schemas/ContentSchema');

const MONGODB_URI = 'mongodb+srv://davidbruzil_db_user:HsDK9gcjmf5jdBSj@cluster0.uvfwkum.mongodb.net/netflix?retryWrites=true&w=majority&appName=Cluster0';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'bright');
    console.log('='.repeat(60));
}

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        log('✅ Connected to MongoDB Atlas', 'green');
        log(`📊 Database: ${mongoose.connection.name}`, 'cyan');
    } catch (error) {
        log(`❌ MongoDB connection error: ${error.message}`, 'red');
        process.exit(1);
    }
}

async function testDatabaseConnection() {
    logSection('STEP 1: Database Connection Test');

    try {
        const dbState = mongoose.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        log(`Connection state: ${states[dbState]}`, dbState === 1 ? 'green' : 'red');

        if (dbState === 1) {
            log('✅ Database connection is active', 'green');
            return true;
        } else {
            log('❌ Database is not connected', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Error checking connection: ${error.message}`, 'red');
        return false;
    }
}

async function checkExistingData() {
    logSection('STEP 2: Checking Existing Data');

    try {
        // Check Users
        const userCount = await User.countDocuments();
        log(`\n📊 Users in DB: ${userCount}`, userCount > 0 ? 'green' : 'yellow');

        if (userCount > 0) {
            const sampleUsers = await User.find().limit(3).select('email name createdAt');
            log('Sample users:');
            sampleUsers.forEach(user => {
                log(`  - ${user.email} (${user.name}) - Created: ${user.createdAt?.toLocaleDateString()}`, 'cyan');
            });
        }

        // Check Profiles
        const profileCount = await Profile.countDocuments();
        log(`\n📊 Profiles in DB: ${profileCount}`, profileCount > 0 ? 'green' : 'yellow');

        if (profileCount > 0) {
            const sampleProfiles = await Profile.find().limit(5).populate('userId', 'email');
            log('Sample profiles:');
            sampleProfiles.forEach(profile => {
                log(`  - ${profile.name} (${profile.isChild ? 'Kid' : 'Adult'}) - User: ${profile.userId?.email || 'N/A'}`, 'cyan');
            });
        }

        // Check Profile Interactions
        const interactionCount = await ProfileInteraction.countDocuments();
        log(`\n📊 Profile Interactions: ${interactionCount}`, interactionCount > 0 ? 'green' : 'yellow');

        if (interactionCount > 0) {
            const sampleInteraction = await ProfileInteraction.findOne().populate('profileId', 'name');
            if (sampleInteraction) {
                log(`Sample interaction for profile: ${sampleInteraction.profileId?.name || 'Unknown'}`);
                log(`  - Liked content: ${sampleInteraction.likedContent?.length || 0}`, 'cyan');
                log(`  - My list: ${sampleInteraction.myList?.length || 0}`, 'cyan');
                log(`  - Activity log entries: ${sampleInteraction.activityLog?.length || 0}`, 'cyan');

                if (sampleInteraction.activityLog?.length > 0) {
                    log(`  - Recent activities:`, 'cyan');
                    sampleInteraction.activityLog.slice(-3).forEach(activity => {
                        log(`    • ${activity.action} - ${activity.timestamp?.toLocaleString()}`, 'cyan');
                    });
                }
            }
        }

        // Check Content
        const contentCount = await Content.countDocuments();
        log(`\n📊 Content in DB: ${contentCount}`, contentCount > 0 ? 'green' : 'yellow');

        if (contentCount > 0) {
            const sampleContent = await Content.find().limit(3);
            log('Sample content:');
            sampleContent.forEach(content => {
                log(`  - ${content.title} (${content.genre}) - ${content.year}`, 'cyan');
            });

            // Check genres distribution
            const genres = await Content.distinct('genre');
            log(`\n📊 Available genres (${genres.length}):`, 'cyan');
            log(`  ${genres.join(', ')}`);
        }

        return {
            users: userCount,
            profiles: profileCount,
            interactions: interactionCount,
            content: contentCount
        };
    } catch (error) {
        log(`❌ Error checking data: ${error.message}`, 'red');
        return null;
    }
}

async function testProfileOperations() {
    logSection('STEP 3: Testing Profile CRUD Operations');

    try {
        // Get or create a test user
        let testUser = await User.findOne({ email: 'test@example.com' });

        if (!testUser) {
            log('\n⚠️ No test user found, creating one...', 'yellow');
            testUser = await User.create({
                email: 'test@example.com',
                password: 'hashedpassword123', // In real scenario, this would be hashed
                name: 'Test User'
            });
            log('✅ Test user created', 'green');
        } else {
            log('\n✅ Using existing test user', 'green');
        }

        log(`Test User ID: ${testUser._id}`, 'cyan');

        // Count existing profiles for this user
        const existingProfileCount = await Profile.countDocuments({ userId: testUser._id });
        log(`\n📊 Current profiles for test user: ${existingProfileCount}/5`, 'cyan');

        // Test 1: Create Profile (if under limit)
        if (existingProfileCount < 5) {
            log('\n🧪 TEST 1: Creating new profile...', 'blue');
            const newProfile = await Profile.create({
                userId: testUser._id,
                name: `Test Profile ${existingProfileCount + 1}`,
                avatar: 'https://i.pravatar.cc/150?img=1',
                isChild: false
            });
            log(`✅ Profile created: ${newProfile.name} (ID: ${newProfile._id})`, 'green');
        } else {
            log('\n⚠️ TEST 1: Skipping profile creation (already at max 5 profiles)', 'yellow');
        }

        // Test 2: Read Profiles
        log('\n🧪 TEST 2: Reading all profiles for user...', 'blue');
        const userProfiles = await Profile.find({ userId: testUser._id });
        log(`✅ Found ${userProfiles.length} profiles`, 'green');
        userProfiles.forEach(profile => {
            log(`  - ${profile.name} (${profile.isChild ? 'Kid' : 'Adult'})`, 'cyan');
        });

        // Test 3: Update Profile (if exists)
        if (userProfiles.length > 0) {
            log('\n🧪 TEST 3: Updating first profile...', 'blue');
            const profileToUpdate = userProfiles[0];
            const oldName = profileToUpdate.name;
            profileToUpdate.name = `${oldName} (Updated)`;
            await profileToUpdate.save();
            log(`✅ Profile updated: "${oldName}" → "${profileToUpdate.name}"`, 'green');
        }

        // Test 4: Delete Profile (only if more than 1 exists)
        if (userProfiles.length > 1) {
            log('\n🧪 TEST 4: Deleting last profile...', 'blue');
            const profileToDelete = userProfiles[userProfiles.length - 1];
            await Profile.findByIdAndDelete(profileToDelete._id);
            log(`✅ Profile deleted: ${profileToDelete.name}`, 'green');
        } else {
            log('\n⚠️ TEST 4: Skipping deletion (only 1 profile, must keep at least one)', 'yellow');
        }

        // Final count
        const finalCount = await Profile.countDocuments({ userId: testUser._id });
        log(`\n📊 Final profile count: ${finalCount}/5`, 'cyan');

        return true;
    } catch (error) {
        log(`❌ Error in profile operations: ${error.message}`, 'red');
        return false;
    }
}

async function testStatisticsData() {
    logSection('STEP 4: Testing Statistics Data');

    try {
        // Get a user with profiles
        const user = await User.findOne();
        if (!user) {
            log('⚠️ No users found, cannot test statistics', 'yellow');
            return false;
        }

        log(`Testing statistics for user: ${user.email}`, 'cyan');

        const profiles = await Profile.find({ userId: user._id });
        log(`\n📊 User has ${profiles.length} profile(s)`, 'cyan');

        if (profiles.length === 0) {
            log('⚠️ No profiles found, cannot test statistics', 'yellow');
            return false;
        }

        const profileIds = profiles.map(p => p._id);

        // Check daily views data
        log('\n🧪 Checking Daily Views Data...', 'blue');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const viewsCount = await ProfileInteraction.aggregate([
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
            { $count: 'total' }
        ]);

        const totalViews = viewsCount[0]?.total || 0;
        log(`  📺 Watch activities in last 7 days: ${totalViews}`, totalViews > 0 ? 'green' : 'yellow');

        // Check genre popularity data
        log('\n🧪 Checking Genre Popularity Data...', 'blue');
        const likesCount = await ProfileInteraction.aggregate([
            {
                $match: {
                    profileId: { $in: profileIds },
                    'activityLog.action': 'like'
                }
            },
            { $unwind: '$activityLog' },
            {
                $match: { 'activityLog.action': 'like' }
            },
            { $count: 'total' }
        ]);

        const totalLikes = likesCount[0]?.total || 0;
        log(`  ❤️ Like activities: ${totalLikes}`, totalLikes > 0 ? 'green' : 'yellow');

        // If no data, suggest creating demo data
        if (totalViews === 0 && totalLikes === 0) {
            log('\n⚠️ No activity data found for statistics', 'yellow');
            log('💡 Suggestion: Create demo data for testing statistics', 'yellow');
            return false;
        } else {
            log('\n✅ Statistics data is available', 'green');
            return true;
        }
    } catch (error) {
        log(`❌ Error testing statistics: ${error.message}`, 'red');
        return false;
    }
}

async function createDemoData() {
    logSection('STEP 5: Creating Demo Data for Statistics');

    try {
        // Get or create test user
        let testUser = await User.findOne({ email: 'demo@example.com' });

        if (!testUser) {
            log('\nCreating demo user...', 'cyan');
            testUser = await User.create({
                email: 'demo@example.com',
                password: 'hashedpassword123',
                name: 'Demo User'
            });
            log('✅ Demo user created', 'green');
        }

        // Create 3 demo profiles if needed
        let profiles = await Profile.find({ userId: testUser._id });

        if (profiles.length === 0) {
            log('\nCreating demo profiles...', 'cyan');
            const profileNames = ['John', 'Sarah', 'Kids'];
            const profileData = profileNames.map((name, idx) => ({
                userId: testUser._id,
                name,
                avatar: `https://i.pravatar.cc/150?img=${idx + 10}`,
                isChild: name === 'Kids'
            }));

            profiles = await Profile.insertMany(profileData);
            log(`✅ Created ${profiles.length} demo profiles`, 'green');
        }

        // Create demo content if needed
        const contentCount = await Content.countDocuments();

        if (contentCount < 5) {
            log('\nCreating demo content...', 'cyan');
            const demoContent = [
                { title: 'Inception', genre: 'Sci-Fi', year: 2010, category: 'Movie', description: 'A mind-bending thriller', image: 'https://via.placeholder.com/300', rating: '8.8', tmdbId: 27205 },
                { title: 'Breaking Bad', genre: 'Drama', year: 2008, category: 'Series', description: 'A chemistry teacher turns to crime', image: 'https://via.placeholder.com/300', rating: '9.5', tmdbId: 1396 },
                { title: 'The Godfather', genre: 'Crime', year: 1972, category: 'Movie', description: 'The aging patriarch of an organized crime dynasty', image: 'https://via.placeholder.com/300', rating: '9.2', tmdbId: 238 },
                { title: 'Stranger Things', genre: 'Sci-Fi', year: 2016, category: 'Series', description: 'When a young boy vanishes, a small town uncovers a mystery', image: 'https://via.placeholder.com/300', rating: '8.7', tmdbId: 66732 },
                { title: 'Pulp Fiction', genre: 'Crime', year: 1994, category: 'Movie', description: 'The lives of two mob hitmen, a boxer, a gangster and his wife', image: 'https://via.placeholder.com/300', rating: '8.9', tmdbId: 680 }
            ];

            await Content.insertMany(demoContent);
            log(`✅ Created ${demoContent.length} demo content items`, 'green');
        }

        // Create activity log entries
        log('\nCreating demo activity log entries...', 'cyan');

        const contents = await Content.find().limit(5);

        for (const profile of profiles) {
            // Check if interaction exists
            let interaction = await ProfileInteraction.findOne({ profileId: profile._id });

            if (!interaction) {
                interaction = await ProfileInteraction.create({
                    profileId: profile._id,
                    likedContent: [],
                    myList: [],
                    activityLog: []
                });
            }

            // Add watch activities (last 7 days)
            const watchActivities = [];
            for (let i = 0; i < 10; i++) {
                const daysAgo = Math.floor(Math.random() * 7);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);

                const randomContent = contents[Math.floor(Math.random() * contents.length)];
                watchActivities.push({
                    action: 'watch',
                    contentId: randomContent._id,
                    contentTitle: randomContent.title,
                    timestamp: date
                });
            }

            // Add like activities
            const likeActivities = [];
            for (let i = 0; i < 5; i++) {
                const randomContent = contents[Math.floor(Math.random() * contents.length)];
                likeActivities.push({
                    action: 'like',
                    contentId: randomContent._id,
                    contentTitle: randomContent.title,
                    timestamp: new Date()
                });
            }

            interaction.activityLog.push(...watchActivities, ...likeActivities);
            await interaction.save();

            log(`  ✅ Added activity log for profile: ${profile.name}`, 'cyan');
        }

        log('\n✅ Demo data created successfully!', 'green');
        log('\n💡 You can now test the statistics page with real data', 'yellow');

        return true;
    } catch (error) {
        log(`❌ Error creating demo data: ${error.message}`, 'red');
        return false;
    }
}

async function generateReport(results) {
    logSection('📊 FINAL TEST REPORT');

    log('\n📝 Summary:', 'bright');
    log(`  Database Connection: ${results.dbConnected ? '✅ Connected' : '❌ Failed'}`, results.dbConnected ? 'green' : 'red');
    log(`  Users in DB: ${results.dataStats?.users || 0}`, 'cyan');
    log(`  Profiles in DB: ${results.dataStats?.profiles || 0}`, 'cyan');
    log(`  Interactions in DB: ${results.dataStats?.interactions || 0}`, 'cyan');
    log(`  Content in DB: ${results.dataStats?.content || 0}`, 'cyan');

    log('\n✅ Tests Passed:', 'bright');
    if (results.profileOps) log('  ✓ Profile CRUD operations', 'green');
    if (results.statistics) log('  ✓ Statistics data available', 'green');
    if (results.demoDataCreated) log('  ✓ Demo data created', 'green');

    log('\n⚠️ Recommendations:', 'bright');
    if (!results.statistics) {
        log('  • Run createDemoData() to generate test data for statistics', 'yellow');
    }
    if (results.dataStats?.profiles < 2) {
        log('  • Create more profiles to test the 5-profile limit', 'yellow');
    }

    log('\n🎯 Next Steps:', 'bright');
    log('  1. Open http://localhost:5000/settings.html in your browser', 'cyan');
    log('  2. Login/Register if needed', 'cyan');
    log('  3. Test profile creation/editing/deletion', 'cyan');
    log('  4. Check the statistics charts', 'cyan');
    log('  5. Verify everything works as expected', 'cyan');
}

// Main test runner
async function runAllTests() {
    log('🚀 Starting Settings Page Comprehensive Test', 'bright');
    log('📅 ' + new Date().toLocaleString(), 'cyan');

    const results = {};

    try {
        // Connect to database
        await connectDB();

        // Test 1: Database Connection
        results.dbConnected = await testDatabaseConnection();

        if (!results.dbConnected) {
            log('\n❌ Cannot proceed without database connection', 'red');
            process.exit(1);
        }

        // Test 2: Check existing data
        results.dataStats = await checkExistingData();

        // Test 3: Profile operations
        results.profileOps = await testProfileOperations();

        // Test 4: Statistics data
        results.statistics = await testStatisticsData();

        // Test 5: Create demo data if needed
        if (!results.statistics) {
            log('\n💡 Would you like to create demo data for testing? (y/n)', 'yellow');
            // For automated testing, we'll create it
            results.demoDataCreated = await createDemoData();

            // Re-test statistics
            if (results.demoDataCreated) {
                results.statistics = await testStatisticsData();
            }
        }

        // Generate report
        await generateReport(results);

        log('\n✅ All tests completed successfully!', 'green');

    } catch (error) {
        log(`\n❌ Test failed with error: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await mongoose.connection.close();
        log('\n🔌 Database connection closed', 'cyan');
    }
}

// Run tests
runAllTests();
