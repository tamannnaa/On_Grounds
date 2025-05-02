const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/documents');
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/profile-photos');
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image, PDF, and document files are allowed!'));
  }
};

const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir;
      
      if (file.fieldname === 'profilePhoto') {
        uploadDir = path.join(__dirname, '../public/uploads/profile-photos');
      } else {
        uploadDir = path.join(__dirname, '../public/uploads/documents');
      }
      
      ensureDirectoryExists(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
}).fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'collegeId', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'additionalDoc', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]);

module.exports = {
  documentUpload
};