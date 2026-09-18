import API from './api';

const learningService = {
  // Get overall student progress and stats
  getProgress: async () => {
    const response = await API.get('/learning/progress');
    return response.data; // { success, progress }
  },

  // Toggle bookmark for a topic
  toggleBookmark: async (branch, subjectId, topicId) => {
    const response = await API.post('/learning/toggle-bookmark', { branch, subjectId, topicId });
    return response.data; // { success, bookmarked }
  },

  // Toggle completed status for a topic
  toggleComplete: async (branch, subjectId, topicId) => {
    const response = await API.post('/learning/toggle-complete', { branch, subjectId, topicId });
    return response.data; // { success, completed }
  },

  // Log recently viewed topic
  recordView: async (branch, subjectId, topicId) => {
    const response = await API.post('/learning/record-view', { branch, subjectId, topicId });
    return response.data; // { success }
  },

  // Get or compile notes for a topic
  getNotes: async (branch, subjectId, topicId, forceRegenerate = false) => {
    const response = await API.get(`/learning/notes`, {
      params: { branch, subjectId, topicId, forceRegenerate }
    });
    return response.data; // { success, cached, notes }
  },

  // Generate a practice exam on a topic and return the generated testId
  generateTest: async (branch, subjectId, topicId) => {
    const response = await API.post('/learning/generate-test', { branch, subjectId, topicId });
    return response.data; // { success, testId }
  },

  // Context-aware AI chat about specific topic notes
  askAI: async (branch, subjectId, topicId, question, chatHistory) => {
    const response = await API.post('/learning/ask-ai', {
      branch,
      subjectId,
      topicId,
      question,
      chatHistory
    });
    return response.data; // { success, reply }
  }
};

export default learningService;
