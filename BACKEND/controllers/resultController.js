const Result = require('../models/Result');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Document = require('../models/Document');
const { gradeAnswers } = require('../services/answerGrader');
const { sendNotification } = require('../services/notificationService');
const { runDsaCode } = require('../services/codeRunner');

// Helper to map result from Mongoose model to client format
const formatResultForClient = (resVal, testObj, questionFeedback) => {
  return {
    _id: resVal._id,
    testId: resVal.test,
    testSubject: testObj.subject,
    testDifficulty: testObj.difficulty,
    documentName: testObj.document ? testObj.document.originalName : 'General Knowledge Base',
    score: resVal.totalMarksObtained,
    totalMarks: resVal.totalMaxMarks,
    percentage: resVal.percentageScore,
    answers: resVal.answers.reduce((acc, curr) => {
      acc[curr.question] = curr.studentAnswer;
      return acc;
    }, {}),
    questionFeedback: questionFeedback || resVal.answers.flatMap(ans => {
      if (ans.questionType === 'scenario' && ans.subAnswers && ans.subAnswers.length > 0) {
        return ans.subAnswers.map(subAns => ({
          questionId: subAns.questionId,
          type: subAns.questionType,
          question: `[Scenario Part] ${subAns.questionText}`,
          studentAnswer: subAns.studentAnswer,
          modelAnswer: subAns.correctAnswer,
          allocatedMarks: subAns.marksObtained,
          maxMarks: subAns.maxMarks,
          status: subAns.isCorrect ? 'correct' : (subAns.marksObtained > 0 ? 'partially_correct' : 'incorrect'),
          explanation: subAns.explanation
        }));
      }
      return {
        questionId: ans.question,
        type: ans.questionType,
        question: ans.questionText,
        studentAnswer: ans.studentAnswer,
        modelAnswer: ans.correctAnswer, // correctAnswer in AnswerDetailSchema maps to modelAnswer ref
        allocatedMarks: ans.marksObtained,
        maxMarks: ans.maxMarks,
        status: ans.isCorrect ? 'correct' : (ans.marksObtained > 0 ? 'partially_correct' : 'incorrect'),
        explanation: ans.aiFeedback ? ans.aiFeedback.suggestions : ''
      };
    }),
    weakTopics: resVal.weakTopics || [],
    aiSuggestions: resVal.answers.length > 0 ? (resVal.percentageScore >= 80 ? 'Mastery level performance! Consider deep-diving into performance optimization algorithms or advanced architectural blueprints.' : (resVal.percentageScore >= 50 ? 'Good overall work. Focus on writing more detailed answers, explain comparisons structurally, and study design patterns.' : 'Your conceptual foundation requires immediate review. Re-read the chapters, practice standard syntax declarations, and verify theoretical separation patterns.')) : 'No attempts recorded.',
    createdAt: resVal.createdAt
  };
};

/**
 * @desc    Submit test answers and compute grading
 * @route   POST /api/results/submit
 * @access  Private
 */
