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
        # Using the correct endpoint with sstr parameter for wildcard search
        sbdb_url = "https://ssd-api.jpl.nasa.gov/sbdb.api"
        
        # Parameters for the SBDB query
        # Search for objects with names containing the query string using wildcards
        params = {
            "sstr": f"*{query}*"  # Wildcard search for partial name matching
        }
        
        # Make request to NASA SBDB API
        response = requests.get(sbdb_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Check if the API returned multiple matches (code "300")
        if data.get("code") == "300" and data.get("list"):
            # Multiple matches found - this is what we want for autocomplete
            asteroid_list = data["list"]
            
            # Limit results to the requested number
            limited_results = asteroid_list[:limit]
            
            # Format results for frontend consumption
            formatted_results = []
            for item in limited_results:
                asteroid_info = {
                    "pdes": item.get("pdes", ""),
                    "name": item.get("name", ""),
                    "full_name": item.get("name", ""),  # Using name as full_name for consistency
                    "display_name": item.get("name", "")  # For dropdown display
                }
                formatted_results.append(asteroid_info)
            
            logger.info(f"Found {len(formatted_results)} matching asteroids")
            
            return {
                "query": query,
                "results": formatted_results,
                "total": len(formatted_results),
                "message": f"Found {len(formatted_results)} asteroids matching '{query}'"
            }
            
        elif data.get("code") == "200":
            # Single exact match found
            asteroid_info = {
                "pdes": data.get("object", {}).get("pdes", ""),
                "name": data.get("object", {}).get("fullname", ""),
                "full_name": data.get("object", {}).get("fullname", ""),
                "display_name": data.get("object", {}).get("fullname", "")
            }
            
            return {
                "query": query,
                "results": [asteroid_info],
                "total": 1,
                "message": f"Found exact match for '{query}'"
            }
            
        else:
            # No matches found or other response
            logger.warning(f"No asteroids found for query: {query}. API response code: {data.get('code')}")
            return {
                "query": query,
                "results": [],
                "total": 0,
                "message": f"No asteroids found matching '{query}'"
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

# Detailed asteroid data endpoint using NASA SBDB API
@app.get("/asteroids/details")
async def asteroid_details(
    name: str = Query(..., description="Asteroid name to get detailed information for")
):
    """
    Get detailed asteroid information from NASA's SBDB API including physical parameters
    
    Args:
        name: The name of the asteroid to look up (e.g., "1566 Icarus (1949 MA)")
    
    Returns:
        Detailed asteroid data including orbital elements, physical parameters, and data quality
    """
    try:
        logger.info(f"Fetching detailed data for asteroid: {name}")
        
        # Extract just the asteroid name from the full name format
        # e.g., "1566 Icarus (1949 MA)" -> "Icarus"
        def extract_asteroid_name(full_name):
            # Remove leading/trailing whitespace
            full_name = full_name.strip()
            
            # Use regex to find the pattern: number followed by space, then capture the name before parentheses
            pattern = r'^\d+\s+([^(]+)'
            match = re.match(pattern, full_name)
            
            if match:
                # Extract the name part and remove trailing whitespace
                asteroid_name = match.group(1).strip()
                logger.info(f"Extracted asteroid name: '{asteroid_name}' from '{full_name}'")
                return asteroid_name
            else:
                # If no number prefix found, try to extract name before parentheses
                if '(' in full_name:
                    asteroid_name = full_name.split('(')[0].strip()
                    logger.info(f"Extracted asteroid name (fallback): '{asteroid_name}' from '{full_name}'")
                    return asteroid_name
                else:
                    # If no pattern matches, use the original name
                    logger.info(f"Using original name: '{full_name}'")
                    return full_name
        
        # Extract the clean asteroid name for the API call
        clean_name = extract_asteroid_name(name)
        
        # NASA SBDB API endpoint for detailed asteroid data
        sbdb_url = "https://ssd-api.jpl.nasa.gov/sbdb.api"
        
        # Parameters for the SBDB query
        params = {
            "sstr": clean_name,  # Search string (cleaned asteroid name)
            "phys-par": "1"  # Include physical parameters
        }
        
        # Make request to NASA SBDB API
        response = requests.get(sbdb_url, params=params, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        print(data)
        # Check if we got valid data
        if data.get("object"):
            logger.info(f"Successfully retrieved detailed data for: {name} (searched as: {clean_name})")
            return {
                "success": True,
                "asteroid_name": name,
                "search_name": clean_name,
                "data": data,
                "message": f"Successfully retrieved detailed data for {name}"
            }
        else:
            logger.warning(f"No detailed data found for asteroid: {name} (searched as: {clean_name})")
            return {
                "success": False,
                "asteroid_name": name,
                "search_name": clean_name,
                "data": None,
                "message": f"No detailed data found for asteroid '{name}' (searched as '{clean_name}')"
            }
        
    except requests.RequestException as e:
        logger.error(f"Error calling NASA SBDB API for details: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch detailed asteroid data: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching asteroid details: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )