import API from './api';

const chat = async (messages) => {
  try {
    const response = await API.post('/assistant/chat', { messages });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Chat assistance failed. Please check your network connection.';
    throw new Error(message);
  }
};

const assistantService = {
  chat,
};

export default assistantService;
