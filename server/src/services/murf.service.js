// ============================================
// murf.service.js - Murf AI Text-to-Speech
// ============================================
// Converts text to speech using the Murf API.
// Returns base64-encoded audio.
// ============================================

/**
 * Convert text to speech using Murf API.
 * Returns base64-encoded audio string.
 */
export const textToSpeech = async (text) => {
  const apiKey = process.env.MURF_API_KEY;

  if (!apiKey) {
    console.error('MURF_API_KEY not set, skipping TTS');
    return null;
  }

  try {
    const response = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        voiceId: 'en-US-natalie',
        style: 'Conversational',
        text: text.substring(0, 3000), // Murf has character limits
        format: 'WAV',
        sampleRate: 24000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Murf API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Murf returns audioFile as a URL — fetch it and convert to base64
    if (data.audioFile) {
      const audioResponse = await fetch(data.audioFile);
      const audioBuffer = await audioResponse.arrayBuffer();
      const base64 = Buffer.from(audioBuffer).toString('base64');
      return base64;
    }

    return null;
  } catch (error) {
    console.error('Murf TTS error:', error.message);
    return null;
  }
};
