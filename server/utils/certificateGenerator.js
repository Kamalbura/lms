import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import { uploadFile } from './cloudinary.js';
import logger from './logger.js';

// Ensure temp directory exists for certificate generation
const tempDir = path.join('uploads', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

class CertificateGenerator {
  constructor() {
    this.templates = {
      default: {
        background: 'templates/default-bg.png',
        font: 'Helvetica',
        titleFont: 'Helvetica-Bold',
        color: '#2563EB',
        textColor: '#1F2937'
      },
      professional: {
        background: 'templates/pro-bg.png',
        font: 'Times-Roman',
        titleFont: 'Times-Bold',
        color: '#1E40AF',
        textColor: '#111827'
      }
    };
  }

  async generateCertificate(data) {
    try {
      const {
        studentName,
        courseName,
        completionDate,
        instructorName,
        courseId,
        userId,
        template = 'default'
      } = data;

      const certificateId = nanoid(10);
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4'
      });

      // Set up the template
      const templateConfig = this.templates[template] || this.templates.default;

      // Stream to temporary file
      const tempPath = path.join('uploads', 'temp', `${certificateId}.pdf`);
      const stream = fs.createWriteStream(tempPath);

      // Pipe PDF to write stream
      doc.pipe(stream);

      // Add background if exists
      if (fs.existsSync(templateConfig.background)) {
        doc.image(templateConfig.background, 0, 0, {width: doc.page.width, height: doc.page.height});
      }

      // Generate verification QR code
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-certificate/${certificateId}`;
      const qrCodePath = path.join('uploads', 'temp', `${certificateId}-qr.png`);
      await QRCode.toFile(qrCodePath, verificationUrl);

      // Add content
      doc
        .font(templateConfig.titleFont)
        .fontSize(40)
        .fillColor(templateConfig.color)
        .text('CERTIFICATE OF COMPLETION', {align: 'center'})
        .moveDown(0.5);

      doc
        .font(templateConfig.font)
        .fontSize(24)
        .fillColor(templateConfig.textColor)
        .text('This is to certify that', {align: 'center'})
        .moveDown(0.5);

      doc
        .font(templateConfig.titleFont)
        .fontSize(32)
        .fillColor(templateConfig.color)
        .text(studentName, {align: 'center'})
        .moveDown(0.5);

      doc
        .font(templateConfig.font)
        .fontSize(24)
        .fillColor(templateConfig.textColor)
        .text('has successfully completed the course', {align: 'center'})
        .moveDown(0.5);

      doc
        .font(templateConfig.titleFont)
        .fontSize(28)
        .fillColor(templateConfig.color)
        .text(courseName, {align: 'center'})
        .moveDown(0.5);

      doc
        .font(templateConfig.font)
        .fontSize(20)
        .fillColor(templateConfig.textColor)
        .text(`Completed on ${new Date(completionDate).toLocaleDateString()}`, {align: 'center'})
        .moveDown(1);

      // Add instructor signature
      doc
        .fontSize(20)
        .text(`${instructorName}`, {align: 'center'})
        .fontSize(16)
        .text('Course Instructor', {align: 'center'})
        .moveDown(0.5);

      // Add QR code
      doc.image(qrCodePath, doc.page.width - 150, doc.page.height - 150, {
        fit: [100, 100],
        align: 'right',
        valign: 'bottom'
      });

      // Add certificate ID
      doc
        .fontSize(12)
        .fillColor('#6B7280')
        .text(`Certificate ID: ${certificateId}`, 50, doc.page.height - 50);

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      await new Promise((resolve) => stream.on('finish', resolve));

      // Upload to Cloudinary
      const uploadResult = await uploadFile(tempPath, {
        folder: 'certificates',
        public_id: certificateId,
        resource_type: 'raw'
      });

      if (!uploadResult.success) {
        throw new Error(`Failed to upload certificate: ${uploadResult.error}`);
      }

      // Clean up temporary files
      fs.unlinkSync(tempPath);
      fs.unlinkSync(qrCodePath);

      // Return certificate data
      return {
        certificateId,
        certificateUrl: uploadResult.url,
        verificationUrl
      };
    } catch (error) {
      logger.error('Certificate generation failed:', error);
      throw new Error('Failed to generate certificate');
    }
  }

  async verifyCertificate(certificateId) {
    try {
      // Import models dynamically to avoid circular dependencies
      const Certificate = (await import('../models/Certificate.js')).default;
      
      // Check if certificate exists in database
      const certificate = await Certificate.findOne({ certificateId })
        .populate('student', 'name email')
        .populate('course', 'title');
      
      if (!certificate) {
        return {
          isValid: false,
          message: 'Certificate not found or invalid'
        };
      }
      
      return {
        isValid: true,
        details: {
          certificateId,
          studentName: certificate.student.name,
          courseName: certificate.course.title,
          completionDate: certificate.issuedAt.toISOString().split('T')[0],
          instructorName: certificate.issuedBy || 'Course Instructor'
        }
      };
    } catch (error) {
      logger.error('Certificate verification failed:', error);
      throw new Error('Failed to verify certificate');
    }
  }
}

export default new CertificateGenerator();