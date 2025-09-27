from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
from typing import List, Dict, Any
import logging
import json
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Asteroid autocomplete endpoint using NASA SBDB API
@app.get("/asteroids/autocomplete")
async def asteroid_autocomplete(
    query: str = Query(..., min_length=1, description="Partial asteroid name to search for"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results to return")
):
    """
    Get autocomplete suggestions for asteroid names using NASA's SBDB API
    
    Args:
        query: Partial asteroid name (minimum 1 character)
        limit: Maximum number of results (1-50, default 10)
    
    Returns:
        List of matching asteroid names and basic information
    """
    try:
        logger.info(f"Searching for asteroids matching: {query}")
        
        # NASA SBDB API endpoint for small body lookup
        # We'll search for asteroids that match the query
        sbdb_url = "https://ssd-api.jpl.nasa.gov/sbdb_query.api"
        
        # Parameters for the SBDB query
        # Search for objects with names containing the query string
        params = {
            "fields": "spkid,full_name,name,prefix,diameter,orbit_class,pha",
            "sb-kind": "a",  # asteroids only
            "sb-group": "neo",  # Near-Earth Objects for relevance
            "limit": str(limit * 3),  # Get more results to filter
            "format": "json"
        }
        
        # Make request to NASA SBDB API
        response = requests.get(sbdb_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if not data.get("data"):
            logger.warning(f"No data returned from SBDB API for query: {query}")
            return {
                "query": query,
                "results": [],
                "total": 0,
                "message": "No asteroids found matching the query"
            }
        
        # Filter results based on the query string
        filtered_results = []
        query_lower = query.lower()
        
        for item in data["data"]:
            full_name = item[1] if len(item) > 1 else ""
            name = item[2] if len(item) > 2 else ""
            
            # Check if query matches full name or name
            if (full_name and query_lower in full_name.lower()) or \
               (name and query_lower in name.lower()):
                
                asteroid_info = {
                    "spkid": item[0] if len(item) > 0 else None,
                    "full_name": full_name,
                    "name": name,
                    "prefix": item[3] if len(item) > 3 else "",
                    "diameter": item[4] if len(item) > 4 else None,
                    "orbit_class": item[5] if len(item) > 5 else "",
                    "is_potentially_hazardous": item[6] if len(item) > 6 else False
                }
                
                filtered_results.append(asteroid_info)
                
                if len(filtered_results) >= limit:
                    break
        
        logger.info(f"Found {len(filtered_results)} matching asteroids")
        
        return {
            "query": query,
            "results": filtered_results,
            "total": len(filtered_results),
            "message": f"Found {len(filtered_results)} asteroids matching '{query}'"
        }
        
    except requests.RequestException as e:
        logger.error(f"Error calling NASA SBDB API: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch asteroid data: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in asteroid autocomplete: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Alternative autocomplete using a simpler approach with known asteroid names
@app.get("/asteroids/autocomplete-simple")
async def asteroid_autocomplete_simple(
    query: str = Query(..., min_length=1, description="Partial asteroid name to search for"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results to return")
):
    """
    Simple autocomplete for well-known asteroids (fallback method)
    """
    # List of well-known asteroids for demonstration
    known_asteroids = [
        {"name": "Ceres", "full_name": "1 Ceres", "type": "dwarf planet"},
        {"name": "Pallas", "full_name": "2 Pallas", "type": "asteroid"},
        {"name": "Juno", "full_name": "3 Juno", "type": "asteroid"},
        {"name": "Vesta", "full_name": "4 Vesta", "type": "asteroid"},
        {"name": "Apophis", "full_name": "99942 Apophis", "type": "potentially hazardous"},
        {"name": "Bennu", "full_name": "101955 Bennu", "type": "potentially hazardous"},
        {"name": "Ryugu", "full_name": "162173 Ryugu", "type": "near-Earth"},
        {"name": "Itokawa", "full_name": "25143 Itokawa", "type": "near-Earth"},
        {"name": "Eros", "full_name": "433 Eros", "type": "near-Earth"},
        {"name": "Ida", "full_name": "243 Ida", "type": "main belt"},
        {"name": "Gaspra", "full_name": "951 Gaspra", "type": "main belt"},
        {"name": "Mathilde", "full_name": "253 Mathilde", "type": "main belt"},
        {"name": "Steins", "full_name": "2867 Steins", "type": "main belt"},
        {"name": "Lutetia", "full_name": "21 Lutetia", "type": "main belt"},
        {"name": "Didymos", "full_name": "65803 Didymos", "type": "binary asteroid"},
    ]
    
    query_lower = query.lower()
    matches = []
    
    for asteroid in known_asteroids:
        if (query_lower in asteroid["name"].lower() or 
            query_lower in asteroid["full_name"].lower()):
            matches.append(asteroid)
            
            if len(matches) >= limit:
                break
    
    return {
        "query": query,
        "results": matches,
        "total": len(matches),
        "message": f"Found {len(matches)} known asteroids matching '{query}'"
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