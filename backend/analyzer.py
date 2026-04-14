import librosa
import numpy as np
import requests
import os
from dotenv import load_dotenv

load_dotenv()

def extract_features(audio_path: str):
    """
    Extrait les features audios (tempo, chroma, spectral contrast) avec librosa.
    """
    try:
        # On limite l'analyse aux 30 premières secondes pour éviter de planter ou de surcharger les serveurs gratuits
        y, sr = librosa.load(audio_path, sr=22050, mono=True, duration=30)
        
        # 1. Tempo (Rythme)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        if isinstance(tempo, np.ndarray):
            tempo = tempo[0]
            
        # 2. Chromagram (Mélodie/Harmonie)
        chroma_stft = librosa.feature.chroma_stft(y=y, sr=sr)
        chroma_mean = np.mean(chroma_stft)
        
        # 3. Contraste Spectral (Timbre/Texture)
        S = np.abs(librosa.stft(y))
        contrast = librosa.feature.spectral_contrast(S=S, sr=sr)
        contrast_mean = np.mean(contrast)

        return {
            "tempo": float(tempo),
            "chroma_mean": float(chroma_mean),
            "spectral_contrast_mean": float(contrast_mean)
        }
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

def analyze_audio(audio_path: str):
    """
    Extrait les caractéristiques avec librosa et vérifie le copyright mondial avec AudD.
    """
    features = extract_features(audio_path)
    if not features:
        return {"error": "Failed to analyze audio."}

    matches = []
    originality = 100
    
    # 1. Vérification Copyright avec AudD API
    # Token codé en dur momentanément pour éviter les bugs Render .env manquants !
    api_token = os.getenv("AUDD_API_TOKEN", "1541993fdafd017377e74c7d20f63016")
    
    if api_token:
        try:
            with open(audio_path, 'rb') as f:
                data = {
                    'api_token': api_token,
                    'return': 'apple_music,spotify',
                }
                files = {
                    'file': f,
                }
                
                print("Envoi de la requête à l'API AudD...")
                response = requests.post("https://api.audd.io/", data=data, files=files)
                result_json = response.json()
                
                if result_json.get("status") == "success" and result_json.get("result"):
                    # Un morceau a été détecté
                    match = result_json["result"]
                    matches.append({
                        "title": match.get("title", "Titre Inconnu"),
                        "artist": match.get("artist", "Artiste Inconnu"),
                        "similarity": 100 # Détection de fingerprint exact
                    })
                    originality = 0 # Contenu copyrighté détecté
                elif result_json.get("status") == "error":
                    print("Erreur AudD API:", result_json.get("error"))
                    
        except Exception as e:
            print(f"Erreur lors de la requête AudD API: {e}")
    else:
        print("Avertissement: Aucun AUDD_API_TOKEN défini dans le .env")
        
    # 2. Continuer à calculer les scores Visuels avec Librosa
    melody_score = min(100, int(features["chroma_mean"] * 150))
    rhythm_score = min(100, int((features["tempo"] / 200) * 100))
    timbre_score = min(100, int((features["spectral_contrast_mean"] / 30) * 100))

    return {
        "originality": originality,
        "melody": melody_score,
        "rhythm": rhythm_score,
        "timbre": timbre_score,
        "matches": matches,
        "raw_features": features
    }
