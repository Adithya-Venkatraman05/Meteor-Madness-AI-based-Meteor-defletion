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

# Enhanced Physics Engine Impact Analysis API with NASA SBDB Integration
@app.get("/physics/impact-analysis")
async def analyze_asteroid_impact(
    # Basic physical parameters
    diameter: float = Query(..., gt=0, description="Asteroid diameter in meters"),
    mass: Optional[float] = Query(None, gt=0, description="Asteroid mass in kg (optional, calculated from density if not provided)"),
    density: Optional[float] = Query(None, gt=0, description="Asteroid density in kg/m³ (optional, uses composition default if not provided)"),
    composition: str = Query("ROCKY", description="Asteroid composition: ROCKY, METALLIC, ICY, or CARBONACEOUS"),
    
    # NASA SBDB Physical Parameters
    absolute_magnitude: Optional[float] = Query(None, description="Absolute magnitude (H) from NASA SBDB"),
    geometric_albedo: Optional[float] = Query(None, ge=0, le=1, description="Geometric albedo from NASA SBDB"),
    rotation_period: Optional[float] = Query(None, gt=0, description="Rotation period in hours from NASA SBDB"),
    color_b_v: Optional[float] = Query(None, description="B-V color index from NASA SBDB"),
    color_u_b: Optional[float] = Query(None, description="U-B color index from NASA SBDB"),
    
    # Orbital Elements from NASA SBDB
    eccentricity: Optional[float] = Query(None, ge=0, lt=1, description="Orbital eccentricity"),
    semi_major_axis: Optional[float] = Query(None, gt=0, description="Semi-major axis in AU"),
    perihelion_distance: Optional[float] = Query(None, gt=0, description="Perihelion distance in AU"),
    aphelion_distance: Optional[float] = Query(None, gt=0, description="Aphelion distance in AU"),
    inclination: Optional[float] = Query(None, ge=0, le=180, description="Orbital inclination in degrees"),
    longitude_ascending_node: Optional[float] = Query(None, ge=0, lt=360, description="Longitude of ascending node in degrees"),
    argument_perihelion: Optional[float] = Query(None, ge=0, lt=360, description="Argument of perihelion in degrees"),
    mean_anomaly: Optional[float] = Query(None, ge=0, lt=360, description="Mean anomaly in degrees"),
    orbital_period: Optional[float] = Query(None, gt=0, description="Orbital period in days"),
    mean_motion: Optional[float] = Query(None, gt=0, description="Mean motion in deg/day"),
    moid: Optional[float] = Query(None, ge=0, description="Minimum Orbit Intersection Distance in AU"),
    
    # Impact analysis parameters
    velocity: Optional[float] = Query(None, gt=0, description="Impact velocity in m/s (calculated from orbital mechanics if not provided)"),
    angle: Optional[float] = Query(None, ge=0, le=90, description="Impact angle in degrees (calculated from orbital geometry if not provided)"),
    impact_latitude: Optional[float] = Query(None, ge=-90, le=90, description="Impact latitude in degrees (optional, for specific impact location)"),
    impact_longitude: Optional[float] = Query(None, ge=-180, le=180, description="Impact longitude in degrees (optional, for specific impact location)"),
    population_density: float = Query(100, ge=0, description="Population density in people/km² (default: 100)"),
    
    # Deflection analysis parameters
    deflection_distance: Optional[float] = Query(None, gt=0, description="Required deflection distance in meters (optional, for deflection analysis)"),
    warning_time: Optional[float] = Query(None, gt=0, description="Available warning time in seconds (optional, for deflection analysis)"),
    available_energy: Optional[float] = Query(None, gt=0, description="Available deflection energy in Joules (optional, for deflection analysis)")
):
    """
    Enhanced asteroid impact analysis using NASA SBDB data and orbital mechanics
    
    Required Parameters:
    - diameter: Asteroid diameter in meters
    
    NASA SBDB Physical Parameters (Optional):
    - absolute_magnitude, geometric_albedo, rotation_period, color indices
    
    Orbital Elements (Optional):
    - eccentricity, semi_major_axis, inclination, MOID, etc.
    
    Impact Analysis Parameters:
    - velocity, angle (calculated from orbital mechanics if not provided)
    - impact_latitude, impact_longitude (specific impact location)
    - population_density, deflection parameters
    
    Returns:
    - Complete enhanced impact analysis with:
      * Impact coordinates (uses provided lat/lng or calculates from orbital mechanics)
      * Airburst altitude determination
      * Crater diameter predictions  
      * Seismic magnitude estimation
      * Thermal and overpressure damage zones
      * Deflection planning analysis
      * Orbital classification and approach geometry
    """
    try:
        logger.info(f"🚀 Enhanced asteroid impact analysis starting...")
        logger.info(f"📊 Parameters received: diameter={diameter}m, composition={composition}")
        logger.info(f"📡 Physical params: mass={mass}, density={density}")
        logger.info(f"🌟 NASA SBDB: abs_mag={absolute_magnitude}, albedo={geometric_albedo}")
        logger.info(f"🔄 Rotation: period={rotation_period}, colors=B-V:{color_b_v}, U-B:{color_u_b}")
        logger.info(f"🛰️ Orbital: ecc={eccentricity}, sma={semi_major_axis}, inc={inclination}")
        logger.info(f"💥 Impact: velocity={velocity}m/s, angle={angle}°, pop_density={population_density}")
        logger.info(f"📍 Coordinates: lat={impact_latitude}°, lng={impact_longitude}°")
        logger.info(f"🎯 Deflection: distance={deflection_distance}, time={warning_time}, energy={available_energy}")
        
        # Import the enhanced classes
        from physics_engine import OrbitalElements, ImpactCoordinates
        
        # Validate composition
        try:
            composition_enum = AsteroidComposition[composition.upper()]
        except KeyError:
            valid_compositions = [comp.name for comp in AsteroidComposition]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid composition '{composition}'. Valid options: {valid_compositions}"
            )
        
        # Create orbital elements if provided
        orbital_elements = None
        if any([eccentricity, semi_major_axis, inclination, moid]):
            orbital_elements = OrbitalElements(
                eccentricity=eccentricity or 0.0,
                semi_major_axis=semi_major_axis or 1.0,
                perihelion_distance=perihelion_distance or (semi_major_axis or 1.0) * (1 - (eccentricity or 0.0)),
                aphelion_distance=aphelion_distance or (semi_major_axis or 1.0) * (1 + (eccentricity or 0.0)),
                inclination=inclination or 0.0,
                longitude_ascending_node=longitude_ascending_node or 0.0,
                argument_perihelion=argument_perihelion or 0.0,
                mean_anomaly=mean_anomaly or 0.0,
                orbital_period=orbital_period or 365.25,
                mean_motion=mean_motion or 1.0,
                moid=moid or 1.0,
                absolute_magnitude=absolute_magnitude or 20.0
            )
            logger.info(f"Created orbital elements: e={eccentricity}, a={semi_major_axis} AU, i={inclination}°")
        
        # Create enhanced asteroid properties with NASA SBDB data
        asteroid = AsteroidProperties(
            diameter=diameter,
            mass=mass,
            density=density,
            composition=composition_enum,
            velocity=velocity,  # Will be calculated from orbital mechanics if None
            angle=angle,        # Will be calculated from orbital geometry if None
            
            # NASA SBDB Physical Parameters
            absolute_magnitude=absolute_magnitude,
            geometric_albedo=geometric_albedo,
            rotation_period=rotation_period,
            color_b_v=color_b_v,
            color_u_b=color_u_b,
            
            # Orbital Elements
            orbital_elements=orbital_elements
        )
        
        logger.info(f"🌍 Created enhanced asteroid object:")
        logger.info(f"  - Diameter: {asteroid.diameter}m")
        logger.info(f"  - Mass: {asteroid.mass}kg")
        logger.info(f"  - Density: {asteroid.density}kg/m³")
        logger.info(f"  - Composition: {asteroid.composition}")
        logger.info(f"  - Velocity: {asteroid.velocity}m/s")
        logger.info(f"  - Angle: {asteroid.angle}°")
        logger.info(f"  - Orbital data present: {orbital_elements is not None}")
        logger.info(f"  - NASA SBDB data: abs_mag={asteroid.absolute_magnitude}, albedo={asteroid.geometric_albedo}")
        
        # Create impact coordinates if provided
        provided_coordinates = None
        if impact_latitude is not None and impact_longitude is not None:
            logger.info(f"📍 Using provided impact coordinates: ({impact_latitude}, {impact_longitude})")
            provided_coordinates = ImpactCoordinates(
                latitude=impact_latitude,
                longitude=impact_longitude,
                impact_region="Unknown",  # Will be calculated by physics engine
                nearest_city="",  # Will be calculated by physics engine
                distance_to_city=0.0,  # Will be calculated by physics engine
                local_time=""  # Will be calculated by physics engine
            )
        
        # Perform enhanced impact analysis with orbital mechanics
        logger.info(f"🔬 Starting physics analysis with population density: {population_density}")
        results = physics_engine.analyze_impact(asteroid, population_density, provided_coordinates)
        
        logger.info(f"Enhanced analysis complete: orbital_class={results.orbital_classification}, coords={results.impact_coordinates is not None}")
        
        # Create comprehensive impact radii analysis
        impact_radii = []
        
        # Add thermal effects radius (most severe)
        if results.thermal_radius > 0:
            impact_radii.append({
                "type": "thermal_burns",
                "description": "3rd degree burns from thermal radiation",
                "radius_meters": results.thermal_radius,
                "radius_km": results.thermal_radius / 1000,
                "severity_level": 1,
                "color_code": "#FF0000",  # Red for most severe
                "effect_type": "thermal"
            })
        
        # Add overpressure radii in order of severity
        overpressure_levels = [
            ("total_destruction", "Total destruction - Complete building collapse", 1, "#800000"),
            ("severe_damage", "Severe structural damage - Heavy building damage", 2, "#FF4500"),
            ("moderate_damage", "Moderate damage - Roof and wall damage", 3, "#FFA500"),
            ("light_damage", "Light damage - Window breakage", 4, "#FFFF00")
        ]
        
        for level, description, base_severity, color in overpressure_levels:
            if level in results.overpressure_radius and results.overpressure_radius[level] > 0:
                # Adjust severity based on thermal effects
                severity = base_severity + (1 if results.thermal_radius > 0 else 0)
                impact_radii.append({
                    "type": f"overpressure_{level}",
                    "description": description,
                    "radius_meters": results.overpressure_radius[level],
                    "radius_km": results.overpressure_radius[level] / 1000,
                    "severity_level": severity,
                    "color_code": color,
                    "effect_type": "overpressure"
                })
        
        # Sort by radius (largest first for gradient effect)
        impact_radii.sort(key=lambda x: x["radius_meters"], reverse=True)
        
        # Calculate comprehensive damage zones summary
        damage_zones = {
            "total_zones": len(impact_radii),
            "max_radius_km": max([r["radius_km"] for r in impact_radii], default=0),
            "total_affected_area_km2": max([r["radius_km"]**2 * 3.14159 for r in impact_radii], default=0),
            "thermal_zone_present": results.thermal_radius > 0,
            "overpressure_zones": len([r for r in impact_radii if r["effect_type"] == "overpressure"])
        }
        
        # Prepare comprehensive enhanced impact analysis response
        response = {
            "success": True,
            "analysis_type": "enhanced_orbital_mechanics",
            
            # Enhanced asteroid parameters with NASA SBDB data
            "asteroid_parameters": {
                "basic_properties": {
                    "diameter_m": asteroid.diameter,
                    "mass_kg": asteroid.mass,
                    "density_kg_m3": asteroid.density,
                    "composition": composition.upper()
                },
                "nasa_sbdb_data": {
                    "absolute_magnitude": asteroid.absolute_magnitude,
                    "geometric_albedo": asteroid.geometric_albedo,
                    "rotation_period_hours": asteroid.rotation_period,
                    "color_b_v": asteroid.color_b_v,
                    "color_u_b": asteroid.color_u_b
                },
                "calculated_properties": {
                    "approach_velocity_ms": results.approach_velocity,
                    "impact_angle_degrees": results.impact_angle_calculated,
                    "velocity_calculated_from_orbit": asteroid.calculated_velocity,
                    "angle_calculated_from_orbit": asteroid.calculated_angle
                }
            },
            
            # Orbital mechanics analysis
            "orbital_analysis": {
                "orbital_classification": results.orbital_classification,
                "orbital_elements": {
                    "eccentricity": eccentricity,
                    "semi_major_axis_au": semi_major_axis,
                    "inclination_degrees": inclination,
                    "moid_au": moid,
                    "perihelion_distance_au": perihelion_distance,
                    "aphelion_distance_au": aphelion_distance
                } if orbital_elements else None,
                "earth_threat_assessment": {
                    "potentially_hazardous": moid < 0.05 if moid else False,
                    "earth_crossing": results.orbital_classification in ["Apollo", "Aten"] if results.orbital_classification else False,
                    "close_approach_risk": "High" if (moid and moid < 0.01) else "Moderate" if (moid and moid < 0.05) else "Low"
                }
            },
            
            # Impact coordinates and location analysis
            "impact_location": {
                "coordinates": {
                    "latitude": results.impact_coordinates.latitude,
                    "longitude": results.impact_coordinates.longitude,
                    "region_type": results.impact_coordinates.impact_region,
                    "nearest_city": results.impact_coordinates.nearest_city,
                    "distance_to_city_km": results.impact_coordinates.distance_to_city,
                    "local_impact_time": results.impact_coordinates.local_time
                } if results.impact_coordinates else None,
                "geographic_analysis": {
                    "ocean_impact": results.impact_coordinates.impact_region == "Ocean" if results.impact_coordinates else False,
                    "populated_area": results.impact_coordinates.impact_region == "Populated" if results.impact_coordinates else False,
                    "remote_area": results.impact_coordinates.impact_region == "Remote" if results.impact_coordinates else False
                }
            },
            
            # Comprehensive energy and impact analysis
            "impact_analysis": {
                "energy_calculations": {
                    "kinetic_energy_joules": results.kinetic_energy,
                    "tnt_equivalent_megatons": results.tnt_equivalent,
                    "energy_per_kg_population": results.kinetic_energy / (population_density * 1000) if population_density > 0 else 0
                },
                "impact_mechanics": {
                    "impact_type": results.impact_type.value,
                    "airburst_altitude_km": results.airburst_altitude / 1000 if results.airburst_altitude else None,
                    "crater_diameter_m": results.crater_diameter if results.crater_diameter > 0 else None,
                    "seismic_magnitude": results.seismic_magnitude,
                    "surface_impact": results.impact_type.value == "surface"
                }
            },
            
            # Enhanced damage zones with comprehensive analysis
            "damage_analysis": {
                "impact_radii_by_severity": impact_radii,
                "damage_zones_summary": damage_zones,
                "thermal_effects": {
                    "thermal_radius_km": results.thermal_radius / 1000 if results.thermal_radius > 0 else 0,
                    "thermal_area_km2": (results.thermal_radius / 1000)**2 * 3.14159 if results.thermal_radius > 0 else 0,
                    "burn_casualties_estimated": results.casualty_estimate.get("severe_injuries", 0) if results.thermal_radius > 0 else 0
                },
                "overpressure_effects": {
                    "total_destruction_radius_km": results.overpressure_radius.get("total_destruction", 0) / 1000,
                    "severe_damage_radius_km": results.overpressure_radius.get("severe_damage", 0) / 1000,
                    "moderate_damage_radius_km": results.overpressure_radius.get("moderate_damage", 0) / 1000,
                    "light_damage_radius_km": results.overpressure_radius.get("light_damage", 0) / 1000
                }
            },
            
            # Casualty and population impact estimates
            "casualty_analysis": {
                "estimated_casualties": results.casualty_estimate,
                "population_analysis": {
                    "population_density_per_km2": population_density,
                    "total_population_at_risk": int(damage_zones["total_affected_area_km2"] * population_density),
                    "fatality_rate_percent": (results.casualty_estimate.get("fatalities", 0) / 
                                            max(1, damage_zones["total_affected_area_km2"] * population_density)) * 100
                }
            }
        }
        
        # Add comprehensive deflection planning analysis if parameters provided
        if all(param is not None for param in [deflection_distance, warning_time, available_energy]):
            # Type checking ensures these are not None at this point
            deflection_analysis = physics_engine.assess_deflection_feasibility(
                asteroid, deflection_distance, warning_time, available_energy  # type: ignore
            )
            
            # Calculate additional deflection metrics
            warning_time_years = warning_time / (365.25 * 24 * 3600)  # type: ignore
            energy_shortfall = max(0, deflection_analysis["required_energy"] - deflection_analysis["available_energy"])
            
            response["deflection_planning"] = {
                "feasibility_assessment": {
                    "mission_feasible": deflection_analysis["feasible"],
                    "success_probability_percent": deflection_analysis["success_probability"] * 100,
                    "energy_adequacy": "Sufficient" if deflection_analysis["feasible"] else "Insufficient",
                    "mission_difficulty": "Low" if deflection_analysis["energy_ratio"] > 2 else "Moderate" if deflection_analysis["energy_ratio"] > 1 else "High"
                },
                "energy_requirements": {
                    "required_energy_joules": deflection_analysis["required_energy"],
                    "available_energy_joules": deflection_analysis["available_energy"],
                    "energy_ratio": deflection_analysis["energy_ratio"],
                    "energy_shortfall_joules": energy_shortfall,
                    "energy_shortfall_percent": (energy_shortfall / deflection_analysis["required_energy"]) * 100 if deflection_analysis["required_energy"] > 0 else 0
                },
                "mission_parameters": {
                    "deflection_distance_m": deflection_distance,
                    "deflection_distance_km": deflection_distance / 1000,  # type: ignore
                    "warning_time_seconds": warning_time,
                    "warning_time_days": warning_time / 86400,  # type: ignore
                    "warning_time_years": warning_time_years,
                    "deflection_velocity_ms": deflection_distance / warning_time if warning_time > 0 else 0  # type: ignore
                },
                "mission_recommendations": {
                    "recommended_approach": "Kinetic Impactor" if deflection_analysis["energy_ratio"] < 10 else "Nuclear Device" if deflection_analysis["energy_ratio"] < 1 else "Gravity Tractor",
                    "multiple_missions_needed": deflection_analysis["energy_ratio"] < 0.5,
                    "early_detection_critical": warning_time_years < 5,
                    "mission_urgency": "Critical" if warning_time_years < 1 else "High" if warning_time_years < 5 else "Moderate"
                }
            }
        else:
            # Provide basic deflection guidelines even without specific parameters
            impact_energy_megatons = results.tnt_equivalent
            estimated_warning_needed_years = max(1, impact_energy_megatons * 0.1)  # Rough estimate
            
            response["deflection_planning"] = {
                "basic_assessment": {
                    "asteroid_threat_level": "Extinction Level" if impact_energy_megatons > 1000 else "Regional Disaster" if impact_energy_megatons > 10 else "Local Damage",
                    "estimated_warning_time_needed_years": estimated_warning_needed_years,
                    "deflection_difficulty": "Extreme" if impact_energy_megatons > 1000 else "High" if impact_energy_megatons > 100 else "Moderate",
                    "recommended_detection_advance_years": estimated_warning_needed_years * 2
                },
                "general_recommendations": {
                    "priority_level": "Planetary Defense" if impact_energy_megatons > 100 else "Regional Response" if impact_energy_megatons > 1 else "Local Monitoring",
                    "suggested_missions": ["Early Warning Systems", "Kinetic Impactor", "Gravity Tractor"] if impact_energy_megatons < 100 else ["Multiple Nuclear Devices", "Mass Deflection Systems"],
                    "international_cooperation_needed": impact_energy_megatons > 10
                },
                "note": "Provide deflection_distance, warning_time, and available_energy parameters for detailed mission analysis"
            }
        
        # Add analysis summary metadata
        response["analysis_summary"] = {
            "analysis_timestamp": f"{logger.name}_{hash(str(asteroid.diameter))}",
            "features_used": {
                "orbital_mechanics": orbital_elements is not None,
                "nasa_sbdb_data": any([absolute_magnitude, geometric_albedo, color_b_v]),
                "impact_coordinates": results.impact_coordinates is not None,
                "deflection_analysis": all(param is not None for param in [deflection_distance, warning_time, available_energy]),
                "enhanced_composition": asteroid.geometric_albedo is not None or asteroid.color_b_v is not None
            },
            "damage_zones_identified": len(impact_radii),
            "max_impact_radius_km": damage_zones["max_radius_km"],
            "orbital_classification": results.orbital_classification,
            "threat_assessment": {
                "earth_crossing": results.orbital_classification in ["Apollo", "Aten"] if results.orbital_classification else False,
                "high_energy_impact": results.tnt_equivalent > 1.0,
                "population_threat": results.casualty_estimate.get("fatalities", 0) > 1000,
                "requires_deflection": results.tnt_equivalent > 0.1
            }
        }
        
        logger.info(f"Enhanced asteroid analysis complete: {len(impact_radii)} zones, {results.orbital_classification} orbit, {results.tnt_equivalent:.2f} MT")
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

