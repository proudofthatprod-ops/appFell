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
    
    # 1. Vérification Copyright avec Shazam API via RapidAPI
    rapidapi_key = "ef5d157d95mshc3ab37f1d36317ep16a6f8jsnafcab3d4db10"
    
    if rapidapi_key:
        try:
            with open(audio_path, 'rb') as f:
                url = "https://shazam-api6.p.rapidapi.com/shazam/recognize/"
                headers = {
                    "x-rapidapi-key": rapidapi_key,
                    "x-rapidapi-host": "shazam-api6.p.rapidapi.com"
                }
                files = {
                    "upload_file": f,
                }
                
                print("Envoi de la requête à l'API Shazam (RapidAPI)...")
                response = requests.post(url, headers=headers, files=files)
                result_json = response.json()
                
                # shazam-api6 retourne track dans le json si détecté
                if "track" in result_json:
                    track = result_json["track"]
                    matches.append({
                        "title": track.get("title", "Titre Inconnu"),
                        "artist": track.get("subtitle", "Artiste Inconnu"),
                        "similarity": 100 # Détection experte Shazam
                    })
                    originality = 0 # Contenu copyrighté détecté
                else:
                    print("Shazam API: Aucune correspondance ou erreur:", result_json)
                    
        except Exception as e:
            print(f"Erreur lors de la requête Shazam API: {e}")
    else:
        print("Avertissement: Aucune clé Shazam API définie.")
        
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
