#!/usr/bin/env python3
"""
Test script to verify astroquery SBDB functionality
"""

import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from astroquery.jplsbdb import SBDB
    import warnings
    
    # Suppress warnings
    warnings.filterwarnings('ignore', category=UserWarning, module='astroquery')
    
    print("Testing astroquery SBDB functionality...")
    
    # Test queries
    test_queries = ['Eros', 'Apophis', 'Bennu', 'Ceres', 'Ic', 'Icarus']
    
    for query in test_queries:
        try:
            print(f"\n--- Testing query: {query} ---")
            search_query = f"{query}*"
            
            # Query SBDB
            result = SBDB.query(search_query)
            
            if result is not None:
                print(f"✓ Query successful for {query}")
                print(f"Result type: {type(result)}")
                print(f"Result keys: {list(result.keys()) if hasattr(result, 'keys') else 'No keys'}")
                
                # Try to extract basic info
                if hasattr(result, 'keys'):
                    for key in ['object', 'orbit', 'phys_par']:
                        if key in result:
                            print(f"  - {key}: {type(result[key])}")
                            if key == 'object' and hasattr(result[key], 'keys'):
                                obj_keys = list(result[key].keys())[:5]  # First 5 keys
                                print(f"    Object keys (first 5): {obj_keys}")
                else:
                    print(f"  Result: {str(result)[:200]}...")
                    
            else:
                print(f"✗ No result for {query}")
                
        except Exception as e:
            print(f"✗ Error querying {query}: {str(e)}")
            import traceback
            traceback.print_exc()
    
    print("\n=== Test complete ===")
    
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure astroquery is installed: pip install astroquery")
    sys.exit(1)
except Exception as e:
    print(f"Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)