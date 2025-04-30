import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: String,
  content: String,
  videoUrl: String,
  contentType: { type: String, enum: ["video", "text", "pdf"], default: "text" },
  duration: Number,
});

const moduleSchema = new mongoose.Schema({
  title: String,
  lessons: [lessonSchema],
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  category: String,
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  thumbnail: String,
  price: Number,
  modules: [moduleSchema],
  createdAt: { type: Date, default: Date.now },
});

// Pre-save hook to ensure slug is created
courseSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
