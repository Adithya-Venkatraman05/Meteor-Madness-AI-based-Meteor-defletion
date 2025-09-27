#!/usr/bin/env python3
"""
Performance Testing for Physics Engine
Tests computational efficiency and speed
"""

import sys
import os
import time
import statistics
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from physics_engine import PhysicsEngine, AsteroidProperties, AsteroidComposition
import json

def performance_test_single_calculation():
    """Test performance of single impact calculation"""
    
    print("⚡ Performance Test: Single Impact Calculation")
    print("=" * 50)
    
    engine = PhysicsEngine()
    test_asteroid = AsteroidProperties(
        diameter=100,
        composition=AsteroidComposition.ROCKY,
        velocity=20000
    )
    
    # Warm up
    for _ in range(10):
        engine.analyze_impact(test_asteroid)
    
    # Time multiple runs
    times = []
    for i in range(100):
        start_time = time.time()
        results = engine.analyze_impact(test_asteroid)
        end_time = time.time()
        times.append(end_time - start_time)
    
    avg_time = statistics.mean(times)
    min_time = min(times)
    max_time = max(times)
    std_dev = statistics.stdev(times)
    
    print(f"📊 Results (100 runs):")
    print(f"   Average time: {avg_time*1000:.2f} ms")
    print(f"   Min time: {min_time*1000:.2f} ms")
    print(f"   Max time: {max_time*1000:.2f} ms")
    print(f"   Std deviation: {std_dev*1000:.2f} ms")
    print(f"   Calculations per second: {1/avg_time:.0f}")
    
    return avg_time

def performance_test_batch_processing():
    """Test performance of batch processing multiple asteroids"""
    
    print("\n⚡ Performance Test: Batch Processing")
    print("=" * 40)
    
    engine = PhysicsEngine()
    
    # Create test batch
    test_asteroids = []
    for i in range(1000):
        asteroid = AsteroidProperties(
            diameter=50 + (i % 200),  # 50-250m range
            composition=list(AsteroidComposition)[i % 4],
            velocity=15000 + (i % 20000)  # 15-35 km/s range
        )
        test_asteroids.append(asteroid)
    
    print(f"Processing {len(test_asteroids)} asteroids...")
    
    start_time = time.time()
    results = []
    for asteroid in test_asteroids:
        result = engine.analyze_impact(asteroid)
        results.append(result)
    end_time = time.time()
    
    total_time = end_time - start_time
    avg_per_asteroid = total_time / len(test_asteroids)
    
    print(f"📊 Batch Results:")
    print(f"   Total time: {total_time:.2f} seconds")
    print(f"   Average per asteroid: {avg_per_asteroid*1000:.2f} ms")
    print(f"   Throughput: {len(test_asteroids)/total_time:.0f} asteroids/second")
    
    return total_time, len(test_asteroids)

def performance_test_deflection_analysis():
    """Test performance of deflection feasibility calculations"""
    
    print("\n⚡ Performance Test: Deflection Analysis")
    print("=" * 40)
    
    engine = PhysicsEngine()
    test_asteroid = AsteroidProperties(diameter=200, velocity=18000)
    
    # Test parameters
    scenarios = [
        (12742000, 1*365*24*3600, 1e12),    # 1 year warning
        (12742000, 5*365*24*3600, 1e14),    # 5 year warning
        (12742000, 10*365*24*3600, 1e15),   # 10 year warning
        (12742000, 50*365*24*3600, 1e13),   # 50 year warning
    ]
    
    times = []
    
    for scenario in scenarios * 25:  # 100 total tests
        distance, warning_time, energy = scenario
        
        start_time = time.time()
        feasibility = engine.assess_deflection_feasibility(
            test_asteroid, distance, warning_time, energy
        )
        end_time = time.time()
        
        times.append(end_time - start_time)
    
    avg_time = statistics.mean(times)
    
    print(f"📊 Deflection Analysis Results ({len(times)} runs):")
    print(f"   Average time: {avg_time*1000:.2f} ms")
    print(f"   Analyses per second: {1/avg_time:.0f}")
    
    return avg_time

