import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';
import './WaveformViewer.css';

const WaveformViewer = ({ audioUrl }) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioUrl) return;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(157, 78, 221, 0.5)',
      progressColor: '#b100e8',
      cursorColor: '#c77dff',
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 100,
      normalize: true,
    });

    wavesurferRef.current.load(audioUrl);

    wavesurferRef.current.on('play', () => setIsPlaying(true));
    wavesurferRef.current.on('pause', () => setIsPlaying(false));
    wavesurferRef.current.on('finish', () => setIsPlaying(false));

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="waveform-container glass-panel">
      <div className="waveform-header">
        <h3>Pistes Audio Analysées</h3>
        <button className="play-btn" onClick={togglePlayPause}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
      <div className="waveform" ref={containerRef}></div>
    </div>
  );
};

export default WaveformViewer;
