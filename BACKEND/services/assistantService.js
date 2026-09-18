/**
 * Gemini AI Study Assistant Service
 * Invokes Gemini 2.5 Flash to handle interactive study chat
 */

const getAssistantResponse = async (messages, userDocuments = [], ragContext = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please configure it in your environment.');
  }

  // Format user documents list for model context
  const docContext = userDocuments.length > 0
    ? `The user has the following documents uploaded in their library: ${userDocuments.map(d => d.title).join(', ')}.`
    : `The user has no documents uploaded in their library currently.`;

  // Format RAG retrieved text chunks
  const ragContextText = ragContext.length > 0
    ? `Here are semantically relevant context passages retrieved from the user's uploaded documents that match their query. Use this reference material to answer their questions accurately and cite the source document names when appropriate:\n\n${
        ragContext.map((c, i) => `[Reference ${i+1}] Source: "${c.source}"\nContent:\n${c.text}`).join('\n\n')
      }`
    : `No specific text matching this query was retrieved from local notes. Explain the concept based on general academic principles.`;

  const systemPrompt = `You are "ExamGen AI Study Assistant", a highly knowledgeable, supportive, and friendly academic tutor and study partner.
Your mission is to help the user prepare for exams, explain difficult concepts clearly (using analogies and simple terms when helpful), solve academic problems, and quiz them.

Role guidelines:
1. Always format responses in clean Markdown. Use headings, lists, bold keywords, code blocks (with syntax highlighting), or tables where appropriate to make information readable.
2. Be encouraging, patient, and professional.
3. ${docContext} If the user references or asks questions about these documents, provide assistance on these topics. If they ask to be quizzed, generate 1-3 practice questions on the subject and wait for their answer before grading.
4. Keep explanations concise but thorough.

Source Materials Reference (RAG):
${ragContextText}

If the user asks questions unrelated to studying, academics, or test prep, politely steer them back to their studies.`;

  // Translate frontend message history to Gemini API specification
  // Front-end sends: [{ sender: 'user' | 'assistant', text: '...' }]
  const formattedContents = messages.map(msg => {
    const role = msg.sender === 'user' ? 'user' : 'model';
    return {
      role: role,
      parts: [{ text: msg.text }]
    };
  });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: formattedContents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `HTTP ${response.status} Error`;
      throw new Error(`Gemini Assistant API request failed: ${errorMsg}`);
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('Gemini API returned an empty response.');
    }

    return generatedText;
  } catch (error) {
    console.error('❌ Gemini Assistant Error:', error);
    throw error;
  }
};

module.exports = { getAssistantResponse };
