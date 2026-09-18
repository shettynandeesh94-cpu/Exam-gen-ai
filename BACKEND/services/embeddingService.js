/**
 * Gemini AI Embedding Service
 * Connects directly to Gemini's gemini-embedding-001 API to generate vector representation.
 */

/**
 * Generate a single embedding vector for a given string
 * @param {string} text - The input text
 * @returns {Promise<number[]>} - The 3072-dimension embedding array
 */
const getEmbedding = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;

  const requestBody = {
    model: 'models/gemini-embedding-001',
    content: {
      parts: [{ text }],
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Embedding API failed: ${response.status} - ${errorText}`);
    }

    const resData = await response.json();
    const embedding = resData.embedding?.values;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Gemini API returned an invalid embedding response.');
    }

    return embedding;
  } catch (error) {
    console.error('❌ Gemini Single Embedding Error:', error);
    throw error;
  }
};

/**
 * Generate embedding vectors for an array of strings in a batch
 * @param {string[]} texts - Array of input texts
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
const getEmbeddingsBatch = async (texts) => {
  if (!texts || texts.length === 0) return [];
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  // Gemini's batchEmbedContents endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${apiKey}`;

  const requests = texts.map((text) => ({
    model: 'models/gemini-embedding-001',
    content: {
      parts: [{ text }],
    },
  }));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Batch Embedding API failed: ${response.status} - ${errorText}`);
    }

    const resData = await response.json();
    const embeddings = resData.embeddings?.map((e) => e.values);

    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error('Gemini API returned incomplete batch embeddings.');
    }

    return embeddings;
  } catch (error) {
    console.error('❌ Gemini Batch Embedding Error:', error);
    throw error;
  }
};

module.exports = { getEmbedding, getEmbeddingsBatch };
