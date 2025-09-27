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
    """Asteroid physical properties"""
    diameter: float  # meters
    mass: Optional[float] = None  # kg
    density: Optional[float] = None  # kg/m³
    composition: AsteroidComposition = AsteroidComposition.ROCKY
    velocity: float = 20000  # m/s (typical impact velocity)
    angle: float = 45  # degrees (impact angle)
    
    def __post_init__(self):
        """Calculate missing properties"""
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


@dataclass
class ImpactResults:
    """Results of impact analysis"""
    kinetic_energy: float  # Joules
    tnt_equivalent: float  # Megatons TNT
    crater_diameter: float  # meters
    impact_type: ImpactType
    airburst_altitude: Optional[float] = None  # meters
    seismic_magnitude: Optional[float] = None
    thermal_radius: float = 0  # meters
    from dataclasses import field

    overpressure_radius: Dict[str, float] = field(default_factory=dict)  # pressure level -> radius
    casualty_estimate: Dict[str, int] = field(default_factory=dict)  # severity -> count


class PhysicsEngine:
    """Main physics engine for impact calculations"""
    
    # Physical constants
    GRAVITATIONAL_ACCELERATION = 9.81  # m/s²
    EARTH_RADIUS = 6.371e6  # meters
    ATMOSPHERE_SCALE_HEIGHT = 8400  # meters
    TNT_ENERGY_DENSITY = 4.184e9  # J/kg (TNT equivalent)
    
    def __init__(self):
        """Initialize the physics engine"""
        pass
    
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
    
    def analyze_impact(self, asteroid: AsteroidProperties,
                      population_density: float = 100) -> ImpactResults:
        """
        Perform complete impact analysis
        
        Args:
            asteroid: Asteroid properties
            population_density: Population density (people/km²)
            
        Returns:
            Complete impact analysis results
        """
        # Calculate basic energy
        kinetic_energy = self.calculate_kinetic_energy(asteroid)
        tnt_equivalent = self.calculate_tnt_equivalent(kinetic_energy)
        
        # Determine impact type
        airburst_altitude = self.calculate_airburst_altitude(asteroid)
        if airburst_altitude is not None:
            impact_type = ImpactType.AIRBURST
        else:
            impact_type = ImpactType.SURFACE
        
        # Calculate crater
        crater_diameter = self.calculate_crater_diameter(asteroid, impact_type)
        
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
            airburst_altitude=airburst_altitude,
            seismic_magnitude=seismic_magnitude,
            thermal_radius=thermal_radius,
            overpressure_radius=overpressure_radii,
            casualty_estimate=casualties
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
    """Create example asteroids for testing"""
    return {
        "small_rocky": AsteroidProperties(
            diameter=50, 
            composition=AsteroidComposition.ROCKY,
            velocity=15000
        ),
        "apophis_like": AsteroidProperties(
            diameter=270,
            mass=2.7e10,  # kg
            velocity=12900,
            angle=45
        ),
        "chelyabinsk_like": AsteroidProperties(
            diameter=20,
            composition=AsteroidComposition.ROCKY,
            velocity=19000,
            angle=20
        ),
        "tunguska_like": AsteroidProperties(
            diameter=60,
            composition=AsteroidComposition.ICY,
            velocity=27000,
            angle=30
        ),
        "large_metallic": AsteroidProperties(
            diameter=500,
            composition=AsteroidComposition.METALLIC,
            velocity=25000,
            angle=60
        )
    }


if __name__ == "__main__":
    # Example usage
    engine = PhysicsEngine()
    asteroids = create_example_asteroids()
    
    print("🔬 Physics Engine Impact Analysis")
    print("=" * 50)
    
    for name, asteroid in asteroids.items():
        print(f"\n🪨 Analyzing: {name}")
        print(f"   Diameter: {asteroid.diameter} m")
        print(f"   Mass: {asteroid.mass:.2e} kg")
        print(f"   Velocity: {asteroid.velocity} m/s")
        
        results = engine.analyze_impact(asteroid)
        
        print(f"   Kinetic Energy: {results.kinetic_energy:.2e} J")
        print(f"   TNT Equivalent: {results.tnt_equivalent:.2f} megatons")
        print(f"   Impact Type: {results.impact_type.value}")
        
        if results.airburst_altitude:
            print(f"   Airburst Altitude: {results.airburst_altitude/1000:.1f} km")
        else:
            print(f"   Crater Diameter: {results.crater_diameter:.0f} m")
        
        print(f"   Seismic Magnitude: {results.seismic_magnitude:.1f}")
        print(f"   Thermal Radius: {results.thermal_radius/1000:.1f} km")
        
        if results.overpressure_radius:
            print(f"   Severe Damage Radius: {results.overpressure_radius.get('severe_damage', 0)/1000:.1f} km")
        
        print(f"   Estimated Fatalities: {results.casualty_estimate.get('fatalities', 0):,}")