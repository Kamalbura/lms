// Email service for both development and production environments
import logger from './logger.js';
import nodemailer from 'nodemailer';

// Configure email transporter based on environment
let transporter;

if (process.env.NODE_ENV === 'production') {
  // Production email transporter
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  // Verify connection
  transporter.verify()
    .then(() => {
      logger.info('Email service connected successfully');
    })
    .catch((error) => {
      logger.error(`Email service connection error: ${error.message}`);
    });
}

// Mock transporter (just logs instead of sending in development)
const logEmailAttempt = (to, subject, content) => {
  logger.info(`📧 EMAIL WOULD BE SENT (DEV MODE)`, {
    metadata: {
      to,
      subject,
      contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    }
  });

  console.log('------------------------------');
  console.log(`📧 EMAIL WOULD BE SENT (DEV MODE)`);
  console.log(`📨 To: ${to}`);
  console.log(`📑 Subject: ${subject}`);
  console.log(`📄 Content: ${content.substring(0, 100)}...`);
  console.log('------------------------------');
};

// Send email (real in production, mock in development)
const sendEmail = async (to, subject, content) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // In development, just log the email
      logEmailAttempt(to, subject, content);
      return { success: true };
    } else {
      // In production, send real email
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"ProLearn LMS" <noreply@prolearn.com>',
        to,
        subject,
        html: content,
      });
      
      logger.info(`Email sent to ${to}: ${subject}`);
      return { success: true };
    }
  } catch (error) {
    logger.error(`Email sending error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (to, name) => {
  try {
    if (!to || !name) {
      logger.warn('Missing required parameters for welcome email');
      return { success: false, error: 'Missing required parameters' };
    }
    
    const subject = 'Welcome to ProLearn LMS!';
    const content = `Hello ${name}, Welcome to ProLearn LMS! You now have access to all our courses.`;
    
    return await sendEmail(to, subject, content);
  } catch (error) {
    logger.error(`Error sending welcome email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send assessment completion notification
export const sendAssessmentResultEmail = async (to, name, assessmentTitle, score, maxScore, percentage) => {
  try {
    if (!to || !name || !assessmentTitle) {
      logger.warn('Missing required parameters for assessment result email');
      return { success: false, error: 'Missing required parameters' };
    }
    
    const content = `Hello ${name}, You have completed the assessment: ${assessmentTitle}. Your score: ${score}/${maxScore} (${percentage}%)`;
    return await sendEmail(to, `Assessment Result: ${assessmentTitle}`, content);
  } catch (error) {
    logger.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send office hour booking confirmation email
export const sendOfficeHourBookingEmail = async (
  studentEmail,
  studentName,
  instructorEmail,
  instructorName,
  sessionTitle,
  startTime,
  endTime,
  topic,
  meetingLink
) => {
  try {
    if (!studentEmail || !instructorEmail || !startTime) {
      logger.warn('Missing required parameters for office hour booking email');
      return { success: false, error: 'Missing required parameters' };
    }

    // Email to student
    const studentSubject = `Office Hour Booking Confirmation: ${sessionTitle}`;
    const studentContent = `
      Hello ${studentName},
      
      Your office hour session has been confirmed:
      
      Session: ${sessionTitle}
      Topic: ${topic}
      Instructor: ${instructorName}
      Date/Time: ${startTime} - ${endTime}
      Meeting Link: ${meetingLink}
      
      Please be punctual and prepared with your questions.
      
      Best regards,
      The ProLearn Team
    `;

    // Email to instructor
    const instructorSubject = `New Office Hour Booking: ${sessionTitle}`;
    const instructorContent = `
      Hello ${instructorName},
      
      A student has booked an office hour session with you:
      
      Session: ${sessionTitle}
      Topic: ${topic}
      Student: ${studentName}
      Date/Time: ${startTime} - ${endTime}
      Meeting Link: ${meetingLink}
      
      The meeting link has been shared with the student.
      
      Best regards,
      The ProLearn Team
    `;

    const studentEmailResult = await sendEmail(studentEmail, studentSubject, studentContent);
    const instructorEmailResult = await sendEmail(instructorEmail, instructorSubject, instructorContent);

    if (studentEmailResult.success && instructorEmailResult.success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send one or more emails' };
    }
  } catch (error) {
    logger.error(`Error sending office hour booking emails: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send office hour cancellation email
export const sendOfficeHourCancellationEmail = async (
  studentEmail,
  studentName,
  instructorEmail,
  instructorName,
  sessionTitle,
  startTime,
  topic,
  cancelledBy
) => {
  try {
    if (!studentEmail || !instructorEmail || !startTime) {
      logger.warn('Missing required parameters for office hour cancellation email');
      return { success: false, error: 'Missing required parameters' };
    }

    const canceller = cancelledBy === 'instructor' ? instructorName : studentName;

    // Email to student
    const studentSubject = `Office Hour Session Cancelled: ${sessionTitle}`;
    const studentContent = `
      Hello ${studentName},
      
      Your office hour session has been cancelled by ${canceller}:
      
      Session: ${sessionTitle}
      Topic: ${topic}
      Originally scheduled for: ${startTime}
      
      Please reschedule at your convenience.
      
      Best regards,
      The ProLearn Team
    `;

    // Email to instructor
    const instructorSubject = `Office Hour Session Cancelled: ${sessionTitle}`;
    const instructorContent = `
      Hello ${instructorName},
      
      The following office hour session has been cancelled by ${canceller}:
      
      Session: ${sessionTitle}
      Topic: ${topic}
      Student: ${studentName}
      Originally scheduled for: ${startTime}
      
      Best regards,
      The ProLearn Team
    `;

    const studentEmailResult = await sendEmail(studentEmail, studentSubject, studentContent);
    const instructorEmailResult = await sendEmail(instructorEmail, instructorSubject, instructorContent);

    if (studentEmailResult.success && instructorEmailResult.success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send one or more emails' };
    }
  } catch (error) {
    logger.error(`Error sending office hour cancellation emails: ${error.message}`);
    return { success: false, error: error.message };
  }
};