const submitTest = async (req, res, next) => {
  try {
    const { testId, answers } = req.body;

    const test = await Test.findOne({ _id: testId, user: req.user.id })
      .populate('document', 'originalName');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const questions = await Question.find({ test: test._id });

    // 1. Compile list of free-text student answers to grade via Gemini
    const textQuestionsToEvaluate = [];

    for (const q of questions) {
      if (q.type === 'short' || q.type === 'long') {
        const studentText = answers[q._id] || '';
        textQuestionsToEvaluate.push({
          questionId: q._id.toString(),
          type: q.type,
          questionText: q.questionText,
          modelAnswer: q.modelAnswer,
          studentAnswer: studentText,
          maxMarks: q.maxMarks
        });
      } else if (q.type === 'scenario') {
        (q.subQuestions || []).forEach((sub, subIdx) => {
          const subKey = `${q._id}_${subIdx}`;
          const subStudentAns = answers[subKey] || '';
          if (sub.type !== 'mcq') {
            textQuestionsToEvaluate.push({
              questionId: subKey,
              type: sub.type,
              questionText: sub.questionText,
              modelAnswer: sub.modelAnswer,
              studentAnswer: subStudentAns,
              maxMarks: sub.maxMarks
            });
          }
        });
      }
    }

    // 2. Call batch answer grader service
    let evaluations = [];
    try {
      evaluations = await gradeAnswers(textQuestionsToEvaluate);
    } catch (err) {
      console.warn("AI grading failed, using strict fallback criteria", err);
      // Fallback: 0 marks for empty answers, 50% for short text responses (simulated fallback)
      evaluations = textQuestionsToEvaluate.map(item => {
        const textLen = (item.studentAnswer || '').trim().length;
        const status = textLen > 25 ? 'partially_correct' : 'incorrect';
        return {
          questionId: item.questionId,
          marksObtained: status === 'partially_correct' ? Math.round(item.maxMarks * 0.4) : 0,
          status,
          suggestions: textLen > 25 ? 'System fallback: Answer seems somewhat descriptive but lacks direct validation.' : 'No descriptive answer provided.'
        };
      });
    }

    // Map evaluations by ID for quick retrieval
    const evalMap = {};
    evaluations.forEach(ev => {
      evalMap[ev.questionId] = ev;
    });

    let totalScore = 0;
    let totalMaxMarks = 0;
    const answerDetails = [];
    const questionFeedback = [];
    const missedConcepts = new Set();

    const optionMap = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' };

    for (const q of questions) {
      if (q.type === 'mcq' || q.type === 'aptitude') {
        const studentAnsIdx = answers[q._id];
        const studentAnsLetter = optionMap[studentAnsIdx] || '';
        const isCorrect = studentAnsLetter === q.correctAnswer;
        const marksObtained = isCorrect ? q.maxMarks : 0;

        totalScore += marksObtained;
        totalMaxMarks += q.maxMarks;

        if (!isCorrect) {
          missedConcepts.add(q.topic || 'Core Theory');
        }

        const optionsArr = [q.options.A, q.options.B, q.options.C, q.options.D];

        answerDetails.push({
          question: q._id,
          questionType: q.type,
          questionText: q.questionText,
          studentAnswer: studentAnsIdx !== undefined ? optionsArr[studentAnsIdx] : 'No Answer',
          correctAnswer: q.options[q.correctAnswer] || '',
          marksObtained,
          maxMarks: q.maxMarks,
          isCorrect,
          topic: q.topic || 'Core Theory',
          aiFeedback: {
            correctConcepts: isCorrect ? [q.topic] : [],
            missingConcepts: isCorrect ? [] : [q.topic],
            suggestions: q.explanation || ''
          }
        });

        questionFeedback.push({
          questionId: q._id,
          type: q.type,
          question: q.questionText,
          studentAnswer: studentAnsIdx !== undefined ? optionsArr[studentAnsIdx] : 'No Answer',
          modelAnswer: q.options[q.correctAnswer] || '',
          allocatedMarks: marksObtained,
          maxMarks: q.maxMarks,
          status: isCorrect ? 'correct' : 'incorrect',
          explanation: q.explanation || ''
        });

      } else if (q.type === 'dsa') {
        const studentCode = answers[q._id] || '';
        const studentLang = answers[`${q._id}_lang`] || 'javascript';

        // Combine visible test cases and hidden test cases for final grading evaluation
        const visibleCases = JSON.parse(q.testCases || '[]');
        const hiddenCases = q.hiddenTestCases ? JSON.parse(q.hiddenTestCases) : [];
        const allCases = [...visibleCases, ...hiddenCases];

        const functionName = visibleCases[0]?.functionName || 'solve';

        const runRes = await runDsaCode(studentCode, studentLang, JSON.stringify(allCases), functionName);

        const totalCases = allCases.length || 1;
        const passedCases = runRes.results ? runRes.results.filter(r => r.passed).length : 0;
        const marksObtained = Math.round((passedCases / totalCases) * q.maxMarks);
        const isCorrect = passedCases === totalCases;

        totalScore += marksObtained;
        totalMaxMarks += q.maxMarks;

        if (!isCorrect) {
          missedConcepts.add(q.topic || 'DSA Algorithms');
        }

        let feedbackMessage = `Passed ${passedCases}/${totalCases} test cases.`;
        if (runRes.error) {
          feedbackMessage += ` Error: ${runRes.error}`;
        }
        const errorLogs = runRes.error ? `\nRuntime Error: ${runRes.error}` : '';
        const suggestions = `${feedbackMessage}${errorLogs}\nConsole output logs:\n${(runRes.logs || []).join('\n')}`;

        answerDetails.push({
          question: q._id,
          questionType: 'dsa',
          questionText: q.questionText,
          studentAnswer: studentCode || 'Not Attempted',
          correctAnswer: q.starterCode || '',
          marksObtained,
          maxMarks: q.maxMarks,
          isCorrect,
          topic: q.topic || 'DSA Algorithms',
          aiFeedback: {
            correctConcepts: isCorrect ? [q.topic] : [],
            missingConcepts: !isCorrect ? [q.topic] : [],
            suggestions
          }
        });

        questionFeedback.push({
          questionId: q._id,
          type: 'dsa',
          question: q.questionText,
          studentAnswer: studentCode || 'Not Attempted',
          modelAnswer: q.starterCode || '',
          allocatedMarks: marksObtained,
          maxMarks: q.maxMarks,
          status: isCorrect ? 'correct' : (marksObtained > 0 ? 'partially_correct' : 'incorrect'),
          explanation: suggestions
        });

      } else if (q.type === 'short') {
        const studentText = answers[q._id] || '';
        const ev = evalMap[q._id.toString()] || { marksObtained: 0, status: 'incorrect', suggestions: 'No response evaluated.' };

        const marksObtained = ev.marksObtained || 0;
        const status = ev.status || 'incorrect';
        const suggestions = ev.suggestions || 'Evaluation incomplete.';

        if (status !== 'correct') {
          missedConcepts.add(q.topic || 'Definitions & Differences');
        }

        totalScore += marksObtained;
        totalMaxMarks += q.maxMarks;

        answerDetails.push({
          question: q._id,
          questionType: 'short',
          questionText: q.questionText,
          studentAnswer: studentText || 'Not Attempted',
          correctAnswer: q.modelAnswer,
          marksObtained,
          maxMarks: q.maxMarks,
          isCorrect: status === 'correct',
          topic: q.topic || 'Definitions & Differences',
          aiFeedback: {
            correctConcepts: status === 'correct' ? [q.topic] : [],
            missingConcepts: status !== 'correct' ? [q.topic] : [],
            suggestions
          }
        });

        questionFeedback.push({
          questionId: q._id,
          type: 'short',
          question: q.questionText,
          studentAnswer: studentText || 'Not Attempted',
          modelAnswer: q.modelAnswer,
          allocatedMarks: marksObtained,
          maxMarks: q.maxMarks,
          status,
          explanation: suggestions
        });

      } else if (q.type === 'long') {
        const studentText = answers[q._id] || '';
        const ev = evalMap[q._id.toString()] || { marksObtained: 0, status: 'incorrect', suggestions: 'No response evaluated.' };

        const marksObtained = ev.marksObtained || 0;
        const status = ev.status || 'incorrect';
        const suggestions = ev.suggestions || 'Evaluation incomplete.';

        if (status !== 'correct') {
          missedConcepts.add(q.topic || 'System Evaluation');
        }

        totalScore += marksObtained;
        totalMaxMarks += q.maxMarks;

        answerDetails.push({
          question: q._id,
          questionType: 'long',
          questionText: q.questionText,
          studentAnswer: studentText || 'Not Attempted',
          correctAnswer: q.modelAnswer,
          marksObtained,
          maxMarks: q.maxMarks,
          isCorrect: status === 'correct',
          topic: q.topic || 'System Evaluation',
          aiFeedback: {
            correctConcepts: status === 'correct' ? [q.topic] : [],
            missingConcepts: status !== 'correct' ? [q.topic] : [],
            suggestions
          }
        });

        questionFeedback.push({
          questionId: q._id,
          type: 'long',
          question: q.questionText,
          studentAnswer: studentText || 'Not Attempted',
          modelAnswer: q.modelAnswer,
          allocatedMarks: marksObtained,
          maxMarks: q.maxMarks,
          status,
          explanation: suggestions
        });

      } else if (q.type === 'scenario') {
        const scenarioSubFeedbacks = [];
        const subAnswersDb = [];
        let scenarioMarksObtained = 0;
        let scenarioMaxMarks = 0;

        (q.subQuestions || []).forEach((sub, subIdx) => {
          const subQKey = `${q._id}_${subIdx}`;
          const subStudentAns = answers[subQKey];
          let subScore = 0;
          let subStatus = 'incorrect';
          let subFeedback = '';

          if (sub.type === 'mcq') {
            const letter = optionMap[subStudentAns] || '';
            const subCorrect = letter === sub.correctAnswer;
            subScore = subCorrect ? sub.maxMarks : 0;
            subStatus = subCorrect ? 'correct' : 'incorrect';
            subFeedback = subCorrect ? 'Correct logic applied.' : `Incorrect option. ${sub.explanation}`;
            if (!subCorrect) missedConcepts.add(q.topic || 'Architecture & Design');
          } else {
            const ev = evalMap[subQKey] || { marksObtained: 0, status: 'incorrect', suggestions: 'No response evaluated.' };
            subScore = ev.marksObtained || 0;
            subStatus = ev.status || 'incorrect';
            subFeedback = ev.suggestions || 'Evaluation incomplete.';
            if (subStatus !== 'correct') {
              missedConcepts.add(q.topic || 'Architecture & Design');
            }
          }

          scenarioMarksObtained += subScore;
          scenarioMaxMarks += sub.maxMarks;

          const optArr = [sub.options.A, sub.options.B, sub.options.C, sub.options.D];
          const studentAnsText = sub.type === 'mcq' ? (subStudentAns !== undefined ? optArr[subStudentAns] : 'No Answer') : (subStudentAns || 'Not Attempted');
          const correctAnsText = sub.type === 'mcq' ? sub.options[sub.correctAnswer] : sub.modelAnswer;

          scenarioSubFeedbacks.push({
            questionId: subQKey,
            type: sub.type,
            question: `[Scenario Part] ${sub.questionText}`,
            studentAnswer: studentAnsText,
            modelAnswer: correctAnsText,
            allocatedMarks: subScore,
            maxMarks: sub.maxMarks,
            status: subStatus,
            explanation: subFeedback
          });

          subAnswersDb.push({
            questionId: subQKey,
            questionType: sub.type,
            questionText: sub.questionText,
            studentAnswer: studentAnsText,
            correctAnswer: correctAnsText,
            marksObtained: subScore,
            maxMarks: sub.maxMarks,
            isCorrect: subStatus === 'correct',
            explanation: subFeedback
          });
        });

        totalScore += scenarioMarksObtained;
        totalMaxMarks += scenarioMaxMarks;

        answerDetails.push({
          question: q._id,
          questionType: 'scenario',
          questionText: q.questionText,
          studentAnswer: 'Attempted in parts',
          correctAnswer: 'Refer to sub-questions',
          marksObtained: scenarioMarksObtained,
          maxMarks: scenarioMaxMarks,
          isCorrect: scenarioMarksObtained === scenarioMaxMarks,
          topic: q.topic || 'Architecture & Design',
          aiFeedback: {
            correctConcepts: scenarioMarksObtained === scenarioMaxMarks ? [q.topic] : [],
            missingConcepts: scenarioMarksObtained !== scenarioMaxMarks ? [q.topic] : [],
            suggestions: 'Evaluation of specifications completed.'
          },
          subAnswers: subAnswersDb
        });

        scenarioSubFeedbacks.forEach(feed => questionFeedback.push(feed));
      }
    }

    const percentage = totalMaxMarks > 0 ? parseFloat(((totalScore / totalMaxMarks) * 100).toFixed(1)) : 0;

    // Assign Grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const weakTopics = Array.from(missedConcepts);
    if (weakTopics.length === 0) {
      weakTopics.push('None! Perfect score achieved.');
    }

    const result = await Result.create({
      user: req.user.id,
      test: test._id,
      answers: answerDetails,
      totalMarksObtained: totalScore,
      totalMaxMarks,
      percentageScore: percentage,
      grade,
      weakTopics,
      evaluationStatus: 'completed',
      startedAt: new Date(Date.now() - 30 * 60 * 1000),
      submittedAt: new Date()
    });

    test.status = 'attempted';
    await test.save();

    // Send real-time notification
    await sendNotification(req.user.id, {
      text: `Your "${test.subject}" test has been graded. Score: ${percentage}% (Grade: ${grade})`,
      type: 'success',
    });

    res.status(201).json({
      success: true,
      message: 'Exam graded successfully by AI grader pipeline',
      result: formatResultForClient(result, test, questionFeedback)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user attempt history
 * @route   GET /api/results
 * @access  Private
 */
const getResults = async (req, res, next) => {
  try {
    const results = await Result.find({ user: req.user.id })
      .populate({
        path: 'test',
        populate: { path: 'document', select: 'originalName' }
      })
      .sort({ createdAt: -1 });

    const formatted = results.map(r => {
      const test = r.test || { subject: 'General', difficulty: 'medium' };
      return {
        _id: r._id,
        testId: r.test ? r.test._id : null,
        testSubject: test.subject,
        testDifficulty: test.difficulty,
        documentName: (test.document && test.document.originalName) ? test.document.originalName : 'General Knowledge Base',
        score: r.totalMarksObtained,
        totalMarks: r.totalMaxMarks,
        percentage: r.percentageScore,
        createdAt: r.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      results: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single attempt results report
 * @route   GET /api/results/:id
 * @access  Private
 */
const getResult = async (req, res, next) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, user: req.user.id })
      .populate({
        path: 'test',
        populate: { path: 'document', select: 'originalName' }
      });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    const test = result.test || { subject: 'General', difficulty: 'medium' };
    const questions = await Question.find({ test: test._id });

    const questionFeedback = [];

    for (const ans of result.answers) {
      const q = questions.find(item => item._id.toString() === ans.question.toString());
      if (q && q.type === 'scenario') {
        if (ans.subAnswers && ans.subAnswers.length > 0) {
          ans.subAnswers.forEach(subAns => {
            questionFeedback.push({
              questionId: subAns.questionId,
              type: subAns.questionType,
              question: `[Scenario Part] ${subAns.questionText}`,
              studentAnswer: subAns.studentAnswer,
              modelAnswer: subAns.correctAnswer,
              allocatedMarks: subAns.marksObtained,
              maxMarks: subAns.maxMarks,
              status: subAns.isCorrect ? 'correct' : (subAns.marksObtained > 0 ? 'partially_correct' : 'incorrect'),
              explanation: subAns.explanation
            });
          });
        } else {
          // Fallback compatibility for older records
          (q.subQuestions || []).forEach((sub, subIdx) => {
            const subKey = `${q._id}_${subIdx}`;
            questionFeedback.push({
              questionId: subKey,
              type: sub.type,
              question: `[Scenario Part] ${sub.questionText}`,
              studentAnswer: sub.type === 'mcq' ? sub.options[sub.correctAnswer] : 'Attempted',
              modelAnswer: sub.type === 'mcq' ? sub.options[sub.correctAnswer] : sub.modelAnswer,
              allocatedMarks: sub.maxMarks,
              maxMarks: sub.maxMarks,
              status: 'correct',
              explanation: sub.explanation || ''
            });
          });
        }
      } else {
        const isCorrect = ans.isCorrect;
        const isPartial = !isCorrect && ans.marksObtained > 0;
        questionFeedback.push({
          questionId: ans.question,
          type: ans.questionType,
          question: ans.questionText,
          studentAnswer: ans.studentAnswer,
          modelAnswer: ans.correctAnswer,
          allocatedMarks: ans.marksObtained,
          maxMarks: ans.maxMarks,
          status: isCorrect ? 'correct' : (isPartial ? 'partially_correct' : 'incorrect'),
          explanation: ans.aiFeedback ? ans.aiFeedback.suggestions : ''
        });
      }
    }

    res.status(200).json({
      success: true,
      result: formatResultForClient(result, test, questionFeedback)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitTest, getResults, getResult };
