import Assessment from '../models/Assessment.js';
import Submission from '../models/Submission.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { sendAssessmentResultEmail } from '../utils/email.js';

// Create a new assessment
export const createAssessment = async (req, res) => {
  try {
    const { title, description, type, questions, course, dueDate, timeLimit, isPublished } = req.body;
    
    // Verify course exists and user has access to it
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is instructor of the course or admin
    if (courseDoc.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have permission to create an assessment for this course' });
    }
    
    const assessment = new Assessment({
      title,
      description,
      type,
      questions,
      course,
      createdBy: req.user._id,
      dueDate,
      timeLimit,
      isPublished: isPublished || false
    });
    
    const savedAssessment = await assessment.save();
    
    res.status(201).json(savedAssessment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get assessments for a specific course
export const getCourseAssessments = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const assessments = await Assessment.find({ course: courseId })
      .populate('course', 'title slug')
      .sort({ createdAt: -1 });
    
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific assessment
export const getAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    const assessment = await Assessment.findById(assessmentId)
      .populate('course', 'title slug')
      .populate('createdBy', 'name');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit an assessment
export const submitAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { answers, timeTaken } = req.body;
    
    // Find the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check if user has already submitted this assessment
    const existingSubmission = await Submission.findOne({
      assessment: assessmentId,
      user: req.user._id
    });
    
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assessment' });
    }
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    // Process answers for auto-grading if it's a quiz
    const processedAnswers = answers.map(answer => {
      const question = assessment.questions.find(q => 
        q._id.toString() === answer.questionId.toString()
      );
      
      if (!question) {
        return answer;
      }
      
      maxPossibleScore += question.points || 0;
      
      // Auto-grade multiple choice questions
      if (question.type === 'mcq' && answer.answer) {
        const isCorrect = answer.answer === question.correctAnswer;
        totalScore += isCorrect ? question.points : 0;
        
        return {
          ...answer,
          isCorrect,
          points: isCorrect ? question.points : 0,
          feedback: isCorrect ? 'Correct answer!' : `Incorrect. The correct answer is: ${question.correctAnswer}`
        };
      }
      
      // For short answers, just store the answer and let instructor grade it
      return answer;
    });
    
    // Create submission
    const submission = new Submission({
      assessment: assessmentId,
      user: req.user._id,
      answers: processedAnswers,
      timeTaken,
      totalScore,
      maxPossibleScore,
      status: assessment.type === 'quiz' ? 'graded' : 'submitted'
    });
    
    const savedSubmission = await submission.save();
    
    // If quiz, send assessment result email
    if (assessment.type === 'quiz') {
      const percentage = Math.round((totalScore / maxPossibleScore) * 100);
      await sendAssessmentResultEmail(
        req.user.email,
        req.user.name,
        assessment.title,
        totalScore,
        maxPossibleScore,
        percentage
      );
    }
    
    res.status(201).json(savedSubmission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific submission
export const getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const submission = await Submission.findById(submissionId)
      .populate({
        path: 'assessment',
        select: 'title type questions course',
        populate: {
          path: 'course',
          select: 'title slug'
        }
      })
      .populate('user', 'name email');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Check if user has permission to view this submission
    if (
      submission.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'instructor' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'You do not have permission to view this submission' });
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all submissions for an assessment (instructor only)
export const getSubmissions = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Ensure user is instructor of the course or admin
    const course = await Course.findById(assessment.course);
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'You do not have permission to view these submissions' });
    }
    
    const submissions = await Submission.find({ assessment: assessmentId })
      .populate('user', 'name email')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all submissions for a user
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .populate({
        path: 'assessment',
        select: 'title type course',
        populate: {
          path: 'course',
          select: 'title slug'
        }
      })
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Grade a submission (instructor only)
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { answers, feedback } = req.body;
    
    const submission = await Submission.findById(submissionId)
      .populate('assessment');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Ensure user is instructor of the course or admin
    const course = await Course.findById(submission.assessment.course);
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'You do not have permission to grade this submission' });
    }
    
    // Update answers with instructor grading
    let totalScore = 0;
    const updatedAnswers = answers.map(answer => {
      totalScore += answer.points || 0;
      return {
        ...answer,
        gradedBy: req.user._id
      };
    });
    
    // Update submission
    submission.answers = updatedAnswers;
    submission.totalScore = totalScore;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedAt = Date.now();
    submission.gradedBy = req.user._id;
    
    await submission.save();
    
    // Send assessment result email
    const percentage = Math.round((totalScore / submission.maxPossibleScore) * 100);
    
    // Get student info
    const student = await User.findById(submission.user);
    
    await sendAssessmentResultEmail(
      student.email,
      student.name,
      submission.assessment.title,
      totalScore,
      submission.maxPossibleScore,
      percentage
    );
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
