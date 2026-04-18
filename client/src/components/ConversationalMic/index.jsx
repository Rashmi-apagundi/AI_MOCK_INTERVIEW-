import { useState, useEffect, useRef } from 'react';
import { BsMicFill } from 'react-icons/bs';
import './index.css';

const SILENCE_TIMEOUT = 3000;

function ConversationalMic({ onTranscriptReady, onAutoSubmit, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const silenceTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const finalTextRef = useRef('');

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = 'en-US';

    recog.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        setFinalText((prev) => {
          const newText = prev + final;
          finalTextRef.current = newText;
          return newText;
        });
      }
      setLiveText(interim);

      // Reset silence timer on new speech
      clearSilenceTimerInternal();
      startSilenceTimerInternal();
    };

    recog.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recog.onend = () => {
      setIsListening(false);
    };

    setRecognition(recog);

    return () => {
      recog.abort();
      clearSilenceTimerInternal();
    };
  }, []);

  // Auto-start listening when recognition is ready
  useEffect(() => {
    if (recognition && !disabled) {
      startListening();
    }
  }, [recognition]);

  const clearSilenceTimerInternal = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setAutoSubmitCountdown(null);
  };

  const clearSilenceTimer = () => {
    clearSilenceTimerInternal();
  };

  const startSilenceTimerInternal = () => {
    silenceTimerRef.current = setTimeout(() => {
      // Start countdown
      let count = 3;
      setAutoSubmitCountdown(count);
      countdownRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearSilenceTimerInternal();
          handleAutoSubmit();
        } else {
          setAutoSubmitCountdown(count);
        }
      }, 1000);
    }, SILENCE_TIMEOUT);
  };

  const startListening = () => {
    if (!recognition || disabled) return;
    try {
      recognition.start();
      setIsListening(true);
      setLiveText('');
    } catch (err) {
      // Already started
    }
  };

  const stopListening = () => {
    if (!recognition) return;
    try {
      recognition.stop();
    } catch (err) {
      // Already stopped
    }
    clearSilenceTimerInternal();
    setIsListening(false);
  };

  const handleAutoSubmit = () => {
    stopListening();
    const text = (finalTextRef.current + ' ' + liveText).trim();
    if (text && onAutoSubmit) {
      onAutoSubmit(text);
    }
  };

  const handleManualSubmit = () => {
    stopListening();
    const text = (finalTextRef.current + ' ' + liveText).trim();
    if (text && onAutoSubmit) {
      onAutoSubmit(text);
    }
  };

  const handleRestart = () => {
    setFinalText('');
    setLiveText('');
    finalTextRef.current = '';
    clearSilenceTimerInternal();
    startListening();
  };

  const displayText = (finalText + ' ' + liveText).trim();

  if (!isSupported) {
    return (
      <div className="cm-unsupported">
        <p className="cm-unsupported-text">
          Voice recognition is not supported in this browser. Please use Chrome
          or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="cm-container">
      <div className="cm-mic-button-wrapper">
        <button
          className={`cm-mic-button ${isListening ? 'cm-mic-active' : ''} ${disabled ? 'cm-mic-button-disabled' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
        >
          <BsMicFill className="cm-mic-icon" />
        </button>
      </div>

      <div className="cm-status">
        {isListening && !displayText && (
          <p className="cm-status-listening">Listening...</p>
        )}
        {isListening && displayText && !autoSubmitCountdown && (
          <p className="cm-status-listening">Hearing you...</p>
        )}
        {autoSubmitCountdown && (
          <p className="cm-status-countdown">
            Submitting in {autoSubmitCountdown}s...{' '}
            <button
              className="cm-keep-talking-btn"
              onClick={() => {
                clearSilenceTimer();
                startListening();
              }}
            >
              Keep talking
            </button>
          </p>
        )}
        {!isListening && displayText && (
          <p className="cm-status-done">Done</p>
        )}
        {!isListening && !displayText && (
          <p className="cm-status-ready">Ready to listen</p>
        )}
      </div>

      {displayText && (
        <div className="cm-transcript-box">
          <span className="cm-transcript-final">{finalText}</span>
          {liveText && (
            <span className="cm-transcript-interim">{liveText}</span>
          )}
        </div>
      )}

      <div className="cm-controls">
        {isListening ? (
          <button
            className={`cm-submit-btn ${!displayText ? 'cm-submit-btn-disabled' : ''}`}
            onClick={handleManualSubmit}
            disabled={!displayText}
          >
            Submit Answer
          </button>
        ) : displayText ? (
          <div className="cm-done-actions">
            <button className="cm-speak-again-btn" onClick={handleRestart}>
              Speak Again
            </button>
            <button className="cm-submit-btn" onClick={handleManualSubmit}>
              Submit Answer
            </button>
          </div>
        ) : (
          <button
            className={`cm-start-btn ${disabled ? 'cm-start-btn-disabled' : ''}`}
            onClick={startListening}
            disabled={disabled}
          >
            Start listening
          </button>
        )}
      </div>
    </div>
  );
}

export default ConversationalMic;
