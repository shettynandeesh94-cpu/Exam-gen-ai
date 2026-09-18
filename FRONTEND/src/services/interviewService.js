import API from './api';

const interviewService = {
  // Start a new mock interview session and retrieve the first question
  startSession: async (domain, difficulty, length, mode) => {
    const response = await API.post('/interview/start', { domain, difficulty, length, mode });
    return response.data; // { success, session, firstQuestion }
  },

  // Submit the student response to the current question, returns evaluation and the next question (or complete report)
  submitAnswer: async (sessionId, questionId, studentAnswer) => {
    const response = await API.post('/interview/submit-answer', { sessionId, questionId, studentAnswer });
    return response.data; // { success, completed, evaluation, nextQuestion, session }
  },

  // Get user interview session history
  getHistory: async () => {
    const response = await API.get('/interview/history');
    return response.data; // { success, sessions }
  },

  // Get specific session details, aggregated report, and Q&A logs
  getSessionDetails: async (sessionId) => {
    const response = await API.get(`/interview/session/${sessionId}`);
    return response.data; // { success, session, questions }
  },

  // Toggle bookmark on a specific question in a session
  toggleQuestionBookmark: async (questionId) => {
    const response = await API.post(`/interview/question/${questionId}/bookmark`);
    return response.data; // { success, bookmarked }
  },

  // Delete a session from history
  deleteSession: async (sessionId) => {
    const response = await API.delete(`/interview/session/${sessionId}`);
    return response.data; // { success }
  }
};

export default interviewService;
