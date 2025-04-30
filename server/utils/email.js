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
    
    const content = `Hello ${name}, Welcome to ProLearn LMS! You now have access to all our courses.`;
    logEmailAttempt(to, 'Welcome to ProLearn LMS', content);
    
    return { success: true };
  } catch (error) {
    logger.error('Email sending error:', error);
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
