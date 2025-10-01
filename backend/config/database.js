// MongoDB Atlas Connection Configuration
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://davidbruzil_db_user:HsDK9gcjmf5jdBSj@cluster0.uvfwkum.mongodb.net/netflix?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Atlas connected successfully');
        console.log('📊 Database:', mongoose.connection.name);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1); // Exit process with failure
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB Atlas');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 Mongoose connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;
