const express = require('express');
const { protect } = require('../middleware/auth');
const {
  startSession,
  submitAnswer,
  getHistory,
  getSessionDetails,
  toggleQuestionBookmark,
  deleteSession
} = require('../controllers/interviewController');

const router = express.Router();

// Secure all mock interview endpoints
router.use(protect);

router.post('/start', startSession);
router.post('/submit-answer', submitAnswer);
router.get('/history', getHistory);
router.get('/session/:id', getSessionDetails);
router.post('/question/:id/bookmark', toggleQuestionBookmark);
router.delete('/session/:id', deleteSession);

module.exports = router;
