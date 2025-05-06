import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true
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
  issuedAt: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: String,
    required: true
  },
  certificateUrl: {
    type: String,
    required: true
  },
  verificationUrl: {
    type: String,
    required: true
  },
  metadata: {
    template: String,
    completionScore: Number,
    hoursSpent: Number
  }
});

// Indexes for better query performance
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;