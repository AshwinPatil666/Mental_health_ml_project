# Mindmetrics: mental health prediction dashboard

- `backend/`: your FastAPI app (unchanged `main.py`) plus the model saved as `Mental_Health_Model.pkl`
- `frontend/`: React + Vite + TypeScript + Tailwind + React Router + Lucide + Recharts

## Run
Backend (terminal 1):
    cd backend && pip install fastapi uvicorn joblib pandas scikit-learn
    uvicorn main:app --reload --port 8000

Frontend (terminal 2):
    cd frontend && npm install && npm run dev      # http://localhost:5173

API URL is set in `frontend/.env` (`VITE_API_BASE_URL=http://127.0.0.1:8000`).
