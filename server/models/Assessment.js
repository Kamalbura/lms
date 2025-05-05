import mongoose from 'mongoose';

// Define question schema
const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'coding', 'essay', 'file-upload', 'programming'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  options: [{
    text: String,
    isCorrect: Boolean,
    explanation: String
  }],
  // For programming questions
  programmingConfig: {
    language: String,
    timeout: Number, // in seconds
    memory: Number, // in MB
    testCases: [{
      input: String,
      expectedOutput: String,
      isHidden: Boolean,
      points: Number
    }],
    templateCode: String,
    solutionCode: String
  },
  // For file upload questions
  fileConfig: {
    allowedTypes: [String],
    maxSize: Number, // in bytes
    multiple: Boolean
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    tags: [String],
    timeEstimate: Number // in minutes
  },
  rubric: [{
    criterion: String,
    points: Number,
    description: String
  }],
  solution: {
    text: String,
    code: String,
    files: [{
      name: String,
      url: String
    }]
  },
  hints: [{
    text: String,
    pointDeduction: Number
  }]
});

// Define assessment schema
const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
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
  description: String,
  type: {
    type: String,
    enum: ['quiz', 'exam', 'assignment', 'practice'],
    required: true
  },
  questions: [questionSchema],
  totalPoints: {
    type: Number,
    default: 0
  },
  passingScore: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  startDate: Date,
  endDate: Date,
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    showAnswers: {
      type: Boolean,
      default: true
    },
    maxAttempts: {
      type: Number,
      default: 1
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    requireProctoring: {
      type: Boolean,
      default: false
    },
    gradingType: {
      type: String,
      enum: ['auto', 'manual', 'hybrid'],
      default: 'auto'
    },
    lateSubmissions: {
      allowed: {
        type: Boolean,
        default: false
      },
      deadline: Date,
      penaltyPerDay: Number
    },
    accessControl: {
      password: String,
      ipRestriction: [String],
      browserLock: Boolean
    }
  },
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    },
    questionStats: [{
      questionId: mongoose.Schema.Types.ObjectId,
      correctCount: Number,
      incorrectCount: Number,
      averageTime: Number
    }]
  },
  resources: [{
    name: String,
    type: String,
    url: String,
    size: Number
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'enrolled'],
    default: 'enrolled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Calculate total points before saving
assessmentSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, question) => sum + question.points, 0);
  this.updatedAt = new Date();
  next();
});

// Method to update analytics
assessmentSchema.methods.updateAnalytics = async function(submissionData) {
  const assessment = this;
  
  // Increment total attempts
  assessment.analytics.totalAttempts += 1;
  
  // Update question stats
  submissionData.answers.forEach(answer => {
    const questionStat = assessment.analytics.questionStats.find(
      stat => stat.questionId.equals(answer.questionId)
    );
    
    if (questionStat) {
      if (answer.isCorrect) {
        questionStat.correctCount += 1;
      } else {
        questionStat.incorrectCount += 1;
      }
      // Update average time if time data is available
      if (answer.timeSpent) {
        questionStat.averageTime = (
          (questionStat.averageTime * (questionStat.correctCount + questionStat.incorrectCount - 1) + 
          answer.timeSpent) / (questionStat.correctCount + questionStat.incorrectCount)
        );
      }
    } else {
      assessment.analytics.questionStats.push({
        questionId: answer.questionId,
        correctCount: answer.isCorrect ? 1 : 0,
        incorrectCount: answer.isCorrect ? 0 : 1,
        averageTime: answer.timeSpent || 0
      });
    }
  });

  // Update overall analytics
  const submissions = await mongoose.model('Submission').find({ assessment: this._id });
  
  // Calculate new averages
  const scores = submissions.map(s => (s.totalScore / this.totalPoints) * 100);
  assessment.analytics.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  assessment.analytics.successRate = (
    submissions.filter(s => (s.totalScore / this.totalPoints) * 100 >= this.passingScore).length / 
    submissions.length
  ) * 100;
  
  // Calculate average completion time
  const times = submissions.map(s => s.timeTaken).filter(Boolean);
  if (times.length > 0) {
    assessment.analytics.averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  return assessment.save();
};

// Indexes
assessmentSchema.index({ course: 1, type: 1 });
assessmentSchema.index({ status: 1, visibility: 1 });
assessmentSchema.index({ startDate: 1, endDate: 1 });
assessmentSchema.index({ 
  title: 'text',
  description: 'text'
});

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;
