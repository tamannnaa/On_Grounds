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
  const fileExt = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  console.log('Uploading file:', file.originalname);
  console.log('Extension:', fileExt);
  console.log('MIME type:', mimeType);

  const extAllowed = ['.jpeg', '.jpg', '.png', '.gif', '.pdf', '.doc', '.docx'];
  const mimeAllowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (extAllowed.includes(fileExt) && mimeAllowed.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Only image, PDF, and document files are allowed!`));
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