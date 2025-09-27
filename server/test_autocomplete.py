#!/usr/bin/env python3
"""
Test script for asteroid autocomplete API endpoints
"""

import requests
import json
import time

def test_autocomplete_endpoints():
    base_url = "http://localhost:8001"
    
    # Test cases
    test_queries = [
        {"query": "Ceres", "endpoint": "simple"},
        {"query": "Apo", "endpoint": "simple"},
        {"query": "Ben", "endpoint": "simple"},
        {"query": "Eros", "endpoint": "both"}
    ]
    
    print("🧪 Testing Asteroid Autocomplete Endpoints")
    print("=" * 50)
    
    for test in test_queries:
        query = test["query"]
        print(f"\n🔍 Testing query: '{query}'")
        
        # Test simple endpoint
        if test["endpoint"] in ["simple", "both"]:
            try:
                url = f"{base_url}/asteroids/autocomplete-simple?query={query}&limit=5"
                response = requests.get(url, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Simple endpoint: Found {data['total']} results")
                    for result in data['results'][:3]:  # Show first 3
                        print(f"   - {result['full_name']} ({result['type']})")
                else:
                    print(f"❌ Simple endpoint error: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Simple endpoint failed: {str(e)}")
        
        # Test NASA SBDB endpoint (if requested)
        if test["endpoint"] == "both":
            try:
                url = f"{base_url}/asteroids/autocomplete?query={query}&limit=5"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ NASA SBDB endpoint: Found {data['total']} results")
                    for result in data['results'][:3]:  # Show first 3
                        name = result.get('full_name', result.get('name', 'Unknown'))
                        print(f"   - {name}")
                else:
                    print(f"❌ NASA SBDB endpoint error: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ NASA SBDB endpoint failed: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 Testing completed!")

if __name__ == "__main__":
    test_autocomplete_endpoints()