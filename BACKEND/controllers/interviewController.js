const InterviewSession = require('../models/InterviewSession');
const InterviewQuestion = require('../models/InterviewQuestion');
const { sendNotification } = require('../services/notificationService');

// Helper to call Gemini API
const callGemini = async (prompt, systemInstruction = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4
    }
  };

  if (systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API call failed: ${response.status} - ${errorText}`);
  }

  const resData = await response.json();
  const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned an empty response.');
  }

  let cleanedText = rawText.trim();
  // Strip Markdown JSON code block wrapper if present
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  const { safeJsonParse } = require('../services/jsonSanitizer');
  return safeJsonParse(cleanedText);
};

// ─── API HANDLERS ────────────────────────────────────────────────────────────

// 1. Start a new interview session and get first question
const startSession = async (req, res, next) => {
  try {
    const { domain, difficulty, length, mode } = req.body;

    if (!domain || !difficulty || !length || !mode) {
      return res.status(400).json({ success: false, message: 'Missing required configuration parameters.' });
    }

    // Check if there is an in-progress session for this user to pause it
    await InterviewSession.updateMany(
      { user: req.user.id, status: 'in-progress' },
      { status: 'in-progress' } // Just leave as is, user can resume it
    );

    // Create new session
    const session = await InterviewSession.create({
      user: req.user.id,
      domain,
      mode,
      length: parseInt(length),
      startingDifficulty: difficulty.toLowerCase(),
      status: 'in-progress'
    });

    // Generate first question via Gemini
    const systemPrompt = `You are a professional B.Tech placement interviewer. Generate a technical or HR interview question for the domain: "${domain}" at difficulty: "${difficulty}".`;
    const prompt = `
Generate the first question of the interview. It should be a clear, single question that starts the conversation.
Provide the output strictly in JSON format matching the schema below.

Allowed values:
- questionType: 'technical' or 'hr'
- difficulty: 'easy', 'medium', or 'hard'

JSON Schema:
{
  "questionText": "The question to ask the student.",
  "questionType": "technical",
  "difficulty": "${difficulty.toLowerCase()}"
}
`;

    const aiRes = await callGemini(prompt, systemPrompt);

    // Create the first InterviewQuestion
    const firstQuestion = await InterviewQuestion.create({
      session: session._id,
      questionText: aiRes.questionText,
      questionType: aiRes.questionType || 'technical',
      difficulty: aiRes.difficulty || difficulty.toLowerCase(),
      order: 1
    });

    res.status(201).json({
      success: true,
      session,
      firstQuestion
    });
  } catch (error) {
    console.error('❌ Start session error:', error);
    next(error);
  }
};

// 2. Submit answer to current question, evaluate, and generate next question (or report)
const submitAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionId, studentAnswer } = req.body;

    if (!sessionId || !questionId) {
      return res.status(400).json({ success: false, message: 'Missing sessionId or questionId.' });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const currentQuestion = await InterviewQuestion.findById(questionId);
    if (!currentQuestion) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    // Save student answer
    currentQuestion.studentAnswer = studentAnswer || '[No response provided/Skipped]';
    
    // Retrieve previous questions and answers in this session for context
    const previousQuestions = await InterviewQuestion.find({
      session: sessionId,
      order: { $lt: currentQuestion.order }
    }).sort({ order: 1 });

    const previousContext = previousQuestions.map(q => {
      return `Q: ${q.questionText}\nA: ${q.studentAnswer}`;
    }).join('\n\n');

    const isLastQuestion = currentQuestion.order >= session.length;

    let prompt = '';
    const systemPrompt = `You are a professional B.Tech placements technical and HR interviewer. Evaluate the student's answer and decide what to do next.`;

    if (isLastQuestion) {
      // Evaluate the last question
      prompt = `
Evaluate the student's answer to the last question.

Domain: ${session.domain}
Current Question: "${currentQuestion.questionText}"
Student Answer: "${currentQuestion.studentAnswer}"
Difficulty: "${currentQuestion.difficulty}"

Previous Interview Context:
${previousContext}

Please score this answer from 0 to 10. Evaluate technical accuracy, conceptual understanding, communication quality, completeness, and confidence.
Provide constructive feedback in Markdown, list any key missing points, and provide an improved exemplar answer.
Provide the output strictly in the following JSON format.

JSON Schema:
{
  "evaluation": {
    "score": 8,
    "feedback": "Feedback description (Markdown formatting allowed)",
    "missingPoints": ["Point 1", "Point 2"],
    "improvedAnswer": "Complete correct exemplar answer"
  }
}
`;
    } else {
      // Evaluate current answer AND generate next question adaptively
      // Set target difficulty for the next question:
      // If student performs well, increase. If they struggle, decrease.
      // We instruct Gemini to determine the score and generate the next question matching this adaptive logic:
      prompt = `
Evaluate the student's answer and generate the next question.

Domain: ${session.domain}
Current Question: "${currentQuestion.questionText}"
Student Answer: "${currentQuestion.studentAnswer}"
Current Difficulty: "${currentQuestion.difficulty}"

Previous Interview Context:
${previousContext}

Evaluate the student's response on a scale of 0 to 10 (score technical accuracy, understanding, communication, and completeness).
Construct the next question:
- If current score is >= 7: Increase the difficulty for the next question (Easy -> Medium, Medium -> Hard, Hard -> Hard).
- If current score is <= 4: Decrease the difficulty for the next question (Hard -> Medium, Medium -> Easy, Easy -> Easy).
- Else: Maintain current difficulty.

Adaptive Follow-up Rule:
- If the student's answer mentions specific concepts that warrant drilling down, ask a conversational *follow-up* question about it (e.g. asking to clarify, expand, or contrast).
- Otherwise, ask a new technical or scenario question in the domain.

Provide the evaluation and next question details. Provide the output strictly in the following JSON format.

Allowed values for nextQuestion:
- questionType: 'technical', 'scenario', 'follow-up', or 'hr'
- difficulty: 'easy', 'medium', or 'hard'

JSON Schema:
{
  "evaluation": {
    "score": 8,
    "feedback": "Feedback description (Markdown formatting allowed)",
    "missingPoints": ["Point 1", "Point 2"],
    "improvedAnswer": "Complete correct exemplar answer"
  },
  "nextQuestion": {
    "questionText": "The next question to ask.",
    "questionType": "technical",
    "difficulty": "medium"
  }
}
`;
    }

    const aiRes = await callGemini(prompt, systemPrompt);

    // Save evaluation to current question
    currentQuestion.score = aiRes.evaluation.score || 0;
    currentQuestion.feedback = aiRes.evaluation.feedback || '';
    currentQuestion.missingPoints = aiRes.evaluation.missingPoints || [];
    currentQuestion.improvedAnswer = aiRes.evaluation.improvedAnswer || '';
    await currentQuestion.save();

    if (isLastQuestion) {
      // Compile the final report
      const allQuestions = await InterviewQuestion.find({ session: sessionId }).sort({ order: 1 });
      
      const qaSummary = allQuestions.map((q, i) => {
        return `Question ${i+1} [Difficulty: ${q.difficulty}, Score: ${q.score}/10]:
Q: ${q.questionText}
A: ${q.studentAnswer}
Feedback: ${q.feedback}
`;
      }).join('\n\n');

      const reportPrompt = `
You are a senior recruitment manager. Review the following placement mock interview log and compile a final assessment report.

Domain: ${session.domain}
Session Length: ${session.length} Questions
Mode: ${session.mode} (Voice/Text)

Interview Transcript & Grades:
${qaSummary}

Compile overall performance stats.
Provide:
1. Overall session score (0-10)
2. Domain technical knowledge score (0-10)
3. Communication skills score (0-10)
4. Problem solving/Critical thinking score (0-10)
5. Confidence score (0-10)
6. Strengths (3-5 items)
7. Weak Areas (3-5 items)
8. Topics to Revise
9. Recommended learning resources inside a B.Tech syllabus
10. Recommended practice tests/topics

Return the report strictly in the following JSON format. Do not wrap in markdown code blocks.

JSON Schema:
{
  "overallScore": 8.5,
  "technicalScore": 8.0,
  "communicationScore": 9.0,
  "problemSolvingScore": 7.5,
  "confidenceScore": 8.0,
  "strengths": ["Item 1", "Item 2"],
  "weakAreas": ["Item 1", "Item 2"],
  "topicsToRevise": ["Topic 1", "Topic 2"],
  "suggestedResources": ["Resource 1", "Resource 2"],
  "recommendedTests": ["Test 1", "Test 2"]
}
`;

      const finalReport = await callGemini(reportPrompt, "You are a professional placement coordinator compiling an interview report.");

      // Save to Session
      session.overallScore = finalReport.overallScore || 0;
      session.technicalScore = finalReport.technicalScore || 0;
      session.communicationScore = finalReport.communicationScore || 0;
      session.problemSolvingScore = finalReport.problemSolvingScore || 0;
      session.confidenceScore = finalReport.confidenceScore || 0;
      session.strengths = finalReport.strengths || [];
      session.weakAreas = finalReport.weakAreas || [];
      session.topicsToRevise = finalReport.topicsToRevise || [];
      session.suggestedResources = finalReport.suggestedResources || [];
      session.recommendedTests = finalReport.recommendedTests || [];
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();

      await sendNotification(req.user.id, {
        text: `Congratulations! Your Mock Interview on "${session.domain}" is complete. Report generated.`,
        type: 'success'
      });

      return res.status(200).json({
        success: true,
        completed: true,
        evaluation: currentQuestion,
        session
      });
    } else {
      // Save and create next question
      const nextQuestion = await InterviewQuestion.create({
        session: session._id,
        questionText: aiRes.nextQuestion.questionText,
        questionType: aiRes.nextQuestion.questionType || 'technical',
        difficulty: aiRes.nextQuestion.difficulty || 'medium',
        order: currentQuestion.order + 1
      });

      return res.status(200).json({
        success: true,
        completed: false,
        evaluation: currentQuestion,
        nextQuestion
      });
    }
  } catch (error) {
    console.error('❌ Submit answer error:', error);
    next(error);
  }
};

// 3. Get user session history
const getHistory = async (req, res, next) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get specific session details and its questions
const getSessionDetails = async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    // Access control check
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const questions = await InterviewQuestion.find({ session: req.params.id }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      session,
      questions
    });
  } catch (error) {
    next(error);
  }
};

// 5. Toggle bookmark on a question
const toggleQuestionBookmark = async (req, res, next) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    // Verify session user owns this question
    const session = await InterviewSession.findById(question.session);
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    question.bookmarked = !question.bookmarked;
    await question.save();

    res.status(200).json({
      success: true,
      bookmarked: question.bookmarked
    });
  } catch (error) {
    next(error);
  }
};

// 6. Delete session
const deleteSession = async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await InterviewQuestion.deleteMany({ session: req.params.id });
    await session.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Interview session deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startSession,
  submitAnswer,
  getHistory,
  getSessionDetails,
  toggleQuestionBookmark,
  deleteSession
};
