const Test = require('../models/Test');
const Question = require('../models/Question');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const { generateQuestions } = require('../services/questionGenerator');
const { sendNotification } = require('../services/notificationService');
const { runDsaCode } = require('../services/codeRunner');

// Helper: Format Mongoose Question object to frontend format
const formatQuestionForClient = (q) => {
  const base = {
    id: q._id,
    type: q.type,
    question: q.questionText,
    marks: q.maxMarks,
    topic: q.topic,
    difficulty: q.difficulty,
  };

  if (q.type === 'mcq' || q.type === 'aptitude') {
    // Map options object to array
    const opts = q.options || {};
    base.options = [opts.A || '', opts.B || '', opts.C || '', opts.D || ''];
    // Map correctAnswer string (A, B, C, D) to index (0, 1, 2, 3)
    const map = { A: 0, B: 1, C: 2, D: 3 };
    base.correctOption = map[q.correctAnswer] !== undefined ? map[q.correctAnswer] : 0;
    base.explanation = q.explanation || '';
  } else if (q.type === 'dsa') {
    base.questionTitle = q.questionTitle || '';
    base.constraints = q.constraints || '';
    base.inputFormat = q.inputFormat || '';
    base.outputFormat = q.outputFormat || '';
    base.sampleInput = q.sampleInput || '';
    base.sampleOutput = q.sampleOutput || '';
    base.javaSignature = q.javaSignature || '';
    base.expectedTimeComplexity = q.expectedTimeComplexity || '';
    base.expectedSpaceComplexity = q.expectedSpaceComplexity || '';
    base.starterCode = q.starterCode || '';
    base.starterTemplates = {
      javascript: q.starterTemplates?.javascript || q.starterCode || `function solve(nums) {\n  // Write your JavaScript code here\n  return 0;\n}`,
      python: q.starterTemplates?.python || `def solve(nums):\n    # Write your Python code here\n    pass`,
      java: q.starterTemplates?.java || q.javaSignature || `public class Solution {\n    public int solve(int[] nums) {\n        // Write your Java code here\n        return 0;\n    }\n}`,
      cpp: q.starterTemplates?.cpp || `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int solve(vector<int>& nums) {\n        // Write your C++ code here\n        return 0;\n    }\n};`,
      c: q.starterTemplates?.c || `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\nint solve(int* nums, int numsSize) {\n    // Write your C code here\n    return 0;\n}`
    };
    base.testCases = q.testCases || '';
  } else if (q.type === 'short' || q.type === 'long') {
    base.modelAnswer = q.modelAnswer;
  } else if (q.type === 'scenario') {
    base.scenarioText = q.questionText;
    base.subQuestions = (q.subQuestions || []).map((sub, idx) => {
      const subFormatted = {
        id: `${q._id}_${idx}`, // Create unique sub-id
        type: sub.type,
        question: sub.questionText,
        marks: sub.maxMarks,
        modelAnswer: sub.modelAnswer,
        explanation: sub.explanation
      };
      if (sub.type === 'mcq') {
        const subOpts = sub.options || {};
        subFormatted.options = [subOpts.A || '', subOpts.B || '', subOpts.C || '', subOpts.D || ''];
        const map = { A: 0, B: 1, C: 2, D: 3 };
        subFormatted.correctOption = map[sub.correctAnswer] !== undefined ? map[sub.correctAnswer] : 0;
      }
      return subFormatted;
    });
  }

  return base;
};

/**
 * @desc    Generate a new practice test from Document
 * @route   POST /api/tests/generate
 * @access  Private
 */
const generateTest = async (req, res, next) => {
  try {
    const { documentId, subject, difficulty, mcqCount, dsaCount, aptitudeCount, shortCount, longCount, scenarioCount, topic, questionSource, timeLimit } = req.body;

    let document = null;
    let docSubject = subject || 'General';
    let docName = 'General Knowledge Manual';
    let contextText = '';
    let docIdToSave = documentId || null;

    if (Number(aptitudeCount) > 0) {
      docIdToSave = null;
      docSubject = topic || 'Mixed Aptitude';
      docName = `Aptitude Topic: ${docSubject}`;
      contextText = '';
    } else if (documentId) {
      document = await Document.findOne({ _id: documentId, user: req.user.id });
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }
      docSubject = document.subject;
      docName = document.originalName;

      // Query document chunks, sort by chunkIndex
      const chunks = await DocumentChunk.find({ document: documentId }).sort({ chunkIndex: 1 });
      if (chunks.length > 0) {
        let selectedChunks = [];
        if (chunks.length <= 15) {
          selectedChunks = chunks;
        } else {
          // Select 15 chunks evenly distributed across the document
          const step = chunks.length / 15;
          for (let i = 0; i < 15; i++) {
            const idx = Math.floor(i * step);
            selectedChunks.push(chunks[idx]);
          }
        }
        contextText = selectedChunks.map(c => c.text).join('\n\n---\n\n');
      } else {
        // Fallback to full extracted text if chunks are not indexed yet
        contextText = document.extractedText || '';
      }
    } else {
      docSubject = subject || 'General';
      docName = `Manual Topic: ${docSubject}`;
    }

    if (Number(dsaCount) > 0 && topic) {
      docSubject = topic === 'Mixed' ? 'DSA Coding' : topic;
      docName = `DSA Topic: ${docSubject}`;
    }

    // Call Gemini question generator service
    const questionsData = await generateQuestions(
      contextText,
      docSubject,
      difficulty || 'Medium',
      {
        mcqCount: Number(mcqCount) || 0,
        dsaCount: Number(dsaCount) || 0,
        aptitudeCount: Number(aptitudeCount) || 0,
        shortCount: Number(shortCount) || 0,
        longCount: Number(longCount) || 0,
        scenarioCount: Number(scenarioCount) || 0,
        topic: topic || 'Mixed',
        questionSource: questionSource || 'AI Generated'
      }
    );

    // Build Mongoose Test Document
    const test = await Test.create({
      user: req.user.id,
      document: docIdToSave,
      title: `Practice Exam: ${docSubject}`,
      subject: docSubject,
      difficulty: (difficulty || 'medium').toLowerCase(),
      config: {
        mcqCount: Number(mcqCount) || 0,
        dsaCount: Number(dsaCount) || 0,
        aptitudeCount: Number(aptitudeCount) || 0,
        shortCount: Number(shortCount) || 0,
        longCount: Number(longCount) || 0,
        scenarioCount: Number(scenarioCount) || 0,
      },
      status: 'ready'
    });

    let totalMarks = 0;
    const questionsList = [];

    // Save generated questions to DB
    for (const q of questionsData) {
      const qType = q.type || (Number(aptitudeCount) > 0 ? 'aptitude' : 'mcq');
      const qSection = q.section || (qType === 'dsa' ? 'dsa' : (qType === 'aptitude' ? 'aptitude' : 'mcq'));
      const dbQ = await Question.create({
        test: test._id,
        document: docIdToSave,
        type: qType,
        section: qSection,
        questionText: q.questionText || q.question || '',
        questionTitle: q.questionTitle || '',
        constraints: q.constraints || '',
        inputFormat: q.inputFormat || '',
        outputFormat: q.outputFormat || '',
        sampleInput: q.sampleInput || '',
        sampleOutput: q.sampleOutput || '',
        javaSignature: q.javaSignature || '',
        expectedTimeComplexity: q.expectedTimeComplexity || '',
        expectedSpaceComplexity: q.expectedSpaceComplexity || '',
        options: q.options || {},
        correctAnswer: q.correctAnswer || '',
        maxMarks: q.maxMarks || (qType === 'dsa' ? 10 : 2),
        difficulty: (difficulty || 'medium').toLowerCase(),
        topic: q.topic || docSubject || 'General Concepts',
        explanation: q.explanation || '',
        modelAnswer: q.modelAnswer || '',
        starterCode: q.starterCode || '',
        starterTemplates: q.starterTemplates || {},
        testCases: q.testCases ? (typeof q.testCases === 'string' ? q.testCases : JSON.stringify(q.testCases)) : '',
        hiddenTestCases: q.hiddenTestCases ? (typeof q.hiddenTestCases === 'string' ? q.hiddenTestCases : JSON.stringify(q.hiddenTestCases)) : '',
        subQuestions: q.subQuestions || []
      });

      if (q.type === 'scenario') {
        const scenarioMarks = (q.subQuestions || []).reduce((sum, sub) => sum + (sub.maxMarks || 0), 0);
        dbQ.maxMarks = scenarioMarks;
        await dbQ.save();
        totalMarks += scenarioMarks;
      } else {
        totalMarks += dbQ.maxMarks;
      }
      questionsList.push(dbQ);
    }

    // Calculate duration: 2 mins per MCQ, 15 mins per DSA, 2 mins per Aptitude, 5 mins per short, 10 mins per long/scenario
    let duration = (Number(mcqCount) * 2) + (Number(dsaCount) * 15) + (Number(aptitudeCount) * 2) + (Number(shortCount) * 5) + (Number(longCount) * 10) + (Number(scenarioCount) * 12) || 45;

    if (timeLimit) {
      if (timeLimit === 'No Limit') {
        duration = 9999;
      } else {
        const parsedLimit = parseInt(timeLimit);
        if (!isNaN(parsedLimit)) {
          duration = parsedLimit;
        }
      }
    }

    test.totalMarks = totalMarks;
    test.durationMinutes = duration;
    await test.save();

    // Send real-time notification
    await sendNotification(req.user.id, {
      text: `Your practice test on "${docSubject}" (${difficulty || 'Medium'}) has been generated.`,
      type: 'info',
    });

    // Map questions to categories for response
    const clientMcqs = questionsList.filter(q => q.type === 'mcq').map(formatQuestionForClient);
    const clientDsas = questionsList.filter(q => q.type === 'dsa').map(formatQuestionForClient);
    const clientAptitudes = questionsList.filter(q => q.type === 'aptitude').map(formatQuestionForClient);
    const clientShorts = questionsList.filter(q => q.type === 'short').map(formatQuestionForClient);
    const clientLongs = questionsList.filter(q => q.type === 'long').map(formatQuestionForClient);
    const clientScenarios = questionsList.filter(q => q.type === 'scenario').map(formatQuestionForClient);

    res.status(201).json({
      success: true,
      message: 'Test compiled successfully by ExamGen AI engine',
      test: {
        _id: test._id,
        documentId: test.document || null,
        documentName: docName,
        subject: test.subject,
        difficulty: test.difficulty,
        duration: test.durationMinutes,
        questions: {
          mcq: clientMcqs,
          dsa: clientDsas,
          aptitude: clientAptitudes,
          short: clientShorts,
          long: clientLongs,
          scenario: clientScenarios
        },
        createdAt: test.createdAt
      }
    });
  } catch (error) {
    // Return friendly error response instead of 500 crashes
    res.status(400).json({
      success: false,
      message: error.message || 'Error occurred during AI question generation.'
    });
  }
};

/**
 * @desc    Get all tests for logged-in user
 * @route   GET /api/tests
 * @access  Private
 */
const getTests = async (req, res, next) => {
  try {
    const tests = await Test.find({ user: req.user.id })
      .populate('document', 'originalName')
      .sort({ createdAt: -1 });

    const formattedTests = tests.map(t => ({
      _id: t._id,
      documentId: t.document ? t.document._id : null,
      documentName: t.document ? t.document.originalName : 'General Knowledge Base',
      subject: t.subject,
      difficulty: t.difficulty,
      duration: t.durationMinutes,
      status: t.status,
      createdAt: t.createdAt
    }));

    res.status(200).json({
      success: true,
      count: formattedTests.length,
      tests: formattedTests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single test by ID
 * @route   GET /api/tests/:id
 * @access  Private
 */
const getTest = async (req, res, next) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, user: req.user.id })
      .populate('document', 'originalName');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const questions = await Question.find({ test: test._id }).sort({ createdAt: 1 });

    const clientMcqs = questions.filter(q => q.type === 'mcq').map(formatQuestionForClient);
    const clientDsas = questions.filter(q => q.type === 'dsa').map(formatQuestionForClient);
    const clientAptitudes = questions.filter(q => q.type === 'aptitude').map(formatQuestionForClient);
    const clientShorts = questions.filter(q => q.type === 'short').map(formatQuestionForClient);
    const clientLongs = questions.filter(q => q.type === 'long').map(formatQuestionForClient);
    const clientScenarios = questions.filter(q => q.type === 'scenario').map(formatQuestionForClient);

    res.status(200).json({
      success: true,
      test: {
        _id: test._id,
        documentId: test.document ? test.document._id : null,
        documentName: test.document ? test.document.originalName : 'General Knowledge Base',
        subject: test.subject,
        difficulty: test.difficulty,
        duration: test.durationMinutes,
        status: test.status,
        questions: {
          mcq: clientMcqs,
          dsa: clientDsas,
          aptitude: clientAptitudes,
          short: clientShorts,
          long: clientLongs,
          scenario: clientScenarios
        },
        createdAt: test.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulate and track javascript code output securely using Node vm sandbox
 * @route   POST /api/tests/run-code
 * @access  Private
 */
const runCode = async (req, res, next) => {
  try {
    const { code, language = 'javascript', testCases = '[]', functionName = 'solve' } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'No code provided to execute.' });
    }

    const runResult = await runDsaCode(code, language, testCases, functionName);

    if (!runResult.success && runResult.error && !runResult.results) {
      return res.status(400).json({ success: false, message: runResult.error });
    }

    res.status(200).json({
      success: true,
      result: runResult.result || '',
      results: runResult.results || [],
      error: runResult.error || null,
      logs: runResult.logs || [],
      executionTimeMs: runResult.executionTimeMs || 0
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateTest, getTests, getTest, runCode };
