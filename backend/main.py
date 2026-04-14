from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
from analyzer import analyze_audio

app = FastAPI(title="BeatDNA Audio Analysis API")

# Configuration CORS pour permettre la requête depuis Vite (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp", exist_ok=True)

@app.get("/")
def read_root():
    return {"status": "Backend is running!"}

@app.post("/api/analyze")
async def extract_fingerprint(audioFile: UploadFile = File(...)):
    if not audioFile.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Enregistrer le fichier téléchargé dans un dossier temporaire
    temp_filename = f"temp/{uuid.uuid4()}_{audioFile.filename}"
    try:
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(audioFile.file, buffer)
            
        # Lancer l'analyse via l'IA librosa
        result = await analyze_audio(temp_filename)
        
        if "error" in result:
             raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Nettoyer une fois terminé
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except:
                pass
