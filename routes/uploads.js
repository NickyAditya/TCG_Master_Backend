const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define temporary storage strategy for multer
// We'll store in a default location first and move it after getting form data
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define base upload path - this should point to your frontend public images folder
    const basePath = path.join(__dirname, '../../frontend/public/images/cards/temp');
    
    // Create temp folder if it doesn't exist
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
    
    cb(null, basePath);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using timestamp and original extension
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  }
});

// Route for file upload
router.post('/', upload.single('cardImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Get category from the request body
    // Validate that category is one of the allowed values
    let category = req.body.category || '';
    if (!['pokemon', 'yugioh', 'mtg'].includes(category)) {
      category = 'misc'; // Fallback to misc if invalid
    }
    
    // Setup paths for moving the file
    const basePath = path.join(__dirname, '../../frontend/public/images/cards');
    const tempFilePath = req.file.path;
    const targetDir = path.join(basePath, category);
    const targetPath = path.join(targetDir, req.file.filename);
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Move the file from temp to the correct category folder
    fs.renameSync(tempFilePath, targetPath);
    
    // Calculate relative path for frontend use
    const relativePath = `/images/cards/${category}/${req.file.filename}`;
    
    console.log(`File uploaded successfully to ${category} folder: ${relativePath}`);
    
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      filePath: relativePath,
      category: category
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

module.exports = router;
