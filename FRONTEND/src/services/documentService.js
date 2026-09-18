import API from './api';

const documentService = {
  // Get all uploaded documents for the user
  getDocuments: async () => {
    const response = await API.get('/documents');
    return response.data; // { success, count, documents: [...] }
  },

  // Get a single document details by ID
  getDocument: async (id) => {
    const response = await API.get(`/documents/${id}`);
    return response.data; // { success, document }
  },

  // Upload PDF document
  uploadDocument: async (file, subject, onUploadProgress) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('subject', subject || 'General');

    const response = await API.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data; // { success, message, document }
  },

  // Delete an uploaded document
  deleteDocument: async (id) => {
    const response = await API.delete(`/documents/${id}`);
    return response.data; // { success, message }
  }
};

export default documentService;
