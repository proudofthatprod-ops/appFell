import json
from analyzer import analyze_audio

def run_test():
    audio_file = "dummy.wav"
    print(f"Lancement de l'analyse locale sur le fichier : {audio_file}...\n")
    
    result = analyze_audio(audio_file)
    
    print("\n--- Résultat de l'analyse ---")
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    run_test()
