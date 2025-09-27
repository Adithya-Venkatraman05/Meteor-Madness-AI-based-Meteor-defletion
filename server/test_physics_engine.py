#!/usr/bin/env python3
"""
Test file for the physics engine impact analysis
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from physics_engine import (
    PhysicsEngine, AsteroidProperties, AsteroidComposition, 
    ImpactType, create_example_asteroids
)
import json

def test_physics_engine():
    """Test the physics engine with various scenarios"""
    
    print("🧪 Testing Physics Engine for Impact Analysis")
    print("=" * 60)
    
    engine = PhysicsEngine()
    
    # Test 1: Small rocky asteroid (like Chelyabinsk)
    print("\n🔬 Test 1: Small Rocky Asteroid (Chelyabinsk-like)")
    print("-" * 40)
    
    chelyabinsk = AsteroidProperties(
        diameter=20,  # meters
        composition=AsteroidComposition.ROCKY,
        velocity=19000,  # m/s
        angle=20  # degrees
    )
    
    print(f"Input: {chelyabinsk.diameter}m diameter, {chelyabinsk.velocity} m/s")
    
    results = engine.analyze_impact(chelyabinsk)
    
    print(f"✅ Kinetic Energy: {results.kinetic_energy:.2e} J")
    print(f"✅ TNT Equivalent: {results.tnt_equivalent:.3f} megatons")
    print(f"✅ Impact Type: {results.impact_type.value}")
    print(f"✅ Airburst Altitude: {results.airburst_altitude/1000 if results.airburst_altitude else 0:.1f} km")
    print(f"✅ Thermal Radius: {results.thermal_radius/1000:.1f} km")
    
    # Test 2: Large surface impact
    print("\n🔬 Test 2: Large Surface Impact")
    print("-" * 40)
    
    large_asteroid = AsteroidProperties(
        diameter=100,  # meters
        composition=AsteroidComposition.METALLIC,
        velocity=25000,  # m/s
        angle=45  # degrees
    )
    
    print(f"Input: {large_asteroid.diameter}m diameter, metallic, {large_asteroid.velocity} m/s")
    
    results2 = engine.analyze_impact(large_asteroid)
    
    print(f"✅ Kinetic Energy: {results2.kinetic_energy:.2e} J")
    print(f"✅ TNT Equivalent: {results2.tnt_equivalent:.1f} megatons")
    print(f"✅ Impact Type: {results2.impact_type.value}")
    print(f"✅ Crater Diameter: {results2.crater_diameter:.0f} m")
    print(f"✅ Seismic Magnitude: {results2.seismic_magnitude:.1f}")
    print(f"✅ Estimated Fatalities: {results2.casualty_estimate.get('fatalities', 0):,}")
    
    # Test 3: Deflection analysis
    print("\n🔬 Test 3: Deflection Feasibility Analysis")
    print("-" * 40)
    
    apophis_like = AsteroidProperties(
        diameter=270,  # meters
        mass=2.7e10,  # kg (actual Apophis mass)
        velocity=12900,  # m/s
        angle=45
    )
    
    print(f"Input: Apophis-like asteroid, {apophis_like.diameter}m diameter")
    
    # Deflection parameters
    deflection_distance = 11000000  # 11,000 km (Earth's radius + safety margin)
    warning_time = 10 * 365 * 24 * 3600  # 10 years in seconds
    available_energy = 1e15  # 1 PJ (hypothetical deflection system)
    
    feasibility = engine.assess_deflection_feasibility(
        apophis_like, deflection_distance, warning_time, available_energy
    )
    
    print(f"Required deflection: {deflection_distance/1000000:.0f} million km")
    print(f"Warning time: {warning_time/(365*24*3600):.0f} years")
    print(f"✅ Required Energy: {feasibility['required_energy']:.2e} J")
    print(f"✅ Available Energy: {feasibility['available_energy']:.2e} J")
    print(f"✅ Feasible: {feasibility['feasible']}")
    print(f"✅ Success Probability: {feasibility['success_probability']:.1%}")
    
    # Test 4: Compare different asteroid compositions
    print("\n🔬 Test 4: Composition Comparison")
    print("-" * 40)
    
    compositions = [
        AsteroidComposition.ROCKY,
        AsteroidComposition.METALLIC,
        AsteroidComposition.ICY,
        AsteroidComposition.CARBONACEOUS
    ]
    
    diameter = 50  # meters
    velocity = 20000  # m/s
    
    print(f"Comparing {diameter}m asteroids at {velocity} m/s:")
    
    for comp in compositions:
        test_asteroid = AsteroidProperties(
            diameter=diameter,
            composition=comp,
            velocity=velocity
        )
        
        test_results = engine.analyze_impact(test_asteroid)
        
        comp_name = comp.name.lower().replace('_', ' ').title()
        print(f"  {comp_name:12} | Mass: {test_asteroid.mass:.1e} kg | "
              f"Energy: {test_results.tnt_equivalent:.3f} MT | "
              f"Type: {test_results.impact_type.value}")

def test_extreme_cases():
    """Test extreme cases and edge conditions"""
    
    print("\n🧪 Testing Extreme Cases")
    print("=" * 40)
    
    engine = PhysicsEngine()
    
    # Very small asteroid
    tiny = AsteroidProperties(diameter=1, velocity=15000)
    tiny_results = engine.analyze_impact(tiny)
    print(f"🔸 1m asteroid: {tiny_results.tnt_equivalent:.6f} MT, {tiny_results.impact_type.value}")
    
    # Very large asteroid (dinosaur killer size)
    huge = AsteroidProperties(diameter=10000, velocity=20000)  # 10 km
    huge_results = engine.analyze_impact(huge)
    print(f"🔸 10km asteroid: {huge_results.tnt_equivalent:.0f} MT, crater: {huge_results.crater_diameter/1000:.0f} km")
    
    # Very slow asteroid
    slow = AsteroidProperties(diameter=100, velocity=1000)  # 1 km/s
    slow_results = engine.analyze_impact(slow)
    print(f"🔸 Slow (1km/s): {slow_results.tnt_equivalent:.3f} MT")
    
    # Very fast asteroid
    fast = AsteroidProperties(diameter=100, velocity=70000)  # 70 km/s
    fast_results = engine.analyze_impact(fast)
    print(f"🔸 Fast (70km/s): {fast_results.tnt_equivalent:.1f} MT")

def generate_impact_report(asteroid: AsteroidProperties, filename: str = ''):
    """Generate a detailed impact report"""
    
    engine = PhysicsEngine()
    results = engine.analyze_impact(asteroid)
    
    report = {
        "asteroid_properties": {
            "diameter_m": asteroid.diameter,
            "mass_kg": asteroid.mass,
            "density_kg_m3": asteroid.density,
            "composition": asteroid.composition.name,
            "velocity_m_s": asteroid.velocity,
            "impact_angle_deg": asteroid.angle
        },
        "impact_analysis": {
            "kinetic_energy_J": results.kinetic_energy,
            "tnt_equivalent_MT": results.tnt_equivalent,
            "impact_type": results.impact_type.value,
            "airburst_altitude_m": results.airburst_altitude,
            "crater_diameter_m": results.crater_diameter,
            "seismic_magnitude": results.seismic_magnitude,
            "thermal_radius_m": results.thermal_radius,
            "overpressure_radii_m": results.overpressure_radius,
            "casualty_estimates": results.casualty_estimate
        },
        "risk_assessment": {
            "severity": "HIGH" if results.tnt_equivalent > 1 else "MEDIUM" if results.tnt_equivalent > 0.01 else "LOW",
            "population_at_risk": sum(results.casualty_estimate.values()),
            "economic_damage_estimate": "TBD"  # Could be calculated based on crater size and location
        }
    }
    
    if filename:
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"📄 Report saved to {filename}")
    
    return report

if __name__ == "__main__":
    try:
        # Run main tests
        test_physics_engine()
        
        # Run extreme case tests
        test_extreme_cases()
        
        # Generate a sample report
        print("\n📋 Generating Sample Impact Report")
        print("=" * 40)
        
        sample_asteroid = AsteroidProperties(
            diameter=150,
            composition=AsteroidComposition.ROCKY,
            velocity=18000,
            angle=35
        )
        
        report = generate_impact_report(sample_asteroid, "sample_impact_report.json")
        print("✅ Sample report generated!")
        
        print(f"\n🎉 All physics engine tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()