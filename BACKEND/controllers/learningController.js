const LearningNote = require('../models/LearningNote');
const UserProgress = require('../models/UserProgress');
const Test = require('../models/Test');
const Question = require('../models/Question');
const { branchCatalog } = require('../config/learningCatalog');
const { sendNotification } = require('../services/notificationService');

// Helper to get total topic counts per branch
const getCatalogCounts = () => {
  const counts = { CSE: 0, ECE: 0, Total: 0 };
  Object.keys(branchCatalog).forEach(branch => {
    let branchTotal = 0;
    branchCatalog[branch].subjects.forEach(subject => {
      branchTotal += subject.topics.length;
    });
    counts[branch] = branchTotal;
    counts.Total += branchTotal;
  });
  return counts;
};

// Helper: Call Gemini to generate B.Tech Notes
const generateNotesViaAI = async (branch, subjectName, topicName) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please configure it in your environment.');
  }

  const prompt = `
You are an elite B.Tech engineering professor and textbook author. Your goal is to write a highly detailed, comprehensive study guide for the following engineering topic:

Branch: ${branch}
Subject: ${subjectName}
Topic: ${topicName}

Please produce a highly structured, clear, and academically rigorous educational study guide. Avoid unstructured text walls.
Provide the output strictly in the JSON format detailed below.

JSON Format:
{
  "title": "Full Topic Title",
  "content": "A detailed academic notes guide formatted in clean, elegant Markdown. Organize the content strictly into the following sections:
  ### 1. Overview & Core Principles
  - Clear standard definition.
  - Core purposes and foundational concepts (using bold key terms).
  
  ### 2. Architecture & Working Mechanism
  - Internal components / block-level breakdown.
  - Step-by-step workflow of how it works.
  
  ### 3. Technical Specifications & Mathematical Foundations
  - List of important technical specs, algorithms, or equations (written in standard markdown or LaTeX formatting if applicable).
  
  ### 4. Comparison & Performance Trade-offs
  - A clean markdown table comparing advantages, disadvantages, or different variants/approaches.
  
  ### 5. Practical Applications & Real-World Use Cases
  - List of industry use-cases and scenarios where this is deployed.",
  
  "examPoints": "A bulleted markdown list of 5-8 critical points, equations, or concepts that are highly tested in university semesters. Format each item as: **[Header Title]**: Concise 1-2 sentence explanation.",
  
  "commonMistakes": "A bulleted markdown list of common conceptual misunderstandings or coding/syntactical mistakes students make. Format each item as: **Misconception**: [Description] -> **Correction**: [Rectified concept].",
  
  "interviewQuestions": "A structured markdown list of 3-5 standard technical interview questions with their detailed answers. Format each item as: **Q[Number]: [Question Text]?** \\n*Answer*: [Detailed structured answer].",
  
  "practiceMCQs": [
    {
      "question": "A challenging conceptual MCQ question statement?",
      "options": {
        "A": "Option A description",
        "B": "Option B description",
        "C": "Option C description",
        "D": "Option D description"
      },
      "correctAnswer": "A", // Must be A, B, C, or D
      "explanation": "Detailed explanation of why this option is correct."
    }
  ],
  "readingTime": 8, // Estimate reading time in minutes (integer)
  "difficulty": "Medium" // Must be 'Easy', 'Medium', or 'Hard'
}

Ensure there are exactly 5 practice MCQs in the array.
Make sure the JSON is valid and conforms to this structure.
`;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI generation failed: ${response.status} - ${errorText}`);
  }

  const resData = await response.json();
  const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini API returned an empty response.');
  }

  const { safeJsonParse } = require('../services/jsonSanitizer');
  return safeJsonParse(rawText);
};

// ─── API HANDLERS ────────────────────────────────────────────────────────────

// 1. Get user learning progress and statistics
const getLearningProgress = async (req, res, next) => {
  try {
    let progress = await UserProgress.findOne({ user: req.user.id });
    if (!progress) {
      progress = await UserProgress.create({
        user: req.user.id,
        completedTopics: [],
        bookmarkedTopics: [],
        recentlyViewed: []
      });
    }

    const counts = getCatalogCounts();
    
    // Compute stats
    const cseCompletedCount = progress.completedTopics.filter(t => t.branch === 'CSE').length;
    const eceCompletedCount = progress.completedTopics.filter(t => t.branch === 'ECE').length;
    const totalCompleted = progress.completedTopics.length;

    const csePercentage = counts.CSE > 0 ? parseFloat(((cseCompletedCount / counts.CSE) * 100).toFixed(1)) : 0;
    const ecePercentage = counts.ECE > 0 ? parseFloat(((eceCompletedCount / counts.ECE) * 100).toFixed(1)) : 0;
    const totalPercentage = counts.Total > 0 ? parseFloat(((totalCompleted / counts.Total) * 100).toFixed(1)) : 0;

    // Generate topic recommendations: find up to 3 uncompleted topics from catalog
    const recommendations = [];
    const completedSet = new Set(progress.completedTopics.map(t => `${t.branch}_${t.subjectId}_${t.topicId}`));

    outerLoop:
    for (const [branchKey, branchVal] of Object.entries(branchCatalog)) {
      for (const subject of branchVal.subjects) {
        for (const topic of subject.topics) {
          const key = `${branchKey}_${subject.id}_${topic.id}`;
          if (!completedSet.has(key)) {
            recommendations.push({
              branch: branchKey,
              subjectId: subject.id,
              subjectName: subject.name,
              topicId: topic.id,
              topicName: topic.name,
              desc: topic.desc
            });
            if (recommendations.length >= 3) break outerLoop;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      progress: {
        completedTopics: progress.completedTopics,
        bookmarkedTopics: progress.bookmarkedTopics,
        recentlyViewed: progress.recentlyViewed,
        stats: {
          cseCompleted: cseCompletedCount,
          cseTotal: counts.CSE,
          csePercentage,
          eceCompleted: eceCompletedCount,
          eceTotal: counts.ECE,
          ecePercentage,
          totalCompleted,
          totalTopicsCount: counts.Total,
          totalPercentage
        },
        recommendations
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Toggle bookmark for a topic
const toggleBookmark = async (req, res, next) => {
  try {
    const { branch, subjectId, topicId } = req.body;
    
    let progress = await UserProgress.findOne({ user: req.user.id });
    if (!progress) {
      progress = await UserProgress.create({ user: req.user.id });
    }

    const index = progress.bookmarkedTopics.findIndex(
      t => t.branch === branch && t.subjectId === subjectId && t.topicId === topicId
    );

    let bookmarked = false;
    if (index > -1) {
      progress.bookmarkedTopics.splice(index, 1);
    } else {
      progress.bookmarkedTopics.push({ branch, subjectId, topicId, timestamp: new Date() });
      bookmarked = true;
    }

    await progress.save();
    res.status(200).json({ success: true, bookmarked });
  } catch (error) {
    next(error);
  }
};

// 3. Mark topic as completed / incomplete
const toggleComplete = async (req, res, next) => {
  try {
    const { branch, subjectId, topicId } = req.body;
    
    let progress = await UserProgress.findOne({ user: req.user.id });
    if (!progress) {
      progress = await UserProgress.create({ user: req.user.id });
    }

    const index = progress.completedTopics.findIndex(
      t => t.branch === branch && t.subjectId === subjectId && t.topicId === topicId
    );

    let completed = false;
    if (index > -1) {
      progress.completedTopics.splice(index, 1);
    } else {
      progress.completedTopics.push({ branch, subjectId, topicId, timestamp: new Date() });
      completed = true;
    }

    await progress.save();
    res.status(200).json({ success: true, completed });
  } catch (error) {
    next(error);
  }
};

// 4. Record recently viewed topic
const recordView = async (req, res, next) => {
  try {
    const { branch, subjectId, topicId } = req.body;
    
    let progress = await UserProgress.findOne({ user: req.user.id });
    if (!progress) {
      progress = await UserProgress.create({ user: req.user.id });
    }

    // Filter out existing view of the same topic to move it to the front
    progress.recentlyViewed = progress.recentlyViewed.filter(
      t => !(t.branch === branch && t.subjectId === subjectId && t.topicId === topicId)
    );

    // Unshift to place at the top
    progress.recentlyViewed.unshift({ branch, subjectId, topicId, timestamp: new Date() });

    // Limit to 5 entries
    if (progress.recentlyViewed.length > 5) {
      progress.recentlyViewed = progress.recentlyViewed.slice(0, 5);
    }

    await progress.save();
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// 5. Get or generate learning notes for a topic
const getNotes = async (req, res, next) => {
  try {
    const { branch, subjectId, topicId, forceRegenerate } = req.query;

    if (!branch || !subjectId || !topicId) {
      return res.status(400).json({ success: false, message: 'Missing branch, subjectId, or topicId parameters.' });
    }

    // 1. Check DB first (unless forceRegenerate is true)
    let notes = await LearningNote.findOne({ branch, subjectId, topicId });
    if (notes && forceRegenerate !== 'true') {
      return res.status(200).json({ success: true, cached: true, notes });
    }

    // 2. Resolve subject name & topic name from catalog
    const branchInfo = branchCatalog[branch];
    if (!branchInfo) {
      return res.status(404).json({ success: false, message: 'Invalid branch parameter.' });
    }

    const subject = branchInfo.subjects.find(s => s.id === subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found in catalog.' });
    }

    const topic = subject.topics.find(t => t.id === topicId);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found in catalog.' });
    }

    // 3. Compile via AI
    console.log(`🤖 Generating B.Tech notes for ${branch} -> ${subject.name} -> ${topic.name}...`);
    const aiNotes = await generateNotesViaAI(branch, subject.name, topic.name);

    // 4. Save/Update to DB
    if (notes) {
      notes.title = aiNotes.title || topic.name;
      notes.content = aiNotes.content;
      notes.examPoints = aiNotes.examPoints;
      notes.commonMistakes = aiNotes.commonMistakes || '';
      notes.interviewQuestions = aiNotes.interviewQuestions;
      notes.practiceMCQs = aiNotes.practiceMCQs || [];
      notes.readingTime = aiNotes.readingTime || 5;
      notes.difficulty = aiNotes.difficulty || 'Medium';
      await notes.save();
    } else {
      notes = await LearningNote.create({
        branch,
        subjectId,
        topicId,
        title: aiNotes.title || topic.name,
        content: aiNotes.content,
        examPoints: aiNotes.examPoints,
        commonMistakes: aiNotes.commonMistakes || '',
        interviewQuestions: aiNotes.interviewQuestions,
        practiceMCQs: aiNotes.practiceMCQs || [],
        readingTime: aiNotes.readingTime || 5,
        difficulty: aiNotes.difficulty || 'Medium'
      });
    }

    res.status(200).json({
      success: true,
      cached: false,
      notes
    });
  } catch (error) {
    console.error('❌ Notes generation error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to compile notes using generative AI. Try again.'
    });
  }
};

// 6. Generate a full Test for a specific topic
const generateTopicTest = async (req, res, next) => {
  try {
    const { branch, subjectId, topicId } = req.body;

    const branchInfo = branchCatalog[branch];
    const subject = branchInfo?.subjects.find(s => s.id === subjectId);
    const topic = subject?.topics.find(t => t.id === topicId);

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found in catalog.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing.');
    }

    // Fetch notes content to feed into prompt context
    const note = await LearningNote.findOne({ branch, subjectId, topicId });
    const contextContent = note ? note.content : 'Engineering study guide';

    const prompt = `
You are an expert academic examiner. Your task is to generate a challenging, high-fidelity practice exam based on the following engineering topic:

Branch: ${branch}
Subject: ${subject.name}
Topic: ${topic.name}
Reference Notes Content:
${contextContent.substring(0, 10000)}

Please generate exactly 10 questions of the following types:
- 5 MCQ (Multiple Choice Questions)
- 3 Short Answer Questions
- 2 Long Answer Questions

You must return ONLY a valid JSON object. Do not wrap in markdown code blocks.
Expected JSON Structure:
{
  "questions": [
    // FOR MCQ QUESTIONS (5 total):
    {
      "type": "mcq",
      "questionText": "Question statement here",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "A", // Must be A, B, C, or D
      "explanation": "Detailed explanation why this answer is correct",
      "maxMarks": 2,
      "topic": "${topic.name}"
    },
    // FOR SHORT ANSWER QUESTIONS (3 total):
    {
      "type": "short",
      "questionText": "Question statement here",
      "modelAnswer": "Brief reference answer here",
      "maxMarks": 5,
      "topic": "${topic.name}"
    },
    // FOR LONG ANSWER QUESTIONS (2 total):
    {
      "type": "long",
      "questionText": "Detailed question statement here",
      "modelAnswer": "Comprehensive reference answer here",
      "maxMarks": 10,
      "topic": "${topic.name}"
    }
  ]
}
`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API failed with status ${response.status}`);
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    const { safeJsonParse } = require('../services/jsonSanitizer');
    const questionsData = safeJsonParse(generatedText).questions;

    // Create Test document in MongoDB
    const test = await Test.create({
      user: req.user.id,
      document: null,
      title: `Learning Hub Exam: ${topic.name}`,
      subject: `${subject.name} - ${topic.name}`,
      difficulty: 'medium',
      config: { mcqCount: 5, shortCount: 3, longCount: 2, scenarioCount: 0 },
      status: 'ready'
    });

    let totalMarks = 0;
    for (const q of questionsData) {
      const dbQ = await Question.create({
        test: test._id,
        document: null,
        type: q.type,
        questionText: q.questionText,
        options: q.options || {},
        correctAnswer: q.correctAnswer || '',
        maxMarks: q.maxMarks || 2,
        difficulty: 'medium',
        topic: q.topic || topic.name,
        explanation: q.explanation || '',
        modelAnswer: q.modelAnswer || '',
        subQuestions: []
      });
      totalMarks += q.maxMarks;
    }

    test.totalMarks = totalMarks;
    test.durationMinutes = 35; // 5*2 + 3*5 + 2*10 = 45 mins, but let's give 35 mins
    await test.save();

    await sendNotification(req.user.id, {
      text: `Your Learning Hub test on "${topic.name}" has been generated. Ready for attempt!`,
      type: 'success',
    });

    res.status(201).json({
      success: true,
      message: 'Practice test generated successfully from learning topic.',
      testId: test._id
    });
  } catch (error) {
    console.error('❌ Topic test generation error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to generate practice test.' });
  }
};

