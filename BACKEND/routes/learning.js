const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getLearningProgress,
  toggleBookmark,
  toggleComplete,
  recordView,
  getNotes,
  generateTopicTest,
  askAITopic
} = require('../controllers/learningController');

const router = express.Router();

// Secure all learning routes
router.use(protect);

router.get('/progress',       getLearningProgress);
router.post('/toggle-bookmark', toggleBookmark);
router.post('/toggle-complete', toggleComplete);
router.post('/record-view',     recordView);
router.get('/notes',            getNotes);
router.post('/generate-test',   generateTopicTest);
router.post('/ask-ai',          askAITopic);

module.exports = router;
