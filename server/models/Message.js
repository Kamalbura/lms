import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['course_chat', 'private_chat', 'announcement', 'question', 'reply'],
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: function() {
      return this.type === 'course_chat' || this.type === 'announcement';
    }
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  content: {
    text: {
      type: String,
      required: true
    },
    html: String, // For formatted text
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number
    }]
  },
  metadata: {
    lessonId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    edited: {
      isEdited: { type: Boolean, default: false },
      editedAt: Date,
      editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  status: {
    delivered: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: Date
    }],
    read: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: Date
    }]
  },
  tags: [String],
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  threadInfo: {
    isThread: {
      type: Boolean,
      default: false
    },
    replyCount: {
      type: Number,
      default: 0
    },
    lastReplyAt: Date,
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
});

// Indexes for better query performance
messageSchema.index({ course: 1, 'metadata.timestamp': -1 });
messageSchema.index({ sender: 1, 'metadata.timestamp': -1 });
messageSchema.index({ parentMessage: 1, 'metadata.timestamp': 1 });
messageSchema.index({ 'mentions.user': 1, 'metadata.timestamp': -1 });

// Method to mark message as delivered for a user
messageSchema.methods.markDelivered = function(userId) {
  if (!this.status.delivered.find(d => d.user.equals(userId))) {
    this.status.delivered.push({
      user: userId,
      timestamp: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark message as read for a user
messageSchema.methods.markRead = function(userId) {
  if (!this.status.read.find(r => r.user.equals(userId))) {
    this.status.read.push({
      user: userId,
      timestamp: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add a reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  let reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (!reaction) {
    reaction = { emoji, users: [userId] };
    this.reactions.push(reaction);
  } else if (!reaction.users.includes(userId)) {
    reaction.users.push(userId);
  }
  
  return this.save();
};

// Method to remove a reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  const reaction = this.reactions.find(r => r.emoji === emoji);
  
  if (reaction) {
    reaction.users = reaction.users.filter(u => !u.equals(userId));
    if (reaction.users.length === 0) {
      this.reactions = this.reactions.filter(r => r.emoji !== emoji);
    }
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Virtual for unread count
messageSchema.virtual('unreadCount').get(function() {
  return this.status.delivered.length - this.status.read.length;
});

// Method to update thread info when a reply is added
messageSchema.methods.updateThreadInfo = async function(userId) {
  this.threadInfo.isThread = true;
  this.threadInfo.replyCount += 1;
  this.threadInfo.lastReplyAt = new Date();
  
  if (!this.threadInfo.participants.includes(userId)) {
    this.threadInfo.participants.push(userId);
  }
  
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;
