// ============================================
// interview.service.js - Interview Business Logic
// ============================================
// Handles interview lifecycle: create, get current
// question, submit answers, and end interview.
// ============================================

import Interview from '../models/Interview.model.js';
import * as geminiService from './gemini.service.js';
import * as murfService from './murf.service.js';
import * as assemblyaiService from './assemblyai.service.js';

// Difficulty → question count mapping (matches frontend constants)
const QUESTION_COUNTS = { easy: 4, medium: 5, hard: 7 };

/**
 * Start a new interview session.
 */
export const startInterview = async (userId, role, difficulty, resumeText) => {
  const questionCount = QUESTION_COUNTS[difficulty] || 5;

  // Generate questions using Gemini AI
  const generatedQuestions = await geminiService.generateQuestions(
    role, difficulty, resumeText, questionCount
  );

  // Format questions for storage
  const questions = generatedQuestions.map((q) => ({
    text: q.text,
    type: q.type || 'behavioral',
    isCodeQuestion: q.isCodeQuestion || false,
    codeType: q.codeType || null,
    codeSnippet: q.codeSnippet || null,
    codeLanguage: q.codeLanguage || null,
    audioBase64: null,
    answer: '',
    score: null,
    feedback: '',
  }));

  // Generate TTS for the first question
  const firstQuestionAudio = await murfService.textToSpeech(questions[0].text);
  if (firstQuestionAudio) {
    questions[0].audioBase64 = firstQuestionAudio;
  }

  // Create interview document
  const interview = await Interview.create({
    user: userId,
    role,
    difficulty,
    resumeText,
    totalQuestions: questionCount,
    currentQuestionIndex: 0,
    questions,
    status: 'in_progress',
  });

  return {
    interviewId: interview._id,
    currentQuestion: {
      text: questions[0].text,
      type: questions[0].type,
      isCodeQuestion: questions[0].isCodeQuestion,
      codeType: questions[0].codeType,
      codeSnippet: questions[0].codeSnippet,
      codeLanguage: questions[0].codeLanguage,
    },
    audioBase64: questions[0].audioBase64,
    currentQuestionNum: 1,
    totalQuestions: questionCount,
  };
};

/**
 * Get interview data (for loading an existing interview or viewing feedback).
 */
export const getInterview = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, user: userId });

  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  // If completed, return full data including feedback
  if (interview.status === 'completed') {
    return interview;
  }

  // If in progress, return current question info
  const idx = interview.currentQuestionIndex;
  const currentQ = interview.questions[idx];

  return {
    _id: interview._id,
    role: interview.role,
    difficulty: interview.difficulty,
    status: interview.status,
    totalQuestions: interview.totalQuestions,
    currentQuestionIndex: idx,
    currentQuestionNum: idx + 1,
    currentQuestion: currentQ ? {
      text: currentQ.text,
      type: currentQ.type,
      isCodeQuestion: currentQ.isCodeQuestion,
      codeType: currentQ.codeType,
      codeSnippet: currentQ.codeSnippet,
      codeLanguage: currentQ.codeLanguage,
    } : null,
    audioBase64: currentQ?.audioBase64 || null,
    overallScore: interview.overallScore,
    feedback: interview.feedback,
    createdAt: interview.createdAt,
  };
};

/**
 * Submit a text answer for the current question.
 */