# Convenience endpoint for analyzing asteroid using NASA SBDB data directly
@app.post("/physics/analyze-from-sbdb")
async def analyze_from_sbdb_data(sbdb_data: dict):
    """
    Analyze asteroid impact using NASA SBDB data structure directly
    
    Accepts the full NASA SBDB response and extracts relevant parameters
    for comprehensive impact analysis with enhanced physics engine.
    """
    try:
        logger.info("Analyzing asteroid from NASA SBDB data structure")
        
        # Extract physical parameters from SBDB data
        obj_data = sbdb_data.get("data", {}).get("object", {})
        phys_par = sbdb_data.get("data", {}).get("phys_par", [])
        orbit = sbdb_data.get("data", {}).get("orbit", {})
        
        # Extract diameter (convert km to meters)
        diameter = None
        mass = None
        density = None
        albedo = None
        rotation_period = None
        absolute_mag = None
        color_b_v = None
        color_u_b = None
        
        for param in phys_par:
            param_name = param.get("name", "").lower()
            param_value = param.get("value")
            
            if not param_value:
                continue
                
            try:
                if param_name == "diameter":
                    diameter = float(param_value) * 1000  # Convert km to meters
                elif "albedo" in param_name:
                    albedo = float(param_value)
                elif "rotation" in param_name or "rot_per" in param_name:
                    rotation_period = float(param_value)
                elif param_name == "h" or "magnitude" in param_name:
                    absolute_mag = float(param_value)
                elif param_name == "mass":
                    mass = float(param_value)
                elif param_name == "density":
                    density = float(param_value)
                elif "b-v" in param_name:
                    color_b_v = float(param_value)
                elif "u-b" in param_name:
                    color_u_b = float(param_value)
            except (ValueError, TypeError):
                continue
        
        # Extract orbital elements
        elements = orbit.get("elements", [])
        orbital_params = {}
        
        element_mapping = {
            "e": "eccentricity",
            "a": "semi_major_axis", 
            "q": "perihelion_distance",
            "Q": "aphelion_distance",
            "i": "inclination",
            "om": "longitude_ascending_node",
            "w": "argument_perihelion",
            "ma": "mean_anomaly",
            "per": "orbital_period",
            "n": "mean_motion",
            "moid": "moid"
        }
        
        for element in elements:
            symbol = element.get("name")
            if symbol in element_mapping:
                try:
                    orbital_params[element_mapping[symbol]] = float(element.get("value", 0))
                except (ValueError, TypeError):
                    continue
        
        # Build comprehensive parameters for the frontend
        analysis_params = {
            "diameter": diameter,
            "mass": mass,
            "density": density,
            "absolute_magnitude": absolute_mag,
            "geometric_albedo": albedo,
            "rotation_period": rotation_period,
            "color_b_v": color_b_v,
            "color_u_b": color_u_b,
            **orbital_params
        }
        
        # Remove None values but keep track of what was available
        available_params = {k: v for k, v in analysis_params.items() if v is not None}
        all_possible_params = list(analysis_params.keys())
        
        logger.info(f"Extracted parameters from SBDB: diameter={diameter}m, available_params={len(available_params)}/{len(all_possible_params)}")
        
        return {
            "success": True,
            "message": "SBDB data processed successfully",
            "extracted_parameters": available_params,
            "all_possible_parameters": all_possible_params,
            "sbdb_object_name": obj_data.get("fullname", "Unknown"),
            "parameter_summary": {
                "physical_parameters_found": sum(1 for p in ["diameter", "mass", "density", "absolute_magnitude", "geometric_albedo", "rotation_period"] if p in available_params),
                "orbital_elements_found": sum(1 for p in ["eccentricity", "semi_major_axis", "inclination", "perihelion_distance"] if p in available_params),
                "total_parameters_available": len(available_params),
                "total_parameters_possible": len(all_possible_params)
            },
            "analysis_ready": "diameter" in available_params,
            "analysis_note": "Parameters are ready for impact analysis. Use /physics/impact-analysis endpoint for full analysis."
        }
        
    except Exception as e:
        logger.error(f"Error processing SBDB data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing SBDB data: {str(e)}"
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