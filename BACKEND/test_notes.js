require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { branchCatalog } = require('./config/learningCatalog');
const LearningNote = require('./models/LearningNote');

async function testNotesGen() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected successfully.");

    const branch = "CSE";
    const subjectId = "dsa";
    const topicId = "arrays-linked-lists";

    // 1. Resolve subject name & topic name from catalog
    const branchInfo = branchCatalog[branch];
    const subject = branchInfo.subjects.find(s => s.id === subjectId);
    const topic = subject.topics.find(t => t.id === topicId);

    console.log(`Resolved: ${branch} -> ${subject.name} -> ${topic.name}`);

    // Call the exact same prompt generation logic
    console.log("Calling Gemini API to generate notes...");

    // Copy the generateNotesViaAI code directly to test it
    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `
You are an elite B.Tech engineering professor and textbook author. Your goal is to write a highly detailed, comprehensive study guide for the following engineering topic:

Branch: ${branch}
Subject: ${subject.name}
Topic: ${topic.name}

Please produce a highly structured, clear, and academically rigorous educational study guide. Avoid unstructured text walls.
Provide the output strictly in the JSON format detailed below.

JSON Format:
{
  "title": "Full Topic Title",
  "content": "A detailed academic notes guide formatted in clean, elegant Markdown. Organize the content strictly into the following sections:
  ### 1. Overview & Core Principles
  - Clear standard definition.
  - Core purposes and foundational concepts (using bold key terms).
  
  ### 2. Architecture & Working Mechanism
  - Internal components / block-level breakdown.
  - Step-by-step workflow of how it works.
  
  ### 3. Technical Specifications & Mathematical Foundations
  - List of important technical specs, algorithms, or equations. Avoid using raw math equations with unescaped backslashes (like newlines or LaTeX backslashes) to prevent JSON syntax errors. If using math equations, make sure they are written in clean text or have double-escaped backslashes.
  
  ### 4. Comparison & Performance Trade-offs
  - A clean markdown table comparing advantages, disadvantages, or different variants/approaches.
  
  ### 5. Practical Applications & Real-World Use Cases
  - List of industry use-cases and scenarios where this is deployed.",
  
  "examPoints": "A bulleted markdown list of 5-8 critical points, equations, or concepts that are highly tested in university semesters. Format each item as: **[Header Title]**: Concise 1-2 sentence explanation.",
  
  "commonMistakes": "A bulleted markdown list of common conceptual misunderstandings or coding/syntactical mistakes students make. Format each item as: **Misconception**: [Description] -> **Correction**: [Rectified concept].",
  
  "interviewQuestions": "A structured markdown list of 3-5 standard technical interview questions with their detailed answers. Format each item as: **Q[Number]: [Question Text]?** \\n*Answer*: [Detailed structured answer].",
  
  "practiceMCQs": [
    {
      "question": "A challenging conceptual MCQ question statement?",
      "options": {
        "A": "Option A description",
        "B": "Option B description",
        "C": "Option C description",
        "D": "Option D description"
      },
      "correctAnswer": "A", // Must be A, B, C, or D
      "explanation": "Detailed explanation of why this option is correct."
    }
  ],
  "readingTime": 8, // Estimate reading time in minutes (integer)
  "difficulty": "Medium" // Must be 'Easy', 'Medium', or 'Hard'
}

Ensure there are exactly 5 practice MCQs in the array.
Make sure the JSON is valid and conforms to this structure.
`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    };

    console.log(`Targeting URL: ${url}`);
    console.log(`Model: ${model}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI generation failed: ${response.status} - ${errorText}`);
    }

    const resData = await response.json();
    console.log("Gemini API Response received successfully!");
    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(`Raw output length: ${rawText ? rawText.length : 0}`);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      const fs = require('fs');
      fs.writeFileSync('raw_response.txt', rawText);
      console.log("Written raw text to raw_response.txt for inspection.");
      throw parseErr;
    }
    console.log("Successfully parsed JSON response!");
    console.log(`Title: ${parsed.title}`);
    console.log(`Difficulty: ${parsed.difficulty}`);
    console.log(`MCQ count: ${parsed.practiceMCQs ? parsed.practiceMCQs.length : 0}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed with error:", err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

testNotesGen();
