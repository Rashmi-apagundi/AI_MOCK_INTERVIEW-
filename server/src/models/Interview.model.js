// ============================================
// Interview.model.js - Interview Database Schema
// ============================================
// Stores interview sessions including questions,
// answers, scores, and AI-generated feedback.
// ============================================

import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, default: 'behavioral' },
  isCodeQuestion: { type: Boolean, default: false },
  codeType: { type: String, default: null },
  codeSnippet: { type: String, default: null },
  codeLanguage: { type: String, default: null },
  audioBase64: { type: String, default: null },
  answer: { type: String, default: '' },
  score: { type: Number, default: null },
  feedback: { type: String, default: '' },
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  categoryScores: {
    communicationSkills: {
      score: { type: Number, default: 0 },
      comment: { type: String, default: '' },
    },
    technicalKnowledge: {
      score: { type: Number, default: 0 },
      comment: { type: String, default: '' },
    },
    problemSolving: {
      score: { type: Number, default: 0 },
      comment: { type: String, default: '' },
    },
    codeQuality: {
      score: { type: Number, default: 0 },
      comment: { type: String, default: '' },
    },
    confidence: {
      score: { type: Number, default: 0 },
      comment: { type: String, default: '' },
    },
  },
  strengths: [String],
  areasOfImprovement: [String],
  finalAssessment: { type: String, default: '' },
}, { _id: false });

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    resumeText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    questions: [questionSchema],
    totalQuestions: {
      type: Number,
      default: 5,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    feedback: feedbackSchema,
    overallScore: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
