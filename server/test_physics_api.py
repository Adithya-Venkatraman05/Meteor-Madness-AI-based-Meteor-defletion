#!/usr/bin/env python3
"""
Test script for the Physics Engine API
"""

import requests
import json
import time
import subprocess
import sys
import threading
from urllib.parse import urlencode

def start_server():
    """Start the FastAPI server in background"""
    try:
        # Kill any existing processes
        subprocess.run(["pkill", "-f", "python.*main.py"], capture_output=True)
        time.sleep(2)
        
        # Start server
        cmd = [sys.executable, "main.py"]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(5)  # Give server time to start
        return process
    except Exception as e:
        print(f"Error starting server: {e}")
        return None

def test_physics_api():
    """Test the physics engine API with various scenarios"""
    base_url = "http://localhost:8001"
    
    print('🧪 Testing Physics Engine API via HTTP')
    print('=' * 60)
    
    # Test 1: Basic Chelyabinsk-like asteroid
    print('\n🪨 Test 1: Chelyabinsk-like asteroid (20m, ROCKY)')
    params = {
        'diameter': 20,
        'composition': 'ROCKY',
        'velocity': 19000,
        'angle': 20
    }
    
    try:
        response = requests.get(f"{base_url}/physics/impact-analysis", params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f'✅ Success! TNT Equivalent: {data["energy_analysis"]["tnt_equivalent_megatons"]:.2f} MT')
            print(f'   Impact Type: {data["energy_analysis"]["impact_type"]}')
            print(f'   Number of damage zones: {len(data["impact_radii_gradient"])}')
            for i, zone in enumerate(data["impact_radii_gradient"]):
                print(f'   Zone {i+1}: {zone["description"]} - {zone["radius_km"]:.1f} km (Level {zone["severity_level"]})')
        else:
            print(f'❌ HTTP {response.status_code}: {response.text}')
    except Exception as e:
        print(f'❌ Error: {e}')
    
    # Test 2: Large metallic asteroid
    print('\n🪨 Test 2: Large metallic asteroid (500m, METALLIC)')
    params = {
        'diameter': 500,
        'composition': 'METALLIC',
        'velocity': 25000,
        'angle': 60
    }
    
    try:
        response = requests.get(f"{base_url}/physics/impact-analysis", params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f'✅ Success! TNT Equivalent: {data["energy_analysis"]["tnt_equivalent_megatons"]:.0f} MT')
            print(f'   Impact Type: {data["energy_analysis"]["impact_type"]}')
            print(f'   Max radius: {data["analysis_metadata"]["max_impact_radius_km"]:.1f} km')
            if data["energy_analysis"]["crater_diameter_m"]:
                print(f'   Crater diameter: {data["energy_analysis"]["crater_diameter_m"]:.0f} m')
        else:
            print(f'❌ HTTP {response.status_code}: {response.text}')
    except Exception as e:
        print(f'❌ Error: {e}')
    
    # Test 3: With deflection analysis
    print('\n🪨 Test 3: Apophis-like with deflection analysis (270m)')
    params = {
        'diameter': 270,
        'mass': 2.7e10,
        'velocity': 12900,
        'deflection_distance': 1.17e7,
        'warning_time': 3.15e7,
        'available_energy': 1e12
    }
    
    try:
        response = requests.get(f"{base_url}/physics/impact-analysis", params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f'✅ Success! TNT Equivalent: {data["energy_analysis"]["tnt_equivalent_megatons"]:.0f} MT')
            print(f'   Deflection feasible: {data["deflection_analysis"]["feasible"]}')
            print(f'   Success probability: {data["deflection_analysis"]["success_probability"]:.2f}')
            print(f'   Energy ratio: {data["deflection_analysis"]["energy_ratio"]:.1f}')
        else:
            print(f'❌ HTTP {response.status_code}: {response.text}')
    except Exception as e:
        print(f'❌ Error: {e}')
    
    # Test 4: ICY composition (Tunguska-like)
    print('\n🪨 Test 4: ICY composition asteroid (60m, ICY)')
    params = {
        'diameter': 60,
        'composition': 'ICY',
        'velocity': 27000,
        'angle': 30
    }
    
    try:
        response = requests.get(f"{base_url}/physics/impact-analysis", params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f'✅ Success! TNT Equivalent: {data["energy_analysis"]["tnt_equivalent_megatons"]:.1f} MT')
            print(f'   Impact Type: {data["energy_analysis"]["impact_type"]}')
            if data["energy_analysis"]["airburst_altitude_km"]:
                print(f'   Airburst altitude: {data["energy_analysis"]["airburst_altitude_km"]:.1f} km')
            print(f'   Radii gradient order (largest to smallest):')
            for i, zone in enumerate(data["impact_radii_gradient"]):
                print(f'     {i+1}. {zone["description"]}: {zone["radius_km"]:.1f} km')
        else:
            print(f'❌ HTTP {response.status_code}: {response.text}')
    except Exception as e:
        print(f'❌ Error: {e}')
    
    print('\n✅ Physics API testing completed!')

if __name__ == "__main__":
    # Change to server directory
    import os
    os.chdir('/workspaces/Meteor-Madness-AI-based-Meteor-defletion/server')
    
    # Start server
    print("Starting FastAPI server...")
    server_process = start_server()
    
    if server_process:
        try:
            # Run tests
            test_physics_api()
        finally:
            # Clean up
            print("\nShutting down server...")
            server_process.terminate()
            time.sleep(2)
            subprocess.run(["pkill", "-f", "python.*main.py"], capture_output=True)
    else:
        print("Failed to start server")