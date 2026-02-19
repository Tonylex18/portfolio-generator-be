import multer from 'multer';
import path from 'path';



// I'm using multer.memoryStorage so the file can be stored in memory for buffer to be generated for cloud uplaod
const storage = multer.memoryStorage()

// File filter to ensure only image files are uploaded
const imageFileFilter = (req: any, file: any, cb: any) => {

// allow files to be uploaded and not just images

  try {
    const fileTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt/; // Allowed file types
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Only images and documents are allowed!'));
    }
  } catch (error: any) {
    console.log("Error:", error);
    throw new Error(error)
  }

};

const limits = { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits
});

const uploadFiles = multer({
  storage,
  fileFilter: imageFileFilter,
  limits
})

// Allow any file format (images, documents, etc.)
const uploadAny = multer({
  storage,
  limits
});

const uploadAnyFiles = multer({
  storage,
  limits
})

export default { upload, uploadFiles, uploadAny, uploadAnyFiles };
