# Physics Engine for Impact Analysis

## Overview

The physics engine provides comprehensive impact analysis capabilities for asteroid threats, including:
- **Energy calculations** (kinetic energy, TNT equivalent)
- **Impact type determination** (airburst vs surface impact)
- **Crater formation modeling**
- **Damage assessment** (thermal, overpressure, seismic)
- **Casualty estimation**
- **Deflection feasibility analysis**

## Key Components

### 1. AsteroidProperties Class
Defines asteroid physical characteristics:
```python
asteroid = AsteroidProperties(
    diameter=150,  # meters
    composition=AsteroidComposition.ROCKY,
    velocity=18000,  # m/s
    angle=35  # impact angle in degrees
)
```

### 2. PhysicsEngine Class
Main calculation engine with methods:
- `analyze_impact()` - Complete impact analysis
- `calculate_deflection_energy()` - Energy needed for deflection
- `assess_deflection_feasibility()` - Can we deflect this asteroid?

### 3. Impact Results
Comprehensive results including:
- Kinetic energy (Joules)
- TNT equivalent (megatons)
- Impact type (airburst/surface)
- Crater diameter
- Damage radii
- Casualty estimates

## Usage Examples

### Basic Impact Analysis
```python
from physics_engine import PhysicsEngine, AsteroidProperties, AsteroidComposition

engine = PhysicsEngine()

# Create asteroid
asteroid = AsteroidProperties(
    diameter=100,  # 100m diameter
    composition=AsteroidComposition.ROCKY,
    velocity=20000  # 20 km/s
)

# Analyze impact
results = engine.analyze_impact(asteroid)

print(f"TNT Equivalent: {results.tnt_equivalent:.1f} megatons")
print(f"Impact Type: {results.impact_type.value}")
print(f"Crater Diameter: {results.crater_diameter:.0f} meters")
```

### Deflection Analysis
```python
# Check if we can deflect an asteroid
feasibility = engine.assess_deflection_feasibility(
    asteroid=asteroid,
    deflection_distance=11000000,  # 11,000 km
    warning_time=10*365*24*3600,   # 10 years
    available_energy=1e15          # 1 PJ
)

print(f"Deflection feasible: {feasibility['feasible']}")
print(f"Success probability: {feasibility['success_probability']:.1%}")
```

## Test Results

The engine has been tested with various scenarios:

### Small Asteroid (Chelyabinsk-like)
- **Size**: 20m diameter
- **Result**: 0.47 MT airburst at 45km altitude
- **Thermal radius**: 5.8 km

### Large Metallic Asteroid
- **Size**: 100m diameter
- **Result**: 305 MT surface impact
- **Crater**: 17.4 km diameter
- **Seismic magnitude**: 6.3

### Composition Comparison (50m asteroids)
- **Rocky**: 8.1 MT (airburst)
- **Metallic**: 24.4 MT (surface impact)
- **Icy**: 3.1 MT (airburst)
- **Carbonaceous**: 4.3 MT (airburst)

## Key Physics Models

### Airburst Altitude
Calculated based on atmospheric pressure vs asteroid strength:
```
Dynamic pressure = 0.5 × ρ(h) × v²
Airburst occurs when dynamic pressure = material strength
```

### Crater Scaling
Uses empirical scaling laws:
```
D = K × (E / ρ_target × g)^(1/3.4)
```

### Casualty Estimation
Based on:
- Thermal radiation (3rd degree burns)
- Overpressure damage zones
- Population density assumptions

## Applications

1. **Threat Assessment**: Evaluate incoming asteroid dangers
2. **Mission Planning**: Determine deflection requirements
3. **Risk Analysis**: Estimate potential damage and casualties
4. **Public Safety**: Inform evacuation and preparation decisions
5. **Policy Making**: Support space defense program decisions

## Files

- `physics_engine.py` - Main physics engine implementation
- `test_physics_engine.py` - Comprehensive test suite
- `sample_impact_report.json` - Example analysis output

## Dependencies

- Python 3.8+
- NumPy (for mathematical calculations)
- Standard library (math, dataclasses, enum)

## Future Enhancements

- **Advanced atmospheric models**
- **3D trajectory modeling** 
- **Multiple fragment tracking**
- **Economic impact assessment**
- **Real-time mission simulation**
- **Integration with orbital mechanics**