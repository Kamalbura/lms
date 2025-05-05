import Course from "../models/Course.js";

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const { title, description, category, price, level, modules } = req.body;
    
    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if course with slug already exists
    const courseExists = await Course.findOne({ slug });
    if (courseExists) {
      return res.status(400).json({ message: "Course with similar title already exists" });
    }
    
    const course = await Course.create({
      title,
      slug,
      description, 
      category, 
      price, 
      level, 
      modules,
      instructor: req.user._id,
    });
    
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Increased from default 10 to 20
    const skip = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    
    // Search option
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const courses = await Course.find(filter)
      .populate("instructor", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await Course.countDocuments(filter);
    
    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCourses: total
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single course by slug
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug })
      .populate("instructor", "name email");
      
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    // If title is updated, update slug too
    if (req.body.title) {
      req.body.slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    const course = await Course.findOneAndUpdate(
      { slug: req.params.slug, instructor: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({ 
        message: "Course not found or you don't have permission to update it" 
      });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    // Allow admin to delete any course, but instructors can only delete their own
    const query = req.user.role === 'admin' 
      ? { slug: req.params.slug }
      : { slug: req.params.slug, instructor: req.user._id };
      
    const course = await Course.findOneAndDelete(query);
    
    if (!course) {
      return res.status(404).json({ 
        message: "Course not found or you don't have permission to delete it" 
      });
    }
    
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get instructor courses
export const getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({ createdAt: -1 });
      
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
