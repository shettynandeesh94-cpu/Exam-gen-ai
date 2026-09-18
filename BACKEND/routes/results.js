const express = require('express');
const { protect } = require('../middleware/auth');
const {
  submitTest,
  getResults,
  getResult,
} = require('../controllers/resultController');

const router = express.Router();

// Protect all results routes
router.use(protect);

router.post('/submit', submitTest);
router.get('/',        getResults);
router.get('/:id',     getResult);

module.exports = router;
