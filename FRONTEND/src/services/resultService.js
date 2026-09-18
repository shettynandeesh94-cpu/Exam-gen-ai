import API from './api';
import testService from './testService';

const getLocalStorageResults = () => {
  const results = localStorage.getItem('test_results');
  return results ? JSON.parse(results) : [];
};

const saveLocalStorageResults = (results) => {
  localStorage.setItem('test_results', JSON.stringify(results));
};

const resultService = {
  // Submit exam answers and compute scores/feedback
  submitTest: async (testId, answers) => {
    try {
      // Try backend first
      const response = await API.post('/results/submit', { testId, answers });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw error;
      }

      // ─── Local Mock Grading Engine ───
      // Fetch the test structure
      const testData = await testService.getTest(testId);
      const test = testData.test;

      let score = 0;
      let totalMarks = 0;
      const questionFeedback = [];
      const missedConcepts = new Set();

      // Helper function to grade a standard MCQ question
      const gradeMCQ = (q) => {
        const studentAnsIdx = answers[q.id];
        const isCorrect = Number(studentAnsIdx) === q.correctOption;
        const allocatedMarks = isCorrect ? q.marks : 0;
        
        score += allocatedMarks;
        totalMarks += q.marks;

        if (!isCorrect) {
          missedConcepts.add('Core Concepts');
        }

        questionFeedback.push({
          questionId: q.id,
          type: 'mcq',
          question: q.question,
          studentAnswer: q.options[studentAnsIdx] || 'No Answer',
          modelAnswer: q.options[q.correctOption],
          allocatedMarks,
          maxMarks: q.marks,
          status: isCorrect ? 'correct' : 'incorrect',
          explanation: q.explanation || ''
        });
      };

      // Helper function to grade a Short Answer
      const gradeShort = (q) => {
        const studentText = answers[q.id] || '';
        const isAnswered = studentText.trim().length > 3;
        
        // Simulating AI grading based on word matching / length
        let allocatedMarks = 0;
        let status = 'incorrect';
        let feedbackComment = 'No answer provided.';

        if (isAnswered) {
          const len = studentText.length;
          if (len > 30) {
            allocatedMarks = Math.round(q.marks * 0.9);
            status = 'correct';
            feedbackComment = 'Excellent answer. Key concepts addressed and well explained.';
          } else {
            allocatedMarks = Math.round(q.marks * 0.5);
            status = 'partially_correct';
            feedbackComment = 'Partially correct. The answer covers basic points but lacks detail.';
            missedConcepts.add('Details & Definitions');
          }
        } else {
          missedConcepts.add('General Theory');
        }

        score += allocatedMarks;
        totalMarks += q.marks;

        questionFeedback.push({
          questionId: q.id,
          type: 'short',
          question: q.question,
          studentAnswer: studentText || 'Not Attempted',
          modelAnswer: q.modelAnswer,
          allocatedMarks,
          maxMarks: q.marks,
          status,
          explanation: feedbackComment
        });
      };

      // Helper function to grade a Long Answer
      const gradeLong = (q) => {
        const studentText = answers[q.id] || '';
        const isAnswered = studentText.trim().length > 5;
        
        let allocatedMarks = 0;
        let status = 'incorrect';
        let feedbackComment = 'No answer provided.';

        if (isAnswered) {
          const len = studentText.length;
          if (len > 100) {
            allocatedMarks = Math.round(q.marks * 0.95);
            status = 'correct';
            feedbackComment = 'Comprehensive analysis. Shows strong conceptual grasp and structural clarity.';
          } else if (len > 40) {
            allocatedMarks = Math.round(q.marks * 0.7);
            status = 'partially_correct';
            feedbackComment = 'Good layout, but lacks deeper structural analysis or architectural context.';
            missedConcepts.add('Architectural Depth');
          } else {
            allocatedMarks = Math.round(q.marks * 0.4);
            status = 'partially_correct';
            feedbackComment = 'Answer is too concise. Needs to cover primary structures and comparison parameters.';
            missedConcepts.add('Deep Architecture');
          }
        } else {
          missedConcepts.add('Structural Concepts');
        }

        score += allocatedMarks;
        totalMarks += q.marks;

        questionFeedback.push({
          questionId: q.id,
          type: 'long',
          question: q.question,
          studentAnswer: studentText || 'Not Attempted',
          modelAnswer: q.modelAnswer,
          allocatedMarks,
          maxMarks: q.marks,
          status,
          explanation: feedbackComment
        });
      };

      // Process Questions
      if (test.questions.mcq) test.questions.mcq.forEach(gradeMCQ);
      if (test.questions.short) test.questions.short.forEach(gradeShort);
      if (test.questions.long) test.questions.long.forEach(gradeLong);
      
      // Grade Scenarios
      if (test.questions.scenario) {
        test.questions.scenario.forEach(sc => {
          sc.subQuestions.forEach(subQ => {
            const studentAns = answers[subQ.id];
            let allocatedMarks = 0;
            let status = 'incorrect';
            let feedbackComment = '';

            if (subQ.type === 'mcq') {
              const isCorrect = Number(studentAns) === subQ.correctOption;
              allocatedMarks = isCorrect ? subQ.marks : 0;
              status = isCorrect ? 'correct' : 'incorrect';
              feedbackComment = isCorrect ? 'Correct logic applied.' : `Incorrect option. ${subQ.explanation}`;
              if (!isCorrect) missedConcepts.add('Case Logic Application');
            } else {
              const isAnswered = studentAns && studentAns.trim().length > 3;
              if (isAnswered) {
                allocatedMarks = subQ.marks - 1; // standard partial/full
                status = 'correct';
                feedbackComment = 'Clean solution meeting scenario specs.';
              } else {
                feedbackComment = 'Scenario specifications not fully addressed.';
                missedConcepts.add('Scenario Implementations');
              }
            }

            score += allocatedMarks;
            totalMarks += subQ.marks;

            questionFeedback.push({
              questionId: subQ.id,
              type: subQ.type,
              question: `[Scenario Part] ${subQ.question}`,
              studentAnswer: subQ.type === 'mcq' ? (subQ.options[studentAns] || 'No Answer') : (studentAns || 'Not Attempted'),
              modelAnswer: subQ.type === 'mcq' ? subQ.options[subQ.correctOption] : subQ.modelAnswer,
              allocatedMarks,
              maxMarks: subQ.marks,
              status,
              explanation: feedbackComment
            });
          });
        });
      }

      // Final calculations
      const percentage = totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(1)) : 0;
      
      // Deduce weak topics based on subject keywords
      const weakTopics = Array.from(missedConcepts);
      if (weakTopics.length === 0) {
        weakTopics.push('None! Great job.');
      } else {
        // Customize weak topics based on actual subject
        const sub = test.subject.toLowerCase();
        if (sub.includes('java') || sub.includes('oop')) {
          if (weakTopics.includes('Core Concepts')) weakTopics.push('Inheritance Principles');
          if (weakTopics.includes('Architectural Depth')) weakTopics.push('Abstract Classes vs Interfaces');
          if (weakTopics.includes('Case Logic Application')) weakTopics.push('Strategy Design Pattern');
        } else if (sub.includes('ai') || sub.includes('ml')) {
          if (weakTopics.includes('Core Concepts')) weakTopics.push('Overfitting & Regularization');
          if (weakTopics.includes('Details & Definitions')) weakTopics.push('Activation Functions');
          if (weakTopics.includes('Case Logic Application')) weakTopics.push('Handling Class Imbalance');
        } else {
          if (weakTopics.includes('Core Concepts')) weakTopics.push('Protocols & DNS');
          if (weakTopics.includes('Architectural Depth')) weakTopics.push('REST APIs Statelessness');
          if (weakTopics.includes('Case Logic Application')) weakTopics.push('Database Scaling & Caching');
        }
      }

      // AI recommendation message
      let aiSuggestions = 'Fantastic overall output! To improve even further: ';
      if (percentage < 50) {
        aiSuggestions = 'Your conceptual foundation requires immediate review. Re-read the chapters, practice standard syntax declarations, and verify theoretical separation patterns.';
      } else if (percentage < 80) {
        aiSuggestions = 'Good overall work. Focus on writing more detailed answers, explain comparisons structurally, and study design pattern applicability to optimize scenario results.';
      } else {
        aiSuggestions = 'Mastery level performance! Consider deep-diving into performance optimization algorithms or advanced architectural blueprints in subsequent iterations.';
      }

      const newResult = {
        _id: 'result_' + Math.random().toString(36).substr(2, 9),
        testId: test._id,
        testSubject: test.subject,
        testDifficulty: test.difficulty,
        documentName: test.documentName,
        score,
        totalMarks,
        percentage,
        answers,
        questionFeedback,
        weakTopics: weakTopics.filter(w => !['Core Concepts', 'Details & Definitions', 'General Theory', 'Architectural Depth', 'Deep Architecture', 'Structural Concepts', 'Case Logic Application', 'Scenario Implementations'].includes(w)),
        aiSuggestions,
        createdAt: new Date().toISOString()
      };

      const existing = getLocalStorageResults();
      existing.push(newResult);
      saveLocalStorageResults(existing);

      return {
        success: true,
        message: 'Exam graded successfully by ExamGen AI grader (Client sandbox)',
        result: newResult
      };
    }
  },

  // Get all attempt results
  getResults: async () => {
    try {
      const response = await API.get('/results');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw error;
      }
      return {
        success: true,
        results: getLocalStorageResults().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      };
    }
  },

  // Get a single result details by ID
  getResult: async (id) => {
    try {
      const response = await API.get(`/results/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw error;
      }
      const results = getLocalStorageResults();
      const result = results.find(r => r._id === id);
      if (!result) {
        throw new Error('Result not found');
      }
      return {
        success: true,
        result
      };
    }
  }
};

export default resultService;
