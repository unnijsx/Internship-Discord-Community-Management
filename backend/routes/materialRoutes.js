const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadMaterial, getMaterials } = require('../controllers/materialController');
const verifyToken = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.use(verifyToken); // Protect all material routes

router.post('/', upload.single('file'), uploadMaterial);
router.get('/', getMaterials);

module.exports = router;
