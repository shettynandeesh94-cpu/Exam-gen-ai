/**
 * Gemini Question Generator Service
 * Invokes Gemini 1.5 Flash API to compile custom practice tests
 */

const generateQuestions = async (contextText, subject, difficulty, config) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please add your Gemini API Key as GEMINI_API_KEY=your_key inside BACKEND/.env and restart the server.');
  }

  // Cap context text to avoid overloading context limits
  const contextCleaned = contextText ? contextText.substring(0, 40000) : '';

  const dsaContext = (config.dsaCount > 0) ? `
For the DSA Coding Challenges:
- Topic: ${config.topic || 'Mixed'}
- Style/Pattern inspiration: ${config.questionSource || 'AI Generated'} (If LeetCode/HackerRank inspired, generate original interview-quality questions matching their complexity and standard coding patterns, but do NOT copy any question name or details directly).
- Make sure the difficulty matches: ${difficulty}.
` : '';

  const aptitudeContext = (config.aptitudeCount > 0) ? `
For the Aptitude MCQ Questions:
- Topic: ${config.topic || 'Mixed Aptitude'}
- Ensure the questions match the selected Topic and cover relevant problems under it.
- Difficulty Level: ${difficulty}.
- Every generated question MUST be a multiple-choice question.
- Every question MUST have exactly 4 options (A, B, C, D) and only ONE correct option.
- Every question MUST include a detailed step-by-step mathematical or logical explanation.
- Crucially, avoid duplicate questions.
- Return the questions in this JSON format layout:
  {
    "type": "aptitude",
    "section": "aptitude",
    "question": "Question statement here",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A", // Or B, C, D
    "explanation": "Detailed explanation here"
  }
` : '';

  const prompt = `
You are an expert academic examiner. Your task is to generate high-fidelity, challenging exam questions based on the following subject domain and source material notes.

Subject: ${subject}
Difficulty Level: ${difficulty}
${dsaContext}
${aptitudeContext}
Source Material Context Notes:
${contextCleaned || 'No reference file provided. Generate general knowledge questions based entirely on the subject area.'}

Generate exactly the following quantities of questions:
- MCQ (Multiple Choice): ${config.mcqCount || 0}
- DSA Coding Challenge: ${config.dsaCount || 0}
- Aptitude MCQ: ${config.aptitudeCount || 0}
- Short Answer: ${config.shortCount || 0}
- Long Answer: ${config.longCount || 0}
- Scenario-Based (Case Study with sub-questions): ${config.scenarioCount || 0}

Ensure the questions are challenging, conceptually accurate, and target critical learning points in the subject domain.

You must return ONLY a valid JSON object. Do not wrap the JSON in markdown code blocks like \`\`\`json. Output only the JSON.

Expected JSON Structure:
{
  "questions": [
    // FOR MCQ QUESTIONS:
    {
      "type": "mcq",
      "section": "mcq",
      "questionText": "Question statement here",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "A", // Must be A, B, C, or D
      "explanation": "Detailed explanation why this answer is correct",
      "maxMarks": 2,
      "topic": "Subtopic name"
    },
    // FOR APTITUDE QUESTIONS (formatted as MCQ):
    {
      "type": "aptitude",
      "section": "aptitude",
      "questionText": "Aptitude question statement (e.g. math word problem, logical puzzle, or verbal reason)",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "B", // Must be A, B, C, or D
      "explanation": "Detailed step-by-step reasoning or mathematical explanation",
      "maxMarks": 2,
      "topic": "Aptitude Subtopic (e.g. Probability, Ratios, Logic)"
    },
    // FOR DSA QUESTIONS (CODING CHALLENGES):
    {
      "type": "dsa",
      "section": "dsa",
      "questionTitle": "Problem Title (e.g., Grid Path Minimization)",
      "questionText": "Write a detailed and clear programming problem statement here.",
      "constraints": "Write execution constraints, bounds, or sizes here (e.g., '1 <= nums.length <= 10^5', '0 <= nums[i] <= 1000')",
      "inputFormat": "Describe parameters passed to the function (e.g., 'An integer array nums representing prices')",
      "outputFormat": "Describe return value type and meaning (e.g., 'Return the minimum cost to complete the transaction')",
      "sampleInput": "Textual representation of example input arguments, e.g., 'nums = [4, 2, 3]'",
      "sampleOutput": "Textual representation of example return value, e.g., '5'",
      "explanation": "Step-by-step explanation explaining why sampleInput produces sampleOutput.",
      "javaSignature": "public int solve(int[] nums) {\\n    // Write your code here\\n}", // Standard Java starter signature stub matching constraints
      "starterCode": "function solve(nums) {\\n  // Write your JavaScript code here\\n  return 0;\\n}", // Valid Javascript starter function stub that can run in VM sandbox
      "starterTemplates": {
        "javascript": "function solve(nums) {\\n  // Write your JavaScript code here\\n  return 0;\\n}",
        "python": "def solve(nums):\\n    # Write your Python code here\\n    pass",
        "java": "public class Solution {\\n    public int solve(int[] nums) {\\n        // Write your Java code here\\n        return 0;\\n    }\\n}",
        "cpp": "#include <iostream>\\n#include <vector>\\n#include <string>\\n#include <algorithm>\\n\\nusing namespace std;\\n\\nclass Solution {\\npublic:\\n    int solve(vector<int>& nums) {\\n        // Write your C++ code here\\n        return 0;\\n    }\\n};",
        "c": "#include <stdio.h>\\n#include <stdlib.h>\\n#include <string.h>\\n#include <stdbool.h>\\n\\nint solve(int* nums, int numsSize) {\\n    // Write your C code here\\n    return 0;\\n}"
      },
      "expectedTimeComplexity": "O(N)",
      "expectedSpaceComplexity": "O(1)",
      "testCases": [
        {
          "input": [[4, 2, 3]], // Array of argument lists for JavaScript function solve. Wrap argument list as: [ [arg1] ]
          "expected": 5, // Expected return value matching JavaScript return
          "functionName": "solve" // Must match starterCode function name
        },
        {
          "input": [[1]],
          "expected": 1,
          "functionName": "solve"
        }
      ],
      "hiddenTestCases": [ // Tricky, larger, or edge test cases used only for grading evaluation
        {
          "input": [[10, 5, 20, 15]],
          "expected": 35,
          "functionName": "solve"
        },
        {
          "input": [[0, 0, 0]],
          "expected": 0,
          "functionName": "solve"
        }
      ],
      "maxMarks": 10,
      "topic": "Arrays" // Specific DSA topic of the challenge
    },
    // FOR SHORT ANSWER QUESTIONS:
    {
      "type": "short",
      "section": "mcq", // fallback
      "questionText": "Question statement here",
      "modelAnswer": "Brief reference answer here",
      "maxMarks": 5,
      "topic": "Subtopic name"
    },
    // FOR LONG ANSWER QUESTIONS:
    {
      "type": "long",
      "section": "mcq", // fallback
      "questionText": "Question statement here",
      "modelAnswer": "Detailed reference answer here",
      "maxMarks": 10,
      "topic": "Subtopic name"
    },
    // FOR SCENARIO QUESTIONS:
    {
      "type": "scenario",
      "section": "mcq", // fallback
      "questionText": "A detailed context/case-study narrative paragraph setting up the scenario.",
      "topic": "Subtopic name",
      "subQuestions": [
        {
          "type": "mcq",
          "questionText": "Sub-question statement related to the scenario",
          "options": {
            "A": "Option A text",
            "B": "Option B text",
            "C": "Option C text",
            "D": "Option D text"
          },
          "correctAnswer": "B",
          "explanation": "Explanation here",
          "maxMarks": 3
        }
      ]
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
      temperature: 0.2
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
      throw new Error(`Gemini API request failed: ${errorMsg}`);
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Parse output JSON
    let parsedData;
    try {
      parsedData = JSON.parse(generatedText);
    } catch (e) {
      console.error('Failed to parse Gemini output:', generatedText);
      throw new Error('AI returned an invalid JSON response format. Try generating again.');
    }

    if (!parsedData || !Array.isArray(parsedData.questions)) {
      throw new Error('AI response is missing the required "questions" array field.');
    }

    return parsedData.questions;
  } catch (error) {
    console.error('❌ Gemini Generation Error:', error);
    throw error;
  }
};

module.exports = { generateQuestions };
