import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text: String,
  type: { type: String, enum: ["mcq", "short"], default: "mcq" },
  options: [String], // for MCQs
  correctAnswer: mongoose.Schema.Types.Mixed,
  points: Number,
});

const assessmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  title: String,
  description: String,
  type: { type: String, enum: ["quiz", "assignment"] },
  questions: [questionSchema],
  totalPoints: { type: Number, default: 0 },
  dueDate: Date,
  timeLimit: { type: Number }, // in minutes, for quizzes
  isPublished: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to calculate total points
assessmentSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, question) => sum + (question.points || 0), 0);
  }
  next();
});

export default mongoose.model("Assessment", assessmentSchema);
