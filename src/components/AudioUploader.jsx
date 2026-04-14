import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Mic, Square, Music, AlertCircle } from 'lucide-react';
import './AudioUploader.css';

const AudioUploader = ({ onAudioCapture }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        onAudioCapture(url, file);
        setErrorMsg('');
      } else {
        setErrorMsg('Veuillez déposer un fichier audio valide (MP3, WAV, etc.)');
      }
    }
  }, [onAudioCapture]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {'audio/*': []},
    multiple: false
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        onAudioCapture(url, audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setErrorMsg('');
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMsg('Accès au microphone refusé ou introuvable.');
      console.error('Error opening microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="uploader-container glass-panel">
      <h2>Importer ou Enregistrer</h2>
      {errorMsg && (
        <div className="error-banner">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}
      <div className="uploader-actions">
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload size={32} className="icon" />
          <p>Glissez un fichier audio ici ou cliquez pour choisir</p>
          <span className="formats">MP3, WAV, M4A</span>
        </div>

        <div className="separator">OU</div>

        <div className="record-section">
          {!isRecording ? (
            <button className="btn-record primary" onClick={startRecording}>
              <Mic size={20} />
              Enregistrer via Micro
            </button>
          ) : (
            <div className="recording-active">
              <div className="recording-indicator">
                <span className="pulse"></span>
                <span>Enregistrement... {formatTime(recordingTime)}</span>
              </div>
              <button className="btn-stop danger" onClick={stopRecording}>
                <Square size={20} />
                Arrêter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioUploader;
