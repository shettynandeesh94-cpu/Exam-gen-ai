/**
 * Gemini Batch Answer Grader Service
 * Strictly evaluates student text answers against model answers
 */

const gradeAnswers = async (evaluationList) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please add your key to BACKEND/.env.');
  }

  if (!evaluationList || evaluationList.length === 0) {
    return [];
  }

  const prompt = `
You are an expert academic examiner. Your task is to strictly grade and evaluate a student's answers against the official reference model answers.

For each question, compare the student's submission to the model answer, taking into account the maximum marks allocated.
CRITICAL: Be extremely strict. If the student's answer is useless, irrelevant, gibberish, empty, or completely wrong, award exactly 0 marks and mark status as "incorrect". Do not award partial credit for generic statements that do not address the question.

Evaluate the following list of questions and student submissions:
${JSON.stringify(evaluationList, null, 2)}

You must return ONLY a valid JSON object. Do not wrap the JSON in markdown code blocks like \`\`\`json. Output only the JSON.

Expected JSON Structure:
{
  "evaluations": [
    {
      "questionId": "string",
      "marksObtained": number, // Must be an integer between 0 and maxMarks (inclusive)
      "status": "string", // Must be one of: "correct", "partially_correct", "incorrect"
      "suggestions": "string" // Clean, constructive explanation of the grade, highlighting missing concepts or errors
    }
  ]
}
`;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1
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
      throw new Error(`Gemini API grading request failed: ${errorMsg}`);
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('Gemini API returned empty grading response.');
    }

    let parsed;
    try {
      parsed = JSON.parse(generatedText);
    } catch (e) {
      console.error('Failed to parse grading output:', generatedText);
      throw new Error('Grader returned invalid JSON response format.');
    }

    if (!parsed || !Array.isArray(parsed.evaluations)) {
      throw new Error('Grader response missing "evaluations" array.');
    }

    return parsed.evaluations;
  } catch (error) {
    console.error('❌ Gemini Grading Error:', error);
    throw error;
  }
};

module.exports = { gradeAnswers };