export const submitTextAnswer = async (interviewId, userId, answerText) => {
  const interview = await Interview.findOne({ _id: interviewId, user: userId });

  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  const idx = interview.currentQuestionIndex;
  const currentQ = interview.questions[idx];

  // Save the answer
  currentQ.answer = answerText;

  // Evaluate using Gemini
  const evaluation = await geminiService.evaluateAnswer(currentQ.text, answerText, interview.role);
  currentQ.score = evaluation.score;
  currentQ.feedback = evaluation.feedback;

  // Check if there are more questions
  const isLastQuestion = idx >= interview.totalQuestions - 1;

  let nextQuestionData = null;
  let audioBase64 = null;

  if (!isLastQuestion) {
    // Move to next question
    interview.currentQuestionIndex = idx + 1;
    const nextQ = interview.questions[idx + 1];

    // Generate spoken response + next question combined
    const spokenText = evaluation.spokenResponse || 'Let me move on to the next question.';
    const combinedText = `${spokenText} ${nextQ.text}`;
    audioBase64 = await murfService.textToSpeech(combinedText);
    if (audioBase64) {
      nextQ.audioBase64 = audioBase64;
    }

    nextQuestionData = {
      text: nextQ.text,
      type: nextQ.type,
      isCodeQuestion: nextQ.isCodeQuestion,
      codeType: nextQ.codeType,
      codeSnippet: nextQ.codeSnippet,
      codeLanguage: nextQ.codeLanguage,
    };
  }

  await interview.save();

  return {
    evaluation: { score: evaluation.score, feedback: evaluation.feedback },
    isComplete: isLastQuestion,
    nextQuestion: nextQuestionData,
    audioBase64,
    currentQuestionNum: isLastQuestion ? idx + 1 : idx + 2,
    interviewerText: isLastQuestion
      ? evaluation.spokenResponse || 'Thank you for all your answers.'
      : `${evaluation.spokenResponse || ''} ${nextQuestionData?.text || ''}`.trim(),
  };
};

/**
 * Submit a code answer for the current question.
 */
export const submitCode = async (interviewId, userId, code, language) => {
  const interview = await Interview.findOne({ _id: interviewId, user: userId });

  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  const idx = interview.currentQuestionIndex;
  const currentQ = interview.questions[idx];

  // Save the code as the answer
  currentQ.answer = code;

  // Evaluate code using Gemini
  const evaluation = await geminiService.evaluateCode(
    currentQ.text, code, currentQ.codeType || 'write', language, interview.role
  );

  currentQ.score = evaluation.score;
  currentQ.feedback = evaluation.feedback;

  const isLastQuestion = idx >= interview.totalQuestions - 1;

  let nextQuestionData = null;
  let audioBase64 = null;

  if (!isLastQuestion) {
    interview.currentQuestionIndex = idx + 1;
    const nextQ = interview.questions[idx + 1];

    const spokenText = evaluation.spokenResponse || 'Let me move on to the next question.';
    const combinedText = `${spokenText} ${nextQ.text}`;
    audioBase64 = await murfService.textToSpeech(combinedText);
    if (audioBase64) {
      nextQ.audioBase64 = audioBase64;
    }

    nextQuestionData = {
      text: nextQ.text,
      type: nextQ.type,
      isCodeQuestion: nextQ.isCodeQuestion,
      codeType: nextQ.codeType,
      codeSnippet: nextQ.codeSnippet,
      codeLanguage: nextQ.codeLanguage,
    };
  }

  await interview.save();

  return {
    evaluation: {
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      feedback: evaluation.feedback,
      suggestions: evaluation.suggestions,
    },
    isComplete: isLastQuestion,
    nextQuestion: nextQuestionData,
    audioBase64,
    currentQuestionNum: isLastQuestion ? idx + 1 : idx + 2,
    interviewerText: isLastQuestion
      ? evaluation.spokenResponse || 'Thank you for your solution.'
      : `${evaluation.spokenResponse || ''} ${nextQuestionData?.text || ''}`.trim(),
  };
};

/**
 * Transcribe an audio buffer to text.
 */
export const transcribeAudioAnswer = async (audioBuffer) => {
  return assemblyaiService.transcribeAudio(audioBuffer);
};

/**
 * End an interview and generate final feedback.
 */
export const endInterview = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, user: userId });

  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }

  // Generate comprehensive feedback using Gemini
  const feedbackData = await geminiService.generateFeedback(interview);

  // Update interview with feedback
  interview.status = 'completed';
  interview.overallScore = feedbackData.overallScore;
  interview.feedback = {
    categoryScores: feedbackData.categoryScores,
    strengths: feedbackData.strengths,
    areasOfImprovement: feedbackData.areasOfImprovement,
    finalAssessment: feedbackData.finalAssessment,
  };

  // Clear audio data to save storage (not needed after interview)
  interview.questions.forEach((q) => {
    q.audioBase64 = null;
  });

  await interview.save();

  return {
    interviewId: interview._id,
    overallScore: feedbackData.overallScore,
    farewellMessage: feedbackData.farewellMessage || 'Thank you for completing the interview! Your feedback report is ready.',
  };
};
