import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.routes import router as api_router

app = FastAPI(
    title="VibeData Analytics API",
    description="Backend service for scoping, profiling, and cleaning datasets interactively.",
    version="1.0.0"
)

# Set up CORS middleware to allow connection from React/Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all. In production, restrict.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "VibeData Backend API is active and healthy!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
