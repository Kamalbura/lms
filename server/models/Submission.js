import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answer: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean,
  points: { type: Number, default: 0 },
  feedback: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

const submissionSchema = new mongoose.Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [answerSchema],
  submittedAt: { type: Date, default: Date.now },
  timeTaken: { type: Number }, // in minutes
  totalScore: { type: Number, default: 0 },
  maxPossibleScore: { type: Number, required: true },
  status: { type: String, enum: ["submitted", "graded"], default: "submitted" },
  feedback: String,
  gradedAt: { type: Date },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

// Ensure a user can only submit once per assessment
submissionSchema.index({ assessment: 1, user: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
