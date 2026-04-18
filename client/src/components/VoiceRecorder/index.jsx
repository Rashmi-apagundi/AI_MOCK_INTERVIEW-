import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { BsMicFill, BsRecordCircleFill, BsCheckCircleFill } from 'react-icons/bs';
import './index.css';

const MAX_RECORD_TIME = 300;

function VoiceRecorder({ onRecordingComplete, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const chunksRef = useRef([]);

  // Timer: increment every second while recording
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORD_TIME) {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
            setIsRecording(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, mediaRecorder]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
    } catch (err) {
      toast.error('Could not access microphone. Please check permissions.');
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (recordedBlob && onRecordingComplete) {
      onRecordingComplete(recordedBlob);
    }
  };

  const handleReRecord = () => {
    setRecordedBlob(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      {!isRecording && !recordedBlob && (
        <button
          className={`vr-record-btn ${disabled ? 'vr-record-btn-disabled' : ''}`}
          onClick={startRecording}
          disabled={disabled}
        >
          <BsMicFill className="vr-btn-icon" />
          Record Answer
        </button>
      )}

      {isRecording && (
        <div className="vr-recording-area">
          <div className="vr-recording-status">
            <BsRecordCircleFill className="vr-record-dot" />
            <span className="vr-status-text">Recording...</span>
          </div>
          <span className="vr-timer">
            {formatTime(recordingTime)} / {formatTime(MAX_RECORD_TIME)}
          </span>
          <button className="vr-stop-btn" onClick={stopRecording}>
            Stop
          </button>
        </div>
      )}

      {!isRecording && recordedBlob && (
        <div className="vr-preview">
          <p className="vr-preview-label">
            Review your recording before submitting:
          </p>
          <audio
            className="vr-audio-player"
            src={audioPreviewUrl}
            controls
          />
          <p className="vr-preview-duration">
            Duration: {formatTime(recordingTime)}
          </p>
          <div className="vr-preview-actions">
            <button
              className={`vr-rerecord-btn ${disabled ? 'vr-rerecord-btn-disabled' : ''}`}
              onClick={handleReRecord}
              disabled={disabled}
            >
              Re-record
            </button>
            <button
              className={`vr-submit-btn ${disabled ? 'vr-submit-btn-disabled' : ''}`}
              onClick={handleSubmit}
              disabled={disabled}
            >
              <BsCheckCircleFill className="vr-btn-icon" />
              Submit Answer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
