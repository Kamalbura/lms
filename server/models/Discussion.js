import mongoose from 'mongoose';

// Define reply schema for nested comments
const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxLength: 2000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  reactions: {
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    helpful: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isInstructorResponse: {
    type: Boolean,
    default: false
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }]
});

// Define discussion schema
const discussionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.modules'
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.modules.lessons'
  },
  title: {
    type: String,
    required: true,
    maxLength: 200
  },
  content: {
    type: String,
    required: true,
    maxLength: 5000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'question', 'announcement'],
    default: 'general'
  },
  tags: [{
    type: String,
    maxLength: 30
  }],
  status: {
    type: String,
    enum: ['open', 'resolved', 'closed'],
    default: 'open'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'instructors'],
    default: 'public'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  replies: [replySchema],
  reactions: {
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    helpful: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    lastActivity: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
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

// Update timestamps on save
discussionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.replies && this.replies.length > 0) {
    this.metadata.lastActivity = new Date();
  }
  next();
});

// Instance method to mark as resolved
discussionSchema.methods.resolve = function(userId) {
  this.status = 'resolved';
  this.metadata.resolvedBy = userId;
  this.metadata.resolvedAt = new Date();
  return this.save();
};

// Instance method to increment view count
discussionSchema.methods.incrementViews = function() {
  this.metadata.views += 1;
  return this.save();
};

// Instance method to add reply
discussionSchema.methods.addReply = function(replyData) {
  this.replies.push(replyData);
  this.metadata.lastActivity = new Date();
  return this.save();
};

// Indexes for efficient querying
discussionSchema.index({ course: 1, createdAt: -1 });
discussionSchema.index({ course: 1, module: 1, lesson: 1 });
discussionSchema.index({ 'metadata.lastActivity': -1 });
discussionSchema.index({ status: 1 });
discussionSchema.index({ 
  title: 'text', 
  content: 'text',
  tags: 'text'
});

const Discussion = mongoose.model('Discussion', discussionSchema);

export default Discussion;