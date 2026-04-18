// ============================================
// assemblyai.service.js - AssemblyAI Transcription
// ============================================
// Transcribes audio recordings to text using
// the AssemblyAI API.
// ============================================

import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

/**
 * Transcribe an audio buffer to text.
 * @param {Buffer} audioBuffer - The audio file buffer
 * @returns {object} - { text: string }
 */
export const transcribeAudio = async (audioBuffer) => {
  try {
    // Upload the audio buffer directly
    const uploadUrl = await client.files.upload(audioBuffer);

    // Create transcription
    const transcript = await client.transcripts.transcribe({
      audio_url: uploadUrl,
    });

    if (transcript.status === 'error') {
      throw new Error(transcript.error || 'Transcription failed');
    }

    return { text: transcript.text || '' };
  } catch (error) {
    console.error('AssemblyAI transcription error:', error.message);
    throw new Error('Failed to transcribe audio: ' + error.message);
  }
};
