import OfficeHour from '../models/OfficeHour.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';
import { sendOfficeHourBookingEmail, sendOfficeHourCancellationEmail } from '../utils/email.js';
import { nanoid } from 'nanoid';

// Get office hours for an instructor
export const getInstructorOfficeHours = async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    // Validate instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }
    
    // Get all office hours for this instructor
    const officeHours = await OfficeHour.find({ 
      instructorId,
      // Only return future slots or current office hours
      'slots.startTime': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Include last 24 hours
    }).populate('instructorId', 'name email profileImage');
    
    res.json(officeHours);
  } catch (error) {
    logger.error(`Error fetching instructor office hours: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new office hour session
export const createOfficeHour = async (req, res) => {
  try {
    const { studentId, courseId, startTime, endTime, topic, description, type = 'video' } = req.body;

    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end - start) / (1000 * 60)); // in minutes

    const officeHour = await OfficeHour.create({
      instructor: req.user._id,
      student: studentId,
      course: courseId,
      startTime,
      endTime,
      duration,
      topic,
      description,
      type,
      meetingData: {
        roomId: nanoid(10)
      }
    });

    const populatedOfficeHour = await OfficeHour.findById(officeHour._id)
      .populate('instructor', 'name email')
      .populate('student', 'name email')
      .populate('course', 'title');

    // Send email notifications
    const meetingLink = `${process.env.FRONTEND_URL}/office-hours/${officeHour._id}`;
    await sendOfficeHourBookingEmail(
      populatedOfficeHour.student.email,
      populatedOfficeHour.student.name,
      populatedOfficeHour.instructor.email,
      populatedOfficeHour.instructor.name,
      `${populatedOfficeHour.course.title} - Office Hour`,
      new Date(startTime).toLocaleString(),
      new Date(endTime).toLocaleString(),
      topic,
      meetingLink
    );

    logger.info(`Office hour created: ${officeHour._id}`);
    res.status(201).json(populatedOfficeHour);
  } catch (error) {
    logger.error('Create office hour error:', error);
    res.status(500).json({ message: "Failed to create office hour", error: error.message });
  }
};

// Get all office hours for instructor or student
export const getOfficeHours = async (req, res) => {
  try {
    const query = req.user.role === 'instructor' 
      ? { instructor: req.user._id }
      : { student: req.user._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const officeHours = await OfficeHour.find(query)
      .populate('instructor', 'name email')
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ startTime: -1 });

    res.json(officeHours);
  } catch (error) {
    logger.error('Get office hours error:', error);
    res.status(500).json({ message: "Failed to get office hours", error: error.message });
  }
};

// Get single office hour details
export const getOfficeHour = async (req, res) => {
  try {
    const officeHour = await OfficeHour.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('student', 'name email')
      .populate('course', 'title');

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    // Check if user has access
    if (officeHour.instructor.toString() !== req.user._id.toString() && 
        officeHour.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this office hour" });
    }

    res.json(officeHour);
  } catch (error) {
    logger.error('Get office hour error:', error);
    res.status(500).json({ message: "Failed to get office hour", error: error.message });
  }
};

// Update office hour
export const updateOfficeHour = async (req, res) => {
  try {
    const officeHour = await OfficeHour.findById(req.params.id);

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    // Only instructor can update before session starts
    if (officeHour.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this office hour" });
    }

    if (officeHour.status !== 'scheduled') {
      return res.status(400).json({ message: "Cannot update an active or completed office hour" });
    }

    const updatedOfficeHour = await OfficeHour.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('instructor', 'name email')
     .populate('student', 'name email')
     .populate('course', 'title');

    // Send update notification email
    const meetingLink = `${process.env.FRONTEND_URL}/office-hours/${officeHour._id}`;
    await sendOfficeHourBookingEmail(
      updatedOfficeHour.student.email,
      updatedOfficeHour.student.name,
      updatedOfficeHour.instructor.email,
      updatedOfficeHour.instructor.name,
      `${updatedOfficeHour.course.title} - Office Hour Update`,
      new Date(updatedOfficeHour.startTime).toLocaleString(),
      new Date(updatedOfficeHour.endTime).toLocaleString(),
      updatedOfficeHour.topic,
      meetingLink
    );

    logger.info(`Office hour updated: ${officeHour._id}`);
    res.json(updatedOfficeHour);
  } catch (error) {
    logger.error('Update office hour error:', error);
    res.status(500).json({ message: "Failed to update office hour", error: error.message });
  }
};

// Cancel office hour
export const cancelOfficeHour = async (req, res) => {
  try {
    const officeHour = await OfficeHour.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('student', 'name email')
      .populate('course', 'title');

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    // Both instructor and student can cancel
    if (officeHour.instructor._id.toString() !== req.user._id.toString() && 
        officeHour.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this office hour" });
    }

    if (officeHour.status !== 'scheduled') {
      return res.status(400).json({ message: "Cannot cancel an active or completed office hour" });
    }

    // Send cancellation emails
    await sendOfficeHourCancellationEmail(
      officeHour.student.email,
      officeHour.student.name,
      officeHour.instructor.email,
      officeHour.instructor.name,
      `${officeHour.course.title} - Office Hour`,
      new Date(officeHour.startTime).toLocaleString(),
      officeHour.topic,
      req.user._id.toString() === officeHour.instructor._id.toString() ? 'instructor' : 'student'
    );

    officeHour.status = 'cancelled';
    await officeHour.save();

    logger.info(`Office hour cancelled: ${officeHour._id}`);
    res.json({ message: "Office hour cancelled successfully" });
  } catch (error) {
    logger.error('Cancel office hour error:', error);
    res.status(500).json({ message: "Failed to cancel office hour", error: error.message });
  }
};

// Start office hour session
export const startSession = async (req, res) => {
  try {
    const officeHour = await OfficeHour.findById(req.params.id);

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    // Only instructor can start session
    if (officeHour.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only instructor can start the session" });
    }

    if (officeHour.status !== 'scheduled') {
      return res.status(400).json({ message: "Session cannot be started" });
    }

    officeHour.status = 'in-progress';
    officeHour.analytics.joinTime = new Date();
    await officeHour.save();

    logger.info(`Office hour session started: ${officeHour._id}`);
    res.json({ 
      message: "Session started successfully",
      roomId: officeHour.meetingData.roomId
    });
  } catch (error) {
    logger.error('Start session error:', error);
    res.status(500).json({ message: "Failed to start session", error: error.message });
  }
};

// End office hour session
export const endSession = async (req, res) => {
  try {
    const officeHour = await OfficeHour.findById(req.params.id);

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    // Only instructor can end session
    if (officeHour.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only instructor can end the session" });
    }

    if (officeHour.status !== 'in-progress') {
      return res.status(400).json({ message: "Session is not in progress" });
    }

    officeHour.status = 'completed';
    officeHour.analytics.leaveTime = new Date();
    
    // Calculate actual duration
    const duration = Math.round(
      (officeHour.analytics.leaveTime - officeHour.analytics.joinTime) / (1000 * 60)
    );
    officeHour.meetingData.duration = duration;

    await officeHour.save();

    logger.info(`Office hour session ended: ${officeHour._id}`);
    res.json({ message: "Session ended successfully" });
  } catch (error) {
    logger.error('End session error:', error);
    res.status(500).json({ message: "Failed to end session", error: error.message });
  }
};

// Add session note
export const addNote = async (req, res) => {
  try {
    const { content } = req.body;
    const officeHour = await OfficeHour.findById(req.params.id);

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    // Both instructor and student can add notes
    if (officeHour.instructor.toString() !== req.user._id.toString() && 
        officeHour.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to add notes" });
    }

    officeHour.notes.push({
      content,
      createdBy: req.user._id
    });

    await officeHour.save();
    logger.info(`Note added to office hour: ${officeHour._id}`);
    res.json(officeHour.notes);
  } catch (error) {
    logger.error('Add note error:', error);
    res.status(500).json({ message: "Failed to add note", error: error.message });
  }
};

// Add session feedback
export const addFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const officeHour = await OfficeHour.findById(req.params.id);

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    // Only student can add feedback
    if (officeHour.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only student can provide feedback" });
    }

    if (officeHour.status !== 'completed') {
      return res.status(400).json({ message: "Can only add feedback after session is completed" });
    }

    officeHour.feedback = {
      rating,
      comment,
      givenAt: new Date()
    };

    await officeHour.save();
    logger.info(`Feedback added to office hour: ${officeHour._id}`);
    res.json(officeHour.feedback);
  } catch (error) {
    logger.error('Add feedback error:', error);
    res.status(500).json({ message: "Failed to add feedback", error: error.message });
  }
};

// Log participant event
export const logEvent = async (req, res) => {
  try {
    const { event } = req.body;
    const officeHour = await OfficeHour.findById(req.params.id);

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    await officeHour.addParticipantEvent(req.user._id, event);
    res.json({ message: "Event logged successfully" });
  } catch (error) {
    logger.error('Log event error:', error);
    res.status(500).json({ message: "Failed to log event", error: error.message });
  }
};

// Update network quality metrics
export const updateNetworkMetrics = async (req, res) => {
  try {
    const { upload, download } = req.body;
    const officeHour = await OfficeHour.findById(req.params.id);

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    await officeHour.updateNetworkQuality(upload, download);
    res.json({ message: "Network metrics updated successfully" });
  } catch (error) {
    logger.error('Update network metrics error:', error);
    res.status(500).json({ message: "Failed to update network metrics", error: error.message });
  }
};

// Upload session recording
export const uploadRecording = async (req, res) => {
  try {
    const officeHour = await OfficeHour.findById(req.params.id);

    if (!officeHour) {
      return res.status(404).json({ message: "Office hour not found" });
    }

    if (officeHour.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only instructor can upload recordings" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No recording file provided" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "office-hours/recordings",
      public_id: `recording-${officeHour._id}-${Date.now()}`,
      overwrite: true,
      resource_type: "video"
    });

    // Update office hour with recording info
    officeHour.recording = {
      enabled: true,
      url: result.secure_url,
      duration: parseInt(req.body.duration || 0),
      createdAt: new Date()
    };

    await officeHour.save();

    // Clean up local file
    fs.unlinkSync(req.file.path);

    logger.info(`Recording uploaded for office hour: ${officeHour._id}`);
    res.json({
      message: "Recording uploaded successfully",
      recording: officeHour.recording
    });
  } catch (error) {
    // Clean up local file if exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    logger.error('Upload recording error:', error);
    res.status(500).json({ message: "Failed to upload recording", error: error.message });
  }
};
