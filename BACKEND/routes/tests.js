const express = require('express');
const { protect } = require('../middleware/auth');
const {
  generateTest,
  getTests,
  getTest,
  runCode,
} = require('../controllers/testController');

const router = express.Router();

// Protect all test routes
router.use(protect);

router.post('/generate', generateTest);
router.post('/run-code', runCode);
router.get('/', getTests);
router.get('/:id', getTest);

module.exports = router;
