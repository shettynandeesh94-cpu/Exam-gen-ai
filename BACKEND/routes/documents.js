const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  deleteDocument,
} = require('../controllers/documentController');

const router = express.Router();

// All document routes are protected (require login)
router.use(protect);

router.post('/upload', upload.single('pdf'), uploadDocument);
router.get('/',        getDocuments);
router.get('/:id',     getDocument);
router.delete('/:id',  deleteDocument);

module.exports = router;
