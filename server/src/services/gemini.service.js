// ============================================
// gemini.service.js - Google Gemini AI Service
// ============================================
// Generates interview questions and feedback
// using the Gemini API.
// ============================================

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate interview questions using Gemini.
 */
export const generateQuestions = async (role, difficulty, resumeText, questionCount) => {
  const prompt = `You are an expert technical interviewer. Generate exactly ${questionCount} interview questions for a "${role}" position at "${difficulty}" difficulty level.

The candidate's resume summary:
${resumeText || 'No resume provided.'}

Rules:
1. Mix question types: behavioral, technical, situational, and coding.
2. For ${difficulty} difficulty:
   - easy: Focus on fundamentals and basic concepts. Include 1 simple coding question.
   - medium: Mix of fundamentals and intermediate topics. Include 1-2 coding questions.
   - hard: Deep technical questions and complex scenarios. Include 2-3 coding questions.
3. For coding questions, set "isCodeQuestion": true and include one of these codeType values:
   - "write": Candidate writes code from scratch
   - "fix": Candidate fixes buggy code (provide the buggy code in "codeSnippet")
   - "explain": Candidate explains what code does (provide code in "codeSnippet")
4. Tailor questions to the candidate's resume when available.
5. Each question should have a natural conversational preamble (as if spoken by an interviewer named Natalie).

Return ONLY a valid JSON array (no markdown, no code fences) with this exact structure:
[
  {
    "text": "The full question text as Natalie would speak it",
    "type": "behavioral|technical|situational|coding",
    "isCodeQuestion": false,
    "codeType": null,
    "codeSnippet": null,
    "codeLanguage": null
  }
]

For coding questions with codeType "fix" or "explain", include a codeSnippet and set codeLanguage to "javascript", "python", "java", or "cpp".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let text = response.text.trim();

    // Strip markdown code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const questions = JSON.parse(text);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Gemini returned invalid question format');
    }

    return questions.slice(0, questionCount);
  } catch (error) {
    console.error('Gemini generateQuestions error:', error.message);
    throw new Error('Failed to generate interview questions: ' + error.message);
  }
};

/**
 * Evaluate a text/voice answer using Gemini.
 */
export const evaluateAnswer = async (question, answer, role) => {
  const prompt = `You are an expert technical interviewer evaluating a candidate's answer for a "${role}" position.

Question: "${question}"
Candidate's Answer: "${answer}"

Evaluate the answer and respond as Natalie (a professional but warm AI interviewer).
Provide a brief spoken follow-up that naturally transitions to the next question.

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "score": <number 0-100>,
  "feedback": "<brief evaluation>",
  "spokenResponse": "<what Natalie says after hearing the answer, 1-2 sentences max, naturally transitioning>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let text = response.text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini evaluateAnswer error:', error.message);
    return { score: 50, feedback: 'Answer recorded.', spokenResponse: 'Thank you for your answer. Let me move on to the next question.' };
  }
};

/**
 * Evaluate a code submission using Gemini.
 */
export const evaluateCode = async (question, code, codeType, language, role) => {
  const prompt = `You are an expert technical interviewer evaluating a candidate's code for a "${role}" position.

Question: "${question}"
Code Type: "${codeType}" (write = wrote from scratch, fix = fixed buggy code, explain = explained code)
Language: "${language}"
Candidate's Code/Explanation:
\`\`\`
${code}
\`\`\`

Evaluate the code submission. Be encouraging but honest.

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "isCorrect": <boolean>,
  "score": <number 0-100>,
  "feedback": "<evaluation of the code>",
  "suggestions": "<improvement tips or null>",
  "spokenResponse": "<what Natalie says, 1-2 sentences, transitioning to next question>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let text = response.text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini evaluateCode error:', error.message);
    return { isCorrect: false, score: 50, feedback: 'Code recorded.', suggestions: null, spokenResponse: 'Thank you for your solution. Let me continue.' };
  }
};

/**
 * Generate final interview feedback using Gemini.
 */
export const generateFeedback = async (interview) => {
  const questionsAndAnswers = interview.questions.map((q, i) => (
    `Q${i + 1} (${q.type}${q.isCodeQuestion ? ', coding' : ''}): ${q.text}\nAnswer: ${q.answer || 'No answer provided'}\nScore: ${q.score || 'N/A'}`
  )).join('\n\n');

  const prompt = `You are an expert technical interviewer providing comprehensive feedback for a "${interview.role}" interview at "${interview.difficulty}" difficulty.

Here are all the questions and answers:
${questionsAndAnswers}

Provide a detailed, constructive feedback report.

Return ONLY a valid JSON object (no markdown, no code fences):
{
  "overallScore": <number 0-100>,
  "categoryScores": {
    "communicationSkills": { "score": <0-100>, "comment": "<specific feedback>" },
    "technicalKnowledge": { "score": <0-100>, "comment": "<specific feedback>" },
    "problemSolving": { "score": <0-100>, "comment": "<specific feedback>" },
    "codeQuality": { "score": <0-100>, "comment": "<specific feedback>" },
    "confidence": { "score": <0-100>, "comment": "<specific feedback>" }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasOfImprovement": ["<area 1>", "<area 2>", "<area 3>"],
  "finalAssessment": "<2-3 sentence overall assessment>",
  "farewellMessage": "<What Natalie says to wrap up the interview, warm and encouraging, 2-3 sentences>"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    let text = response.text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini generateFeedback error:', error.message);
    throw new Error('Failed to generate feedback: ' + error.message);
  }
};
