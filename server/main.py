from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create FastAPI instance
app = FastAPI(
    title="Meteor Madness API",
    description="A basic FastAPI server for Meteor Madness AI-based Meteor deflection system",
    version="1.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint that returns a welcome message
    """
    return {
        "message": "Welcome to Meteor Madness API",
        "status": "Server is running!",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "message": "Server is operational"}

# Example endpoint for meteor data
@app.get("/meteors")
async def get_meteors():
    """
    Example endpoint to return meteor data
    """
    return {
        "meteors": [
            {
                "id": 1,
                "name": "Example Meteor",
                "size": "medium",
                "threat_level": "low"
            }
        ],
        "count": 1
    }

# Example POST endpoint
@app.post("/meteor/analyze")
async def analyze_meteor(meteor_data: dict):
    """
    Example POST endpoint to analyze meteor data
    """
    return {
        "message": "Meteor analysis completed",
        "data": meteor_data,
        "analysis_result": "Safe trajectory"
    }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )