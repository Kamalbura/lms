// Email service for both development and production environments
import logger from './logger.js';

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

// Send welcome email
export const sendWelcomeEmail = async (to, name) => {
  try {
    if (!to || !name) {
      logger.warn('Missing required parameters for welcome email');
      return { success: false, error: 'Missing required parameters' };
    }
    
    const subject = 'Welcome to ProLearn LMS!';
    const content = `Hello ${name}, Welcome to ProLearn LMS! You now have access to all our courses.`;
    
    // In development, just log the email
    if (process.env.NODE_ENV !== 'production') {
      logEmailAttempt(to, subject, content);
      return { success: true };
    } else {
      // In production, we would send a real email
      // This would be implemented with a real email service
      // like SendGrid, Mailgun, AWS SES, etc.
      logEmailAttempt(to, subject, content); // Fallback to log for now
      
      // TODO: Implement actual email sending in production
      // const result = await emailService.send({
      //   to,
      //   subject,
      //   html: content
      // });
      
      logger.info(`Welcome email sent to ${to}`);
      return { success: true };
    }
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
    logEmailAttempt(to, `Assessment Result: ${assessmentTitle}`, content);
    
    return { success: true };
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

    // In development, just log the emails
    if (process.env.NODE_ENV !== 'production') {
      logEmailAttempt(studentEmail, studentSubject, studentContent);
      logEmailAttempt(instructorEmail, instructorSubject, instructorContent);
      return { success: true };
    } else {
      // In production, we would send real emails
      logEmailAttempt(studentEmail, studentSubject, studentContent);
      logEmailAttempt(instructorEmail, instructorSubject, instructorContent);
      
      // TODO: Implement actual email sending in production
      
      logger.info(`Office hour booking emails sent to ${studentEmail} and ${instructorEmail}`);
      return { success: true };
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

    // In development, just log the emails
    if (process.env.NODE_ENV !== 'production') {
      logEmailAttempt(studentEmail, studentSubject, studentContent);
      logEmailAttempt(instructorEmail, instructorSubject, instructorContent);
      return { success: true };
    } else {
      // In production, we would send real emails
      logEmailAttempt(studentEmail, studentSubject, studentContent);
      logEmailAttempt(instructorEmail, instructorSubject, instructorContent);
      
      // TODO: Implement actual email sending in production
      
      logger.info(`Office hour cancellation emails sent to ${studentEmail} and ${instructorEmail}`);
      return { success: true };
    }
  } catch (error) {
    logger.error(`Error sending office hour cancellation emails: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// For future: add real email sending functionality for production
// This would involve using a library like nodemailer
// Example implementation:
/*
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: Boolean(process.env.EMAIL_SECURE),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendRealEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    logger.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};
*/
