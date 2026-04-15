import librosa
import numpy as np
import os
import asyncio
from shazamio import Shazam
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

async def analyze_audio(audio_path: str, user_artist_name: str = None):
    """
    Extrait les caractéristiques avec librosa et vérifie le copyright mondial avec Shazamio.
    """
    features = extract_features(audio_path)
    if not features:
        return {"error": "Failed to analyze audio."}

    matches = []
    originality = 100
    
    # 1. Vérification Copyright avec Shazam API via shazamio
    try:
        shazam = Shazam()
        print("Envoi de la requête à Shazam API...")
        out = await shazam.recognize(audio_path)
        
        # shazamio retourne 'track' dans l'objet principal si détecté
        if out and 'track' in out:
            track = out['track']
            found_title = track.get("title", "Titre Inconnu")
            found_artist = track.get("subtitle", "Artiste Inconnu")
            
            is_yours = False
            if user_artist_name and user_artist_name.strip().lower() in found_artist.lower():
                is_yours = True
                print(f"Match whitelisté ! L'artiste {found_artist} correspond à {user_artist_name}")
                # We don't penalize originality
            else:
                originality = 0 # Contenu copyrighté détecté
                
            matches.append({
                "title": found_title,
                "artist": found_artist,
                "similarity": 100, # Détection experte Shazam
                "is_yours": is_yours
            })
        else:
            print("Shazam: Aucune correspondance.")
            
    except Exception as e:
        print(f"Erreur lors de la requête Shazam API: {e}")
        
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
