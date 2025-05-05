import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bookingNote: String,
  meetingLink: String,
  status: {
    type: String,
    enum: ['available', 'booked', 'completed', 'cancelled'],
    default: 'available'
  }
});

const weeklyScheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const officeHourSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['video', 'audio', 'chat'],
    default: 'video'
  },
  recording: {
    enabled: {
      type: Boolean,
      default: false
    },
    url: String,
    duration: Number,
    createdAt: Date,
    publicId: String,
    thumbnailUrl: String,
    format: String,
    size: Number
  },
  meetingData: {
    roomId: {
      type: String,
      required: true
    },
    joinTime: Date,
    leaveTime: Date,
    duration: Number // actual duration in minutes
  },
  analytics: {
    participantEvents: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      event: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    networkQuality: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      upload: Number,
      download: Number
    }]
  },
  notes: [{
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    givenAt: Date
  }
}, {
  timestamps: true
});

// Instance methods for analytics
officeHourSchema.methods.addParticipantEvent = async function(userId, event) {
  this.analytics.participantEvents.push({
    userId,
    event,
    timestamp: new Date()
  });
  return this.save();
};

officeHourSchema.methods.updateNetworkQuality = async function(upload, download) {
  this.analytics.networkQuality.push({
    upload,
    download,
    timestamp: new Date()
  });
  return this.save();
};

// Calculate actual duration when session ends
officeHourSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed') {
    if (this.meetingData.joinTime && this.meetingData.leaveTime) {
      this.meetingData.duration = Math.round(
        (this.meetingData.leaveTime - this.meetingData.joinTime) / (1000 * 60)
      );
    }
  }
  next();
});

const OfficeHour = mongoose.model('OfficeHour', officeHourSchema);
export default OfficeHour;
