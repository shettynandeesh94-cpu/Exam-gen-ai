const Document = require('../models/Document');
const ragService = require('../services/ragService');
const { getAssistantResponse } = require('../services/assistantService');

/**
 * @desc    Interact with the AI Assistant
 * @route   POST /api/assistant/chat
 * @access  Private
 */
const chatWithAssistant = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide message history as an array of message objects.',
      });
    }

    // Fetch user documents to supply context of uploaded files
    const documents = await Document.find({ user: req.user.id })
      .select('originalName subject')
      .sort({ createdAt: -1 });

    const userDocuments = documents.map(doc => ({
      title: doc.originalName,
      subject: doc.subject
    }));

    // Perform RAG semantic chunk retrieval based on user's query
    const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
    const userQuery = lastUserMessage ? lastUserMessage.text : '';

    let ragContext = [];
    if (userQuery && documents.length > 0) {
      try {
        const chunks = await ragService.searchRelevantChunks({
          userId: req.user.id,
          queryText: userQuery,
          limit: 5
        });
        
        ragContext = chunks.map(c => ({
          source: c.document ? c.document.originalName : 'Unknown Document',
          text: c.text
        }));
      } catch (err) {
        console.warn("RAG retrieval failed, proceeding with name-only context:", err);
      }
    }

    const reply = await getAssistantResponse(messages, userDocuments, ragContext);

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { chatWithAssistant };