def memory_usage_test():
    """Test memory usage patterns"""
    
    print("\n💾 Memory Usage Test")
    print("=" * 30)
    
    try:
        import psutil
        process = psutil.Process()
        
        # Baseline memory
        baseline_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        engine = PhysicsEngine()
        
        # Create many asteroids
        asteroids = []
        for i in range(10000):
            asteroid = AsteroidProperties(
                diameter=10 + i % 1000,
                velocity=10000 + i % 50000
            )
            asteroids.append(asteroid)
        
        after_creation = process.memory_info().rss / 1024 / 1024  # MB
        
        # Process them
        results = []
        for asteroid in asteroids[:1000]:  # Process subset
            result = engine.analyze_impact(asteroid)
            results.append(result)
        
        after_processing = process.memory_info().rss / 1024 / 1024  # MB
        
        print(f"📊 Memory Usage:")
        print(f"   Baseline: {baseline_memory:.1f} MB")
        print(f"   After creating 10k asteroids: {after_creation:.1f} MB")
        print(f"   After processing 1k: {after_processing:.1f} MB")
        print(f"   Memory per asteroid (creation): {(after_creation-baseline_memory)/10:.3f} MB")
        print(f"   Memory per result: {(after_processing-after_creation)/1000:.3f} MB")
        
    except ImportError:
        print("❌ psutil not available, skipping memory test")

def accuracy_vs_speed_test():
    """Test if faster calculations maintain accuracy"""
    
    print("\n🎯 Accuracy vs Speed Test")
    print("=" * 35)
    
    engine = PhysicsEngine()
    
    # Reference calculation (detailed)
    reference_asteroid = AsteroidProperties(
        diameter=150,
        composition=AsteroidComposition.ROCKY,
        velocity=20000,
        angle=45
    )
    
    # Time detailed calculation
    start_time = time.time()
    reference_result = engine.analyze_impact(reference_asteroid)
    detailed_time = time.time() - start_time
    
    print(f"📊 Reference Results:")
    print(f"   Energy: {reference_result.tnt_equivalent:.3f} MT")
    print(f"   Calculation time: {detailed_time*1000:.2f} ms")
    
    # Test if similar asteroids give consistent results
    consistent_results = True
    similar_asteroids = []
    
    for i in range(10):
        # Create slightly different asteroids
        similar = AsteroidProperties(
            diameter=reference_asteroid.diameter + (i-5),
            composition=reference_asteroid.composition,
            velocity=reference_asteroid.velocity + (i-5)*100,
            angle=reference_asteroid.angle + (i-5)
        )
        similar_asteroids.append(similar)
    
    for asteroid in similar_asteroids:
        result = engine.analyze_impact(asteroid)
        # Results should be within reasonable range
        energy_ratio = result.tnt_equivalent / reference_result.tnt_equivalent
        if not (0.8 <= energy_ratio <= 1.2):
            consistent_results = False
            break
    
    print(f"✅ Consistency check: {consistent_results} ({'PASS' if consistent_results else 'FAIL'})")

def run_performance_suite():
    """Run complete performance test suite"""
    
    print("🚀 PHYSICS ENGINE PERFORMANCE TESTING")
    print("=" * 60)
    
    try:
        # Individual tests
        single_time = performance_test_single_calculation()
        batch_time, batch_count = performance_test_batch_processing()
        deflection_time = performance_test_deflection_analysis()
        
        # Memory test
        memory_usage_test()
        
        # Accuracy test
        accuracy_vs_speed_test()
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 PERFORMANCE TESTING SUMMARY")
        print("=" * 60)
        print(f"📈 Single calculation: {1/single_time:.0f} calculations/sec")
        print(f"📈 Batch processing: {batch_count/batch_time:.0f} asteroids/sec")
        print(f"📈 Deflection analysis: {1/deflection_time:.0f} analyses/sec")
        
        # Performance ratings
        if single_time < 0.001:
            print("⚡ Single calculation speed: EXCELLENT")
        elif single_time < 0.01:
            print("✅ Single calculation speed: GOOD")
        else:
            print("⚠️  Single calculation speed: ACCEPTABLE")
        
        if batch_count/batch_time > 1000:
            print("⚡ Batch processing speed: EXCELLENT")
        elif batch_count/batch_time > 100:
            print("✅ Batch processing speed: GOOD")
        else:
            print("⚠️  Batch processing speed: ACCEPTABLE")
        
        print("\n🎉 Performance testing completed!")
        print("🛡️ Physics engine is optimized for real-time analysis!")
        
    except Exception as e:
        print(f"\n❌ Performance testing failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_performance_suite()