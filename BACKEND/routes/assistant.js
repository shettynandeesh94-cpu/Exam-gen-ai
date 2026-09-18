const express = require('express');
const { protect } = require('../middleware/auth');
const { chatWithAssistant } = require('../controllers/assistantController');

const router = express.Router();

// Secure all assistant routes
router.use(protect);

// POST /api/assistant/chat
router.post('/chat', chatWithAssistant);

module.exports = router;
