const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const ragService = require('../services/ragService');
const { sendNotification } = require('../services/notificationService');

/**
 * @desc    Upload a PDF and extract text
 * @route   POST /api/documents/upload
 * @access  Private
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file',
      });
    }

    const { subject } = req.body;

    // Create document record in DB first
    const document = await Document.create({
      user:         req.user.id,
      originalName: req.file.originalname,
      fileName:     req.file.filename,
      filePath:     req.file.path,
      fileSize:     req.file.size,
      subject:      subject || 'General',
      processingStatus: 'processing',
    });

    // Read and parse the PDF file
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    // Save extracted text
    document.extractedText     = pdfData.text;
    await document.save();

    // Index the document chunks & embeddings for RAG
    await ragService.indexDocument(document._id, req.user.id, pdfData.text);

    // Mark as completed
    document.processingStatus  = 'completed';
    await document.save();

    // Send real-time notification
    await sendNotification(req.user.id, {
      text: `Document "${document.originalName}" processed successfully.`,
      type: 'success',
    });

    res.status(201).json({
      success: true,
      message: 'PDF uploaded and processed successfully',
      document: {
        id:           document._id,
        originalName: document.originalName,
        subject:      document.subject,
        fileSize:     document.fileSize,
        textLength:   pdfData.text.length,
        pages:        pdfData.numpages,
        status:       document.processingStatus,
        createdAt:    document.createdAt,
      },
    });
  } catch (error) {
    // Mark document as failed if PDF parse fails
    if (req.file) {
      const failedDoc = await Document.findOneAndUpdate(
        { fileName: req.file.filename },
        { processingStatus: 'failed', processingError: error.message },
        { new: true }
      );
      if (failedDoc) {
        await sendNotification(req.user.id, {
          text: `Document "${failedDoc.originalName}" processing failed.`,
          type: 'error',
        });
      }
    }
    next(error);
  }
};

/**
 * @desc    Get all documents for logged-in user
 * @route   GET /api/documents
 * @access  Private
 */
const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ user: req.user.id })
      .select('-extractedText') // Don't send full text in list view
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single document by ID
 * @route   GET /api/documents/:id
 * @access  Private
 */
const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id:  req.params.id,
      user: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.status(200).json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a document
 * @route   DELETE /api/documents/:id
 * @access  Private
 */
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id:  req.params.id,
      user: req.user.id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Delete physical file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Clean up RAG chunks
    await DocumentChunk.deleteMany({ document: document._id });

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadDocument, getDocuments, getDocument, deleteDocument };
