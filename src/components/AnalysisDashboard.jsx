import React from 'react';
import { Fingerprint, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import './AnalysisDashboard.css';

const AnalysisDashboard = ({ status, results }) => {
  if (status === 'idle') {
    return (
      <div className="dashboard-container placeholder glass-panel">
        <Fingerprint size={48} className="placeholder-icon" />
        <p>Uploadez une piste pour lancer l'analyse IA librosa.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container active glass-panel">
      <div className="dashboard-header">
        <h3><Fingerprint size={20} /> Résultats de l'Analyse IA</h3>
      </div>
      
      {(status === 'uploading' || status === 'analyzing') && (
        <div className="analyzing-state">
          <div className="progress-bar-container spinner" style={{position: 'relative', overflow: 'hidden'}}>
            <div className="progress-bar" style={{width: '50%', animation: 'slide 1.5s infinite'}}></div>
          </div>
          <p>Analyse Librosa en cours (Temps, Chroma, Contraste)...</p>
          <style>{`
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </div>
      )}

      {status === 'error' && (
        <div className="error-banner" style={{marginTop: '20px'}}>
           <AlertCircle size={20} /> Erreur: Le backend Python ne répond pas ou l'analyse a échoué. Pensez à démarrer le serveur FastAPI en arrière plan.
        </div>
      )}

      {status === 'success' && results && (
        <div className="results-state">
          <div className="score-section">
            <div className="main-score">
              <svg viewBox="0 0 36 36" className="circular-chart primary">
                <path className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path className="circle"
                  strokeDasharray={`${results.originality || 0}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">{results.originality || 0}%</text>
              </svg>
              <h4>Originalité Globale</h4>
            </div>
            
            <div className="sub-scores">
              <div className="score-item">
                <span className="label">Mélodie</span>
                <div className="bar"><div className="fill" style={{width: `${results.melody || 0}%`}}></div></div>
              </div>
              <div className="score-item">
                <span className="label">Rythme</span>
                <div className="bar"><div className="fill" style={{width: `${results.rhythm || 0}%`}}></div></div>
              </div>
              <div className="score-item">
                <span className="label">Timbre</span>
                <div className="bar"><div className="fill" style={{width: `${results.timbre || 0}%`}}></div></div>
              </div>
            </div>
          </div>

          <div className="matches-section">
            <h4>Correspondances Détectées (BDD)</h4>
            <div className="matches-list">
              {results.matches && results.matches.length > 0 ? results.matches.map((match, i) => (
                <div key={i} className={`match-item ${match.is_yours ? 'is-yours' : ''}`}>
                  <div className="match-info">
                    <span className="match-title">{match.title}</span>
                    <span className="match-artist">{match.artist}</span>
                    {match.is_yours && <div className="yours-badge" style={{color: '#4ade80', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}><CheckCircle2 size={12}/> C'est votre morceau protégé !</div>}
                  </div>
                  <div className={`match-sim ${match.is_yours ? 'safe' : (match.similarity > 15 ? 'warning' : 'safe')}`}>
                    {match.is_yours ? <CheckCircle2 size={16} /> : (match.similarity > 15 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />)}
                    {match.similarity}% Simil.
                  </div>
                </div>
              )) : (
                <div className="no-matches" style={{color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px'}}>Aucune correspondance notable trouvée. Votre piste semble unique.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
