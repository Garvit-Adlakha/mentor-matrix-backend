import multer from "multer";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-7z-compressed', 'application/x-rar-compressed',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log('Rejected file:', file.originalname, file.mimetype);
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

export const uploadFile = upload.single("file");
export const uploadAvatar = upload.single("avatar");

