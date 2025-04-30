import path from 'path';
import fs from 'fs';

// Upload a course thumbnail
export const uploadCourseThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    
    // Get the file path relative to the server
    const relativePath = `/uploads/${path.basename(req.file.path)}`;
    
    res.status(200).json({
      message: 'File uploaded successfully',
      filePath: relativePath
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload lesson materials (PDF, video, etc.)
export const uploadLessonMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }
    
    // Get the file path relative to the server
    const relativePath = `/uploads/${path.basename(req.file.path)}`;
    
    res.status(200).json({
      message: 'File uploaded successfully',
      filePath: relativePath,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a file
export const deleteFile = async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath || !filePath.startsWith('/uploads/')) {
      return res.status(400).json({ message: 'Invalid file path' });
    }
    
    // Construct absolute path
    const absolutePath = path.join(__dirname, '..', filePath);
    
    // Check if file exists
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      res.status(200).json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
