from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
from typing import List, Dict, Any, Optional
import logging
import json
import re
from physics_engine import PhysicsEngine, AsteroidProperties, AsteroidComposition

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize physics engine
physics_engine = PhysicsEngine()

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

# Physics Engine Impact Analysis API
@app.get("/physics/impact-analysis")
async def analyze_asteroid_impact(
    diameter: float = Query(..., gt=0, description="Asteroid diameter in meters"),
    mass: Optional[float] = Query(None, gt=0, description="Asteroid mass in kg (optional, calculated from density if not provided)"),
    density: Optional[float] = Query(None, gt=0, description="Asteroid density in kg/m³ (optional, uses composition default if not provided)"),
    composition: str = Query("ROCKY", description="Asteroid composition: ROCKY, METALLIC, ICY, or CARBONACEOUS"),
    velocity: float = Query(20000, gt=0, description="Impact velocity in m/s (default: 20000)"),
    angle: float = Query(45, ge=0, le=90, description="Impact angle in degrees (default: 45)"),
    population_density: float = Query(100, ge=0, description="Population density in people/km² (default: 100)"),
    deflection_distance: Optional[float] = Query(None, gt=0, description="Required deflection distance in meters (optional, for deflection analysis)"),
    warning_time: Optional[float] = Query(None, gt=0, description="Available warning time in seconds (optional, for deflection analysis)"),
    available_energy: Optional[float] = Query(None, gt=0, description="Available deflection energy in Joules (optional, for deflection analysis)")
):
    """
    Analyze asteroid impact physics and calculate damage radii with gradient ordering
    
    Required Query Parameters:
    - diameter: Asteroid diameter in meters (must be > 0)
    
    Optional Query Parameters:
    - mass: Asteroid mass in kg (calculated from density/composition if not provided)
    - density: Asteroid density in kg/m³ (uses composition default if not provided)
    - composition: ROCKY (default), METALLIC, ICY, or CARBONACEOUS
    - velocity: Impact velocity in m/s (default: 20000)
    - angle: Impact angle in degrees 0-90 (default: 45)
    - population_density: People per km² (default: 100)
    - deflection_distance: Required deflection distance in meters (for deflection analysis)
    - warning_time: Available warning time in seconds (for deflection analysis)
    - available_energy: Available deflection energy in Joules (for deflection analysis)
    
    Returns:
    - Complete impact analysis with radii in gradient order (most severe to least severe)
    - Energy calculations and TNT equivalents
    - Casualty estimates
    - Deflection feasibility (if deflection parameters provided)
    """
    try:
        logger.info(f"Analyzing asteroid impact: diameter={diameter}m, composition={composition}")
        
        # Validate composition
        try:
            composition_enum = AsteroidComposition[composition.upper()]
        except KeyError:
            valid_compositions = [comp.name for comp in AsteroidComposition]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid composition '{composition}'. Valid options: {valid_compositions}"
            )
        
        # Create asteroid properties
        asteroid = AsteroidProperties(
            diameter=diameter,
            mass=mass,
            density=density,
            composition=composition_enum,
            velocity=velocity,
            angle=angle
        )
        
        # Perform impact analysis
        results = physics_engine.analyze_impact(asteroid, population_density)
        
        # Create gradient-ordered radii (most severe to least severe impact)
        impact_radii = []
        
        # Add thermal effects radius
        if results.thermal_radius > 0:
            impact_radii.append({
                "type": "thermal_burns",
                "description": "3rd degree burns from thermal radiation",
                "radius_meters": results.thermal_radius,
                "radius_km": results.thermal_radius / 1000,
                "severity_level": 1,
                "color_code": "#FF0000"  # Red for most severe
            })
        
        # Add overpressure radii in order of severity
        overpressure_order = [
            ("total_destruction", "Total destruction", 1, "#800000"),  # Dark red
            ("severe_damage", "Severe structural damage", 2, "#FF4500"),  # Orange red
            ("moderate_damage", "Moderate damage", 3, "#FFA500"),  # Orange
            ("light_damage", "Light damage", 4, "#FFFF00")  # Yellow
        ]
        
        for level, description, severity, color in overpressure_order:
            if level in results.overpressure_radius and results.overpressure_radius[level] > 0:
                impact_radii.append({
                    "type": f"overpressure_{level}",
                    "description": description,
                    "radius_meters": results.overpressure_radius[level],
                    "radius_km": results.overpressure_radius[level] / 1000,
                    "severity_level": severity,
                    "color_code": color
                })
        
        # Sort by radius (largest first for gradient effect)
        impact_radii.sort(key=lambda x: x["radius_meters"], reverse=True)
        
        # Prepare basic impact analysis response
        response = {
            "success": True,
            "asteroid_parameters": {
                "diameter_m": asteroid.diameter,
                "mass_kg": asteroid.mass,
                "density_kg_m3": asteroid.density,
                "composition": composition.upper(),
                "velocity_ms": asteroid.velocity,
                "angle_degrees": asteroid.angle
            },
            "energy_analysis": {
                "kinetic_energy_joules": results.kinetic_energy,
                "tnt_equivalent_megatons": results.tnt_equivalent,
                "impact_type": results.impact_type.value,
                "airburst_altitude_km": results.airburst_altitude / 1000 if results.airburst_altitude else None,
                "crater_diameter_m": results.crater_diameter if results.crater_diameter > 0 else None,
                "seismic_magnitude": results.seismic_magnitude
            },
            "impact_radii_gradient": impact_radii,
            "casualty_estimates": results.casualty_estimate,
            "analysis_metadata": {
                "population_density_per_km2": population_density,
                "total_affected_area_km2": max([r["radius_km"]**2 * 3.14159 for r in impact_radii], default=0),
                "max_impact_radius_km": max([r["radius_km"] for r in impact_radii], default=0)
            }
        }
        
        # Add deflection analysis if parameters provided
        if all(param is not None for param in [deflection_distance, warning_time, available_energy]):
            # Type checking ensures these are not None at this point
            deflection_analysis = physics_engine.assess_deflection_feasibility(
                asteroid, deflection_distance, warning_time, available_energy  # type: ignore
            )
            
            response["deflection_analysis"] = {
                "feasible": deflection_analysis["feasible"],
                "required_energy_joules": deflection_analysis["required_energy"],
                "available_energy_joules": deflection_analysis["available_energy"],
                "energy_ratio": deflection_analysis["energy_ratio"],
                "success_probability": deflection_analysis["success_probability"],
                "deflection_parameters": {
                    "required_deflection_distance_m": deflection_distance,
                    "warning_time_seconds": warning_time,
                    "warning_time_days": warning_time / 86400  # type: ignore
                }
            }
        
        logger.info(f"Successfully analyzed asteroid impact: {len(impact_radii)} damage zones identified")
        return response
        
    except ValueError as e:
        logger.error(f"Invalid parameter value: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid parameter: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error in physics analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Physics analysis error: {str(e)}"
        )

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )