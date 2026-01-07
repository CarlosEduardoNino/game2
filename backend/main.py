from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .models import Person, RouletteConfig, Assignment
from .email_service import send_assignment_email
import random
from datetime import datetime
import os

import json

app = FastAPI(title="Accua Game API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "participants.json")
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

def load_participants():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception:
            return []
    return []

def save_participants(participants):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(participants, f, indent=4, ensure_ascii=False)

@app.get("/api/participants")
async def get_participants():
    return load_participants()

@app.post("/api/participants")
async def add_participant(person: Person):
    participants = load_participants()
    participants.append(person.dict())
    save_participants(participants)
    return person

@app.delete("/api/participants/{name}")
async def delete_participant(name: str):
    participants = load_participants()
    new_participants = [p for p in participants if p["name"] != name]
    save_participants(new_participants)
    return {"status": "success"}

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "data", "assignments.json")

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=4, ensure_ascii=False)

@app.get("/api/history")
async def get_history():
    return load_history()

@app.delete("/api/history")
async def clear_history():
    save_history([])
    return {"status": "success"}

from datetime import datetime, timedelta

SPANISH_MONTHS = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
}

@app.post("/api/spin")
async def spin_roulette():
    participants = load_participants()
    if not participants:
        raise HTTPException(status_code=400, detail="No hay participantes disponibles")
    
    # SHUFFLE to ensure absolute fairness and breakage of any 'last added' bias
    indices = list(range(len(participants)))
    random.shuffle(indices)
    
    # Pick a random index from the already shuffled list
    chosen_pos = random.randrange(len(indices))
    selected_index = indices[chosen_pos]
    
    selected_data = participants[selected_index]
    selected_person = Person(**selected_data)
    
    # Load history to find the next date
    history = load_history()
    last_date = None
    if history:
        try:
            last_date_str = history[0]["date"]
            last_date = datetime.strptime(last_date_str, "%d/%m/%Y")
        except Exception:
            pass
    
    if last_date:
        assigned_date = last_date + timedelta(days=7)
    else:
        assigned_date = datetime.now()
    
    current_date = assigned_date.strftime("%d/%m/%Y")
    current_month_name = SPANISH_MONTHS.get(assigned_date.month, assigned_date.strftime("%B"))
    week_num = (assigned_date.day - 1) // 7 + 1
    
    # Save to history (ONLY NAME, no email as per request)
    new_entry = {
        "name": selected_person.name,
        "date": current_date,
        "month": current_month_name,
        "week": f"Semana {week_num}"
    }
    history.insert(0, new_entry)
    save_history(history)
    
    # REMOVE winner from active participants
    new_participants = [p for i, p in enumerate(participants) if i != selected_index]
    save_participants(new_participants)
    
    # (Email skip logic - no email sending here)
    
    return {
        "selected_person": selected_person,
        "target_index": selected_index, # IMPORTANT for frontend sync
        "month": current_month_name,
        "week": f"Semana {week_num}",
        "date": current_date,
        "participants_left": len(new_participants)
    }

from fastapi.responses import FileResponse

# ... (rest of the code remains same until static serving)

# Production Static Serving and SPA Support
# Change this to "frontend/dist" for deployment, or just "dist" if you copy files
# We will use "dist" as the default production folder
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if not os.path.exists(dist_dir):
    # Fallback for local folder named "static" if that's what we used before
    dist_dir = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Return index.html for any route that doesn't match an API
    index_file = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "Frontend build not found. Please run 'npm run build' in the frontend folder."}

if __name__ == "__main__":
    import uvicorn
    # Allow external connections in production
    uvicorn.run(app, host="0.0.0.0", port=8000)
