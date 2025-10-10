// Content Schema - MongoDB Model for movies and TV shows
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Movie', 'Series'],
        default: 'Movie'
    },
    image: {
        type: String,
        required: [true, 'Poster image is required']
    },
    backdrop: {
        type: String
    },
    year: {
        type: Number,
        required: [true, 'Year is required']
    },
    rating: {
        type: String,
        default: '0'
    },
    genre: {
        type: String,
        required: [true, 'Genre is required']
    },
    runtime: {
        type: String
    },
    director: {
        type: String
    },
    cast: {
        type: String
    },
    videoFile: {
        type: String
    },
    popularity: {
        type: Number,
        default: 0
    },
    tmdbId: {
        type: Number,
        unique: true,
        sparse: true,
        index: true
    },
    section: {
        type: String,
        enum: ['continue', 'trending', 'movies', 'series'],
        default: 'movies'
    },
    likes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for faster queries
contentSchema.index({ category: 1 });
contentSchema.index({ section: 1 });
contentSchema.index({ genre: 1 });
contentSchema.index({ year: 1 });
contentSchema.index({ title: 'text', description: 'text' }); // Text search index

// Static method to search content
contentSchema.statics.searchContent = async function(query, limit = 20) {
    return await this.find({
        $text: { $search: query }
    }).limit(limit);
};

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
