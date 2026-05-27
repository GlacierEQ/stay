const mongoose = require('mongoose');

const ScriptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  sourceCode: {
    type: String,
    required: true,
    maxlength: 500000 // 500KB max
  },
  version: {
    type: String,
    required: true,
    default: '1.0.0',
    match: /^\d+\.\d+\.\d+$/
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['utility', 'enhancement', 'automation', 'privacy', 'development', 'entertainment', 'other'],
    default: 'other'
  },
  metadata: {
    namespace: String,
    homepage: String,
    supportURL: String,
    updateURL: String,
    downloadURL: String,
    icon: String,
    include: [String],
    match: [String],
    exclude: [String],
    require: [String],
    resource: [{
      name: String,
      url: String
    }],
    runAt: {
      type: String,
      enum: ['document-start', 'document-end', 'document-idle'],
      default: 'document-end'
    },
    grant: [String],
    noframes: Boolean
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloads: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  versionHistory: [{
    version: String,
    sourceCode: String,
    changelog: String,
    createdAt: { type: Date, default: Date.now }
  }],
  stats: {
    views: { type: Number, default: 0 },
    installs: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    lastUsed: Date
  },
  compatibility: {
    minVersion: String,
    maxVersion: String,
    browsers: [String]
  },
  license: {
    type: String,
    enum: ['MIT', 'GPL', 'Apache-2.0', 'BSD', 'MPL-2.0', 'Custom'],
    default: 'MIT'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
ScriptSchema.index({ authorId: 1, createdAt: -1 });
ScriptSchema.index({ name: 'text', description: 'text', tags: 'text' });
ScriptSchema.index({ isPublic: 1, isActive: 1, downloads: -1 });
ScriptSchema.index({ tags: 1 });
ScriptSchema.index({ category: 1 });

// Update timestamp on save
ScriptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to increment downloads
ScriptSchema.methods.incrementDownloads = async function() {
  this.downloads += 1;
  this.stats.installs += 1;
  await this.save();
};

// Method to add review
ScriptSchema.methods.addReview = async function(userId, rating, comment) {
  this.reviews.push({ userId, rating, comment });
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  
  await this.save();
};

// Method to save version to history
ScriptSchema.methods.saveVersion = async function(changelog) {
  this.versionHistory.push({
    version: this.version,
    sourceCode: this.sourceCode,
    changelog: changelog || 'No changelog provided'
  });
  await this.save();
};

// Virtual for short description
ScriptSchema.virtual('shortDescription').get(function() {
  return this.description.length > 150 
    ? this.description.substring(0, 150) + '...' 
    : this.description;
});

module.exports = mongoose.model('Script', ScriptSchema);