// 7. Context-Aware AI Study Companion Q&A about topic notes
const askAITopic = async (req, res, next) => {
  try {
    const { branch, subjectId, topicId, question, chatHistory = [] } = req.body;

    const note = await LearningNote.findOne({ branch, subjectId, topicId });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Notes must be generated first.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing.');
    }

    const systemPrompt = `You are "ExamGen AI Study Companion". You are reviewing the engineering topic: "${note.title}".
Below are the official study guide notes for this topic. Use these notes as your primary academic context to answer the student's question.

Study Notes Context:
${note.content}

Important Exam Highlights:
${note.examPoints}

Guidelines:
1. Provide accurate, clear, and direct explanations based on the notes.
2. Format your response in clean Markdown.
3. Be professional and encouraging.
4. Keep the discussion focused on this topic. If the user asks about unrelated topics, politely redirect them back to "${note.title}".`;

    const formattedContents = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    formattedContents.push({
      role: 'user',
      parts: [{ text: question }]
    });

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: formattedContents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('AI assistant call failed.');
    }

    const resData = await response.json();
    const reply = resData.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not formulate a response at this moment.';

    res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLearningProgress,
  toggleBookmark,
  toggleComplete,
  recordView,
  getNotes,
  generateTopicTest,
  askAITopic
};
