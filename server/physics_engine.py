"""
Physics Engine for Asteroid Impact Analysis
===========================================

This module provides physics calculations for asteroid impact analysis,
including energy calculations, crater formation, and damage assessment
for the Meteor Madness AI-based meteor deflection system.
"""

import math
import numpy as np
from typing import Dict, Tuple, Optional, Union
from dataclasses import dataclass
from enum import Enum


@dataclass
class OrbitalElements:
    """Orbital elements from NASA SBDB data"""
    eccentricity: float = 0.0  # orbital eccentricity
    semi_major_axis: float = 1.0  # AU
    perihelion_distance: float = 1.0  # AU
    aphelion_distance: float = 1.0  # AU
    inclination: float = 0.0  # degrees
    longitude_ascending_node: float = 0.0  # degrees
    argument_perihelion: float = 0.0  # degrees
    mean_anomaly: float = 0.0  # degrees
    orbital_period: float = 365.25  # days
    mean_motion: float = 1.0  # deg/day
    moid: float = 1.0  # AU - Minimum Orbit Intersection Distance
    absolute_magnitude: float = 20.0  # H magnitude
    

@dataclass
class ImpactCoordinates:
    """Impact location on Earth"""
    latitude: float = 0.0  # degrees (-90 to 90)
    longitude: float = 0.0  # degrees (-180 to 180)
    impact_region: str = "Ocean"  # Ocean, Land, Populated, Remote
    nearest_city: str = ""  # closest major city
    distance_to_city: float = 0.0  # km to nearest city
    local_time: str = ""  # local time of impact
    

class ImpactType(Enum):
    """Types of impact scenarios"""
    AIRBURST = "airburst"
    SURFACE = "surface"
    OCEAN = "ocean"


class AsteroidComposition(Enum):
    """Common asteroid compositions"""
    ROCKY = {"density": 2600, "strength": 1e6}  # kg/m³, Pa
    METALLIC = {"density": 7800, "strength": 5e8}
    ICY = {"density": 1000, "strength": 1e5}
    CARBONACEOUS = {"density": 1380, "strength": 5e5}


@dataclass
class AsteroidProperties:
    """Enhanced asteroid physical properties with NASA SBDB data"""
    diameter: float  # meters
    mass: Optional[float] = None  # kg
    density: Optional[float] = None  # kg/m³
    composition: AsteroidComposition = AsteroidComposition.ROCKY
    velocity: Optional[float] = None  # m/s (calculated from orbital mechanics)
    angle: Optional[float] = None  # degrees (calculated from orbital approach)
    
    # NASA SBDB Physical Parameters
    absolute_magnitude: Optional[float] = None  # H magnitude
    geometric_albedo: Optional[float] = None  # geometric albedo
    rotation_period: Optional[float] = None  # hours
    color_b_v: Optional[float] = None  # B-V color index
    color_u_b: Optional[float] = None  # U-B color index
    
    # Orbital Elements
    orbital_elements: Optional[OrbitalElements] = None
    
    # Calculated properties
    calculated_velocity: bool = False
    calculated_angle: bool = False
    
    def __post_init__(self):
        """Calculate missing properties and enhance with orbital data"""
        # Calculate mass and density
        if self.mass is None and self.density is not None:
            volume = (4/3) * math.pi * (self.diameter/2)**3
            self.mass = self.density * volume
        elif self.density is None and self.mass is not None:
            volume = (4/3) * math.pi * (self.diameter/2)**3
            self.density = self.mass / volume
        elif self.mass is None and self.density is None:
            # Use composition default density
            self.density = self.composition.value["density"]
            volume = (4/3) * math.pi * (self.diameter/2)**3
            self.mass = self.density * volume if self.density else 0
        
        # Set default velocity and angle ONLY if they are truly not provided
        # Do not override explicitly provided values (including 0)
        if self.velocity is None:
            self.velocity = 20000  # Default m/s (20 km/s)
        if self.angle is None:
            self.angle = 45  # Default degrees


@dataclass
class ImpactResults:
    """Enhanced results of impact analysis with coordinates"""
    kinetic_energy: float  # Joules
    tnt_equivalent: float  # Megatons TNT
    crater_diameter: float  # meters
    impact_type: ImpactType
    impact_coordinates: Optional[ImpactCoordinates] = None
    airburst_altitude: Optional[float] = None  # meters
    seismic_magnitude: Optional[float] = None
    thermal_radius: float = 0  # meters
    from dataclasses import field

    overpressure_radius: Dict[str, float] = field(default_factory=dict)  # pressure level -> radius
    casualty_estimate: Dict[str, int] = field(default_factory=dict)  # severity -> count
    
    # Enhanced analysis data
    approach_velocity: float = 0  # m/s - calculated from orbital mechanics
    impact_angle_calculated: float = 0  # degrees - from orbital approach
    orbital_classification: str = ""  # Apollo, Aten, Amor, etc.


class PhysicsEngine:
    """Enhanced physics engine for impact calculations with orbital mechanics"""
    
    # Physical constants
    GRAVITATIONAL_ACCELERATION = 9.81  # m/s²
    EARTH_RADIUS = 6.371e6  # meters
    ATMOSPHERE_SCALE_HEIGHT = 8400  # meters
    TNT_ENERGY_DENSITY = 4.184e9  # J/kg (TNT equivalent)
    
    # Orbital mechanics constants
    AU = 1.496e11  # meters (Astronomical Unit)
    GM_SUN = 1.327e20  # m³/s² (Solar gravitational parameter)
    EARTH_ORBITAL_VELOCITY = 29780  # m/s (Earth's average orbital velocity)
    SIDEREAL_YEAR = 365.25636  # days
    
    def __init__(self):
        """Initialize the enhanced physics engine"""
        pass
    
    def calculate_orbital_velocity(self, orbital_elements: OrbitalElements, 
                                 distance_au: float) -> float:
        """Calculate orbital velocity at given distance using vis-viva equation"""
        a = orbital_elements.semi_major_axis * self.AU  # Convert to meters
        r = distance_au * self.AU  # Convert to meters
        
        # vis-viva equation: v² = GM(2/r - 1/a)
        velocity_squared = self.GM_SUN * (2/r - 1/a)
        return math.sqrt(max(0, velocity_squared))
    
    def calculate_approach_velocity(self, orbital_elements: OrbitalElements) -> float:
        """Calculate realistic Earth approach velocity from orbital elements"""
        # Use perihelion velocity as approximation for Earth encounter
        perihelion_velocity = self.calculate_orbital_velocity(
            orbital_elements, orbital_elements.perihelion_distance
        )
        
        # Relative velocity with respect to Earth
        # Simplified model: vector addition with Earth's orbital velocity
        earth_velocity = self.EARTH_ORBITAL_VELOCITY
        
        # Account for orbital inclination
        inclination_rad = math.radians(orbital_elements.inclination)
        relative_velocity = math.sqrt(
            perihelion_velocity**2 + earth_velocity**2 - 
            2 * perihelion_velocity * earth_velocity * math.cos(inclination_rad)
        )
        
        return relative_velocity
    
    def calculate_impact_angle(self, orbital_elements: OrbitalElements) -> float:
        """Calculate realistic impact angle from orbital geometry"""
        # Impact angle depends on orbital inclination and approach geometry
        inclination = orbital_elements.inclination
        
        # Simplified model: impact angle correlates with inclination
        # Low inclination (< 30°) -> shallow angles (15-45°)
        # High inclination (> 60°) -> steep angles (60-90°)
        
        if inclination < 30:
            base_angle = 20 + (inclination / 30) * 25  # 20-45°
        elif inclination < 60:
            base_angle = 45 + ((inclination - 30) / 30) * 25  # 45-70°
        else:
            base_angle = 70 + ((inclination - 60) / 30) * 20  # 70-90°
        
        # Add some randomness based on argument of perihelion
        peri_variation = math.sin(math.radians(orbital_elements.argument_perihelion)) * 10
        
        return max(5, min(90, base_angle + peri_variation))
    
    def classify_orbital_type(self, orbital_elements: OrbitalElements) -> str:
        """Classify asteroid by orbital characteristics"""
        a = orbital_elements.semi_major_axis
        q = orbital_elements.perihelion_distance
        
        if a > 1.0 and q < 1.017:  # Earth's aphelion distance
            return "Apollo"  # Earth-crossing, a > 1 AU
        elif a < 1.0 and orbital_elements.aphelion_distance > 0.983:  # Earth's perihelion
            return "Aten"   # Earth-crossing, a < 1 AU
        elif 1.017 < q < 1.3:
            return "Amor"   # Earth-approaching
        elif a > 5.2:  # Jupiter's orbit
            return "Jupiter Trojan"
        elif 2.0 < a < 3.2:
            return "Main Belt"
        else:
            return "Other"
    
    def determine_composition_from_data(self, asteroid: AsteroidProperties) -> AsteroidComposition:
        """Enhanced composition determination using NASA SBDB data"""
        if not asteroid.geometric_albedo and not asteroid.color_b_v:
            return asteroid.composition  # Use default if no data
        
        albedo = asteroid.geometric_albedo or 0.15  # Default moderate albedo
        b_v = asteroid.color_b_v or 0.7  # Default moderate color
        
        # Classification based on albedo and color indices
        if albedo > 0.4:  # High albedo
            if b_v < 0.6:  # Blue color
                return AsteroidComposition.METALLIC  # M-type
            else:
                return AsteroidComposition.ROCKY  # S-type
        else:  # Low albedo
            if b_v > 0.8:  # Red color
                return AsteroidComposition.CARBONACEOUS  # C-type
            elif asteroid.color_u_b and asteroid.color_u_b < 0.3:
                return AsteroidComposition.ICY  # Possible comet-like
            else:
                return AsteroidComposition.CARBONACEOUS  # Default dark object
    
    def calculate_impact_coordinates(self, orbital_elements: OrbitalElements) -> ImpactCoordinates:
        """Calculate impact coordinates based on orbital geometry"""
        # Simplified model based on orbital parameters
        # In reality, this would require precise trajectory integration
        
        # Use longitude of ascending node as base longitude
        longitude = (orbital_elements.longitude_ascending_node - 180) % 360 - 180
        
        # Use inclination to influence latitude
        # Higher inclination -> higher chance of polar impact
        max_lat = min(90, orbital_elements.inclination * 1.5)
        latitude = (orbital_elements.mean_anomaly / 180 - 1) * max_lat
        
        # Determine impact region
        abs_lat = abs(latitude)
        if abs_lat > 66.5:  # Polar regions
            region = "Remote"
            nearest_city = "Research Station"
            distance = 500 + abs_lat * 10
        elif abs(longitude) > 120:  # Pacific Ocean region
            region = "Ocean"
            nearest_city = "Coastal City"
            distance = 200 + abs(longitude - 120) * 5
        elif abs_lat < 30 and abs(longitude) < 60:  # Populated regions
            region = "Populated"
            nearest_city = "Major City"
            distance = 50 + abs_lat * 10
        else:
            region = "Land"
            nearest_city = "Rural Town"
            distance = 100 + abs_lat * 5
        
        # Calculate local time (simplified)
        hour = (orbital_elements.mean_anomaly / 15) % 24
        local_time = f"{int(hour):02d}:{int((hour % 1) * 60):02d}"
        
        return ImpactCoordinates(
            latitude=latitude,
            longitude=longitude,
            impact_region=region,
            nearest_city=nearest_city,
            distance_to_city=distance,
            local_time=local_time
        )
    
    def calculate_kinetic_energy(self, asteroid: AsteroidProperties) -> float:
        """
        Calculate the kinetic energy of an impacting asteroid
        
        Args:
            asteroid: Asteroid properties
            
        Returns:
            Kinetic energy in Joules
        """
        return 0.5 * asteroid.mass * asteroid.velocity**2 if asteroid.mass else 0
    
    def calculate_tnt_equivalent(self, kinetic_energy: float) -> float:
        """
        Convert kinetic energy to TNT equivalent in megatons
        
        Args:
            kinetic_energy: Energy in Joules
            
        Returns:
            TNT equivalent in megatons
        """
        # 1 megaton TNT = 4.184 × 10^15 Joules
        megaton_tnt = 4.184e15
        return kinetic_energy / megaton_tnt
    
    def calculate_airburst_altitude(self, asteroid: AsteroidProperties) -> Optional[float]:
        """
        Calculate the altitude at which an asteroid will airburst
        
        Args:
            asteroid: Asteroid properties
            
        Returns:
            Airburst altitude in meters, or None if surface impact
        """
        # Simplified model based on asteroid strength and atmospheric pressure
        strength = asteroid.composition.value["strength"]
        
        # Dynamic pressure at airburst = asteroid strength
        # ρ_air * v² = strength
        # Using exponential atmosphere model
        
        # Surface air density
        rho_0 = 1.225  # kg/m³
        
        # Calculate altitude where dynamic pressure equals strength
        # ρ(h) = ρ_0 * exp(-h/H)
        # Dynamic pressure = 0.5 * ρ(h) * v²
        
        dynamic_pressure_surface = 0.5 * rho_0 * asteroid.velocity**2
        
        if strength >= dynamic_pressure_surface:
            # Will reach the ground
            return None
        
        # Calculate airburst altitude
        scale_height = self.ATMOSPHERE_SCALE_HEIGHT
        altitude = -scale_height * math.log(2 * strength / (rho_0 * asteroid.velocity**2))
        
        return max(0, altitude)
    
    def enhance_asteroid_properties(self, asteroid: AsteroidProperties) -> AsteroidProperties:
        """Enhance asteroid properties using orbital mechanics and composition analysis"""
        if asteroid.orbital_elements:
            # Calculate realistic velocity and angle from orbital mechanics
            if not asteroid.calculated_velocity:
                asteroid.velocity = self.calculate_approach_velocity(asteroid.orbital_elements)
                asteroid.calculated_velocity = True
                
            if not asteroid.calculated_angle:
                asteroid.angle = self.calculate_impact_angle(asteroid.orbital_elements)
                asteroid.calculated_angle = True
        
        # Enhance composition determination
        if asteroid.geometric_albedo or asteroid.color_b_v:
            enhanced_composition = self.determine_composition_from_data(asteroid)
            if enhanced_composition != asteroid.composition:
                asteroid.composition = enhanced_composition
                # Recalculate density based on new composition
                asteroid.density = asteroid.composition.value["density"]
                if asteroid.mass:
                    volume = (4/3) * math.pi * (asteroid.diameter/2)**3
                    asteroid.mass = asteroid.density * volume
        
        return asteroid
    
    def calculate_crater_diameter(self, asteroid: AsteroidProperties, 
                                 impact_type: ImpactType) -> float:
        """
        Calculate impact crater diameter
        
        Args:
            asteroid: Asteroid properties
            impact_type: Type of impact
            
        Returns:
            Crater diameter in meters
        """
        if impact_type == ImpactType.AIRBURST:
            return 0  # No crater for airburst
        
        # Simplified crater scaling law
        # D = K * (E / ρ_target * g)^(1/3.4)
        # where K is a scaling constant
        
        kinetic_energy = self.calculate_kinetic_energy(asteroid)
        target_density = 2600  # kg/m³ (typical rock)
        
        # Scaling constant (empirical)
        if impact_type == ImpactType.OCEAN:
            K = 3.2  # Water impact
            target_density = 1000
        else:
            K = 1.8  # Land impact
        
        # Convert angle to effective energy
        angle_rad = math.radians(asteroid.angle)
        effective_energy = kinetic_energy * math.sin(angle_rad)
        
        crater_diameter = K * (effective_energy / 
                              (target_density * self.GRAVITATIONAL_ACCELERATION))**(1/3.4)
        
        return crater_diameter
    
    def calculate_seismic_magnitude(self, kinetic_energy: float) -> float:
        """
        Calculate seismic magnitude from impact energy
        
        Args:
            kinetic_energy: Impact energy in Joules
            
        Returns:
            Seismic magnitude (Richter scale)
        """
        # Empirical relationship: M = 0.67 * log10(E) - 5.87
        # where E is in Joules
        if kinetic_energy <= 0:
            return 0
        
        magnitude = 0.67 * math.log10(kinetic_energy) - 5.87
        return max(0, magnitude)
    
    def calculate_thermal_effects(self, tnt_equivalent: float) -> float:
        """
        Calculate thermal radiation radius for 3rd degree burns
        
        Args:
            tnt_equivalent: TNT equivalent in megatons
            
        Returns:
            Radius in meters where 3rd degree burns occur
        """
        if tnt_equivalent <= 0:
            return 0
        
        # Empirical formula for thermal effects
        # R = K * Y^0.4 where Y is yield in megatons
        K = 7800  # meters per megaton^0.4
        
        return K * (tnt_equivalent**0.4)
    
    def calculate_overpressure_effects(self, tnt_equivalent: float) -> Dict[str, float]:
        """
        Calculate overpressure radii for different damage levels
        
        Args:
            tnt_equivalent: TNT equivalent in megatons
            
        Returns:
            Dictionary mapping damage level to radius in meters
        """
        if tnt_equivalent <= 0:
            return {}
        
        # Overpressure damage levels (psi)
        damage_levels = {
            "total_destruction": 20,  # psi
            "severe_damage": 5,
            "moderate_damage": 2,
            "light_damage": 1
        }
        
        results = {}
        
        for level, pressure_psi in damage_levels.items():
            # Convert psi to Pa
            pressure_pa = pressure_psi * 6895
            
            # Empirical formula: R = K * (Y/P)^(1/3)
            # where Y is yield in kg TNT, P is overpressure in Pa
            yield_kg_tnt = tnt_equivalent * 1e9  # Convert megatons to kg
            K = 45  # Empirical constant
            
            radius = K * ((yield_kg_tnt / pressure_pa)**(1/3))
            results[level] = radius
        
        return results
    
    def estimate_casualties(self, thermal_radius: float, 
                          overpressure_radii: Dict[str, float],
                          population_density: float = 100) -> Dict[str, int]:
        """
        Estimate casualties based on impact effects
        
        Args:
            thermal_radius: Thermal effects radius
            overpressure_radii: Overpressure damage radii
            population_density: People per km²
            
        Returns:
            Dictionary of casualty estimates by severity
        """
        casualties = {
            "fatalities": 0,
            "severe_injuries": 0,
            "moderate_injuries": 0,
            "light_injuries": 0
        }
        
        # Calculate areas and populations
        if "total_destruction" in overpressure_radii:
            area_km2 = math.pi * (overpressure_radii["total_destruction"] / 1000)**2
            casualties["fatalities"] = int(area_km2 * population_density * 0.9)
        
        if "severe_damage" in overpressure_radii:
            area_km2 = math.pi * (overpressure_radii["severe_damage"] / 1000)**2
            casualties["severe_injuries"] = int(area_km2 * population_density * 0.6)
        
        if "moderate_damage" in overpressure_radii:
            area_km2 = math.pi * (overpressure_radii["moderate_damage"] / 1000)**2
            casualties["moderate_injuries"] = int(area_km2 * population_density * 0.3)
        
        # Thermal casualties
        thermal_area_km2 = math.pi * (thermal_radius / 1000)**2
        thermal_casualties = int(thermal_area_km2 * population_density * 0.4)
        casualties["severe_injuries"] += thermal_casualties
        
        return casualties
    
    def enhance_impact_coordinates(self, coordinates: ImpactCoordinates) -> ImpactCoordinates:
        """
        Enhance provided coordinates with region type, nearest city, and local time
        
        Args:
            coordinates: Basic coordinates with lat/lng
            
        Returns:
            Enhanced coordinates with additional information
        """
        # Determine impact region type based on coordinates
        lat, lng = coordinates.latitude, coordinates.longitude
        
        # Simple ocean/land determination (rough approximation)
        # Major ocean regions
        if (-60 <= lat <= 60 and -180 <= lng <= -30) or \
           (-60 <= lat <= 60 and 30 <= lng <= 180) or \
           (lat < -60) or (lat > 60 and abs(lng) > 30):
            coordinates.impact_region = "Ocean"
        else:
            coordinates.impact_region = "Land"
        
        # Determine nearest major city (simplified)
        major_cities = [
            ("New York", 40.7128, -74.0060),
            ("London", 51.5074, -0.1278),
            ("Tokyo", 35.6762, 139.6503),
            ("Sydney", -33.8688, 151.2093),
            ("Cairo", 30.0444, 31.2357),
            ("Rio de Janeiro", -22.9068, -43.1729),
            ("Mumbai", 19.0760, 72.8777),
            ("Los Angeles", 34.0522, -118.2437),
            ("Beijing", 39.9042, 116.4074),
            ("Moscow", 55.7558, 37.6176)
        ]
        
        closest_city = ""
        min_distance = float('inf')
        
        for city_name, city_lat, city_lng in major_cities:
            # Calculate approximate distance using Haversine formula
            dlat = math.radians(lat - city_lat)
            dlng = math.radians(lng - city_lng)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(city_lat)) * \
                math.cos(math.radians(lat)) * math.sin(dlng/2)**2
            c = 2 * math.asin(math.sqrt(a))
            distance = 6371 * c  # Earth radius in km
            
            if distance < min_distance:
                min_distance = distance
                closest_city = city_name
        
        coordinates.nearest_city = closest_city
        coordinates.distance_to_city = min_distance
        
        # Simple time zone approximation (very rough)
        utc_offset = int(lng / 15)  # Rough estimate
        coordinates.local_time = f"UTC{utc_offset:+d}:00"
        
        return coordinates
    
    def analyze_impact(self, asteroid: AsteroidProperties,
                      population_density: float = 100,
                      provided_coordinates: Optional[ImpactCoordinates] = None) -> ImpactResults:
        """
        Perform enhanced complete impact analysis with orbital mechanics
        
        Args:
            asteroid: Enhanced asteroid properties with orbital data
            population_density: Population density (people/km²)
            
        Returns:
            Complete impact analysis results with coordinates
        """
        # Enhance asteroid properties using orbital mechanics
        enhanced_asteroid = self.enhance_asteroid_properties(asteroid)
        
        # Calculate basic energy
        kinetic_energy = self.calculate_kinetic_energy(enhanced_asteroid)
        tnt_equivalent = self.calculate_tnt_equivalent(kinetic_energy)
        
        # Determine impact type
        airburst_altitude = self.calculate_airburst_altitude(enhanced_asteroid)
        if airburst_altitude is not None:
            impact_type = ImpactType.AIRBURST
        else:
            impact_type = ImpactType.SURFACE
        
        # Use provided coordinates or calculate from orbital elements
        impact_coords = provided_coordinates
        orbital_classification = ""
        
        if provided_coordinates:
            # Enhance provided coordinates with additional information
            impact_coords = self.enhance_impact_coordinates(provided_coordinates)
        elif enhanced_asteroid.orbital_elements:
            # Calculate coordinates from orbital mechanics
            impact_coords = self.calculate_impact_coordinates(enhanced_asteroid.orbital_elements)
            orbital_classification = self.classify_orbital_type(enhanced_asteroid.orbital_elements)
        
        if enhanced_asteroid.orbital_elements and not orbital_classification:
            orbital_classification = self.classify_orbital_type(enhanced_asteroid.orbital_elements)
        
        # Calculate crater
        crater_diameter = self.calculate_crater_diameter(enhanced_asteroid, impact_type)
        
        # Calculate effects
        seismic_magnitude = self.calculate_seismic_magnitude(kinetic_energy)
        thermal_radius = self.calculate_thermal_effects(tnt_equivalent)
        overpressure_radii = self.calculate_overpressure_effects(tnt_equivalent)
        casualties = self.estimate_casualties(thermal_radius, overpressure_radii, 
                                            population_density)
        
        return ImpactResults(
            kinetic_energy=kinetic_energy,
            tnt_equivalent=tnt_equivalent,
            crater_diameter=crater_diameter,
            impact_type=impact_type,
            impact_coordinates=impact_coords,
            airburst_altitude=airburst_altitude,
            seismic_magnitude=seismic_magnitude,
            thermal_radius=thermal_radius,
            overpressure_radius=overpressure_radii,
            casualty_estimate=casualties,
            approach_velocity=enhanced_asteroid.velocity or 0,
            impact_angle_calculated=enhanced_asteroid.angle or 0,
            orbital_classification=orbital_classification
        )
    
    def calculate_deflection_energy(self, asteroid: AsteroidProperties,
                                  deflection_distance: float,
                                  warning_time: float) -> float:
        """
        Calculate energy required to deflect an asteroid
        
        Args:
            asteroid: Asteroid properties
            deflection_distance: Required deflection distance (meters)
            warning_time: Time available for deflection (seconds)
            
        Returns:
            Required deflection energy in Joules
        """
        # Calculate required velocity change (delta-v)
        # Assuming small deflection over long time
        delta_v = deflection_distance / warning_time
        
        # Energy required = 0.5 * m * (delta_v)²
        deflection_energy = 0.5 * asteroid.mass * delta_v**2 if asteroid.mass else 0
        
        return deflection_energy
    
    def assess_deflection_feasibility(self, asteroid: AsteroidProperties,
                                    deflection_distance: float,
                                    warning_time: float,
                                    available_energy: float) -> Dict[str, Union[bool, float]]:
        """
        Assess feasibility of asteroid deflection
        
        Args:
            asteroid: Asteroid properties
            deflection_distance: Required deflection distance (meters)
            warning_time: Time available for deflection (seconds)
            available_energy: Available deflection energy (Joules)
            
        Returns:
            Feasibility assessment
        """
        required_energy = self.calculate_deflection_energy(
            asteroid, deflection_distance, warning_time
        )
        
        feasible = available_energy >= required_energy
        energy_ratio = available_energy / required_energy if required_energy > 0 else float('inf')
        
        return {
            "feasible": feasible,
            "required_energy": required_energy,
            "available_energy": available_energy,
            "energy_ratio": energy_ratio,
            "success_probability": min(1.0, energy_ratio * 0.8) if feasible else 0.0
        }


def create_example_asteroids() -> Dict[str, AsteroidProperties]:
    """Create example asteroids with real NASA SBDB data for testing"""
    return {
        "nasa_example": AsteroidProperties(
            diameter=1000,  # 1.0 km from your data
            absolute_magnitude=16.53,
            geometric_albedo=0.51,
            rotation_period=2.2726,  # hours
            color_b_v=0.774,
            color_u_b=0.520,
            orbital_elements=OrbitalElements(
                eccentricity=0.827,
                semi_major_axis=1.08,  # AU
                perihelion_distance=0.186,  # AU
                aphelion_distance=1.97,  # AU
                inclination=22.8,  # degrees
                longitude_ascending_node=88.0,  # degrees
                argument_perihelion=31.4,  # degrees
                mean_anomaly=153.0,  # degrees
                orbital_period=409.0,  # days
                mean_motion=0.881,  # deg/day
                moid=0.0335,  # AU
                absolute_magnitude=16.53
            )
        ),
        "apophis_real": AsteroidProperties(
            diameter=270,
            mass=2.7e10,  # kg
            absolute_magnitude=19.7,
            geometric_albedo=0.31,
            orbital_elements=OrbitalElements(
                eccentricity=0.191,
                semi_major_axis=0.922,
                perihelion_distance=0.746,
                aphelion_distance=1.099,
                inclination=3.34,
                moid=0.0002  # Very close approach!
            )
        ),
        "chelyabinsk_like": AsteroidProperties(
            diameter=20,
            composition=AsteroidComposition.ROCKY,
            geometric_albedo=0.25,
            orbital_elements=OrbitalElements(
                eccentricity=0.69,
                semi_major_axis=1.24,
                inclination=20.0,
                moid=0.05
            )
        ),
        "high_albedo_metallic": AsteroidProperties(
            diameter=100,
            geometric_albedo=0.65,  # High albedo indicates metallic
            color_b_v=0.45,  # Blue color
            orbital_elements=OrbitalElements(
                eccentricity=0.15,
                semi_major_axis=2.1,
                inclination=8.5,
                moid=0.8
            )
        ),
        "dark_carbonaceous": AsteroidProperties(
            diameter=800,
            geometric_albedo=0.04,  # Very dark
            color_b_v=0.85,  # Red color
            orbital_elements=OrbitalElements(
                eccentricity=0.12,
                semi_major_axis=2.8,
                inclination=12.0,
                moid=1.2
            )
        )
    }


if __name__ == "__main__":
    # Enhanced example usage with orbital mechanics
    engine = PhysicsEngine()
    asteroids = create_example_asteroids()
    
    print("🔬 Enhanced Physics Engine Impact Analysis")
    print("=" * 60)
    
    for name, asteroid in asteroids.items():
        print(f"\n🪨 Analyzing: {name}")
        print(f"   Diameter: {asteroid.diameter} m")
        
        # Show orbital data if available
        if asteroid.orbital_elements:
            print(f"   Orbital Type: {engine.classify_orbital_type(asteroid.orbital_elements)}")
            print(f"   MOID: {asteroid.orbital_elements.moid:.4f} AU")
            print(f"   Eccentricity: {asteroid.orbital_elements.eccentricity:.3f}")
            print(f"   Inclination: {asteroid.orbital_elements.inclination:.1f}°")
        
        if asteroid.geometric_albedo:
            print(f"   Albedo: {asteroid.geometric_albedo:.2f}")
        
        results = engine.analyze_impact(asteroid)
        
        print(f"   \n📊 Impact Results:")
        print(f"   Approach Velocity: {results.approach_velocity:.0f} m/s")
        print(f"   Impact Angle: {results.impact_angle_calculated:.1f}°")
        print(f"   Kinetic Energy: {results.kinetic_energy:.2e} J")
        print(f"   TNT Equivalent: {results.tnt_equivalent:.2f} megatons")
        print(f"   Impact Type: {results.impact_type.value}")
        
        if results.impact_coordinates:
            coords = results.impact_coordinates
            print(f"   \n🌍 Impact Location:")
            print(f"   Coordinates: {coords.latitude:.2f}°, {coords.longitude:.2f}°")
            print(f"   Region: {coords.impact_region}")
            print(f"   Nearest City: {coords.nearest_city} ({coords.distance_to_city:.0f} km)")
            print(f"   Local Time: {coords.local_time}")
        
        if results.airburst_altitude:
            print(f"   Airburst Altitude: {results.airburst_altitude/1000:.1f} km")
        else:
            print(f"   Crater Diameter: {results.crater_diameter:.0f} m")
        
        print(f"   Seismic Magnitude: {results.seismic_magnitude:.1f}")
        print(f"   Thermal Radius: {results.thermal_radius/1000:.1f} km")
        
        if results.overpressure_radius:
            print(f"   Severe Damage Radius: {results.overpressure_radius.get('severe_damage', 0)/1000:.1f} km")
        
        print(f"   Estimated Fatalities: {results.casualty_estimate.get('fatalities', 0):,}")
        
        if results.orbital_classification:
            print(f"   Orbital Classification: {results.orbital_classification}")