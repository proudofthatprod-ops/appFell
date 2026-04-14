import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import AudioUploader from './components/AudioUploader';
import WaveformViewer from './components/WaveformViewer';
import AnalysisDashboard from './components/AnalysisDashboard';
import './App.css';

function App() {
  const [audioBlobURL, setAudioBlobURL] = useState(null);
  
  // States to pass to dashboard
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // 'idle', 'uploading', 'analyzing', 'success', 'error'
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleAudioCapture = async (url, file) => {
    setAudioBlobURL(url);
    setAnalysisStatus('uploading');
    setAnalysisResults(null);

    const formData = new FormData();
    formData.append('audioFile', file);

    try {
      setAnalysisStatus('analyzing');
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erreur réseau / Serveur Python introuvable');
      }
      
      const data = await response.json();
      setAnalysisResults(data);
      setAnalysisStatus('success');
    } catch (err) {
      console.error(err);
      setAnalysisStatus('error');
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Activity size={28} color="#b100e8" />
          <span>Beat<span className="logo-accent">DNA</span></span>
        </div>
      </header>
      
      <main className="main-content">
        <section className="hero-section">
          <h1>Analysez l'ADN de votre son</h1>
          <p>
            Détectez les samples, vérifiez l'originalité et visualisez la structure de votre piste en un claquement de doigts avec notre IA.
          </p>
        </section>

        <div className="dashboard-layout">
          <AudioUploader onAudioCapture={handleAudioCapture} />
          
          <div className="dashboard-grid">
            {audioBlobURL && <WaveformViewer audioUrl={audioBlobURL} />}
            <AnalysisDashboard status={analysisStatus} results={analysisResults} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
