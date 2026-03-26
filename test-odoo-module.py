# Test script to check Odoo module status and routes
import urllib.request
import urllib.error
import json

def test_odoo_module():
    base_url = "http://localhost:8069"
    
    print("Testing Odoo module status...")
    
    # Test if we can access the database selector (indicates Odoo is running)
    try:
        response = urllib.request.urlopen(f"{base_url}/web/database/selector", timeout=10)
        print(f"✅ Odoo is running (Database selector accessible)")
    except Exception as e:
        print(f"❌ Cannot access Odoo database selector: {e}")
        return
    
    # Test the real estate API endpoints
    test_urls = [
        f"{base_url}/api/properties",
        f"{base_url}/api/properties?limit=50&db=odoo_18",
        f"{base_url}/real_estate/api/properties",
        f"{base_url}/real_estate/api/properties?limit=50&db=odoo_18",
    ]
    
    for url in test_urls:
        print(f"\nTesting: {url}")
        try:
            req = urllib.request.Request(url)
            req.add_header('Accept', 'application/json')
            req.add_header('User-Agent', 'Mozilla/5.0')
            
            response = urllib.request.urlopen(req, timeout=10)
            print(f"✅ Success! Status: {response.status}")
            
            # Try to read response
            try:
                data = response.read().decode('utf-8')
                if len(data) > 0:
                    print(f"Response preview: {data[:200]}...")
                else:
                    print("Empty response")
            except Exception as e:
                print(f"Could not read response: {e}")
                
        except urllib.error.HTTPError as e:
            print(f"❌ HTTP Error {e.code}: {e.reason}")
            if e.code == 404:
                print("   → Route not found - module may not be installed correctly")
            elif e.code == 403:
                print("   → Access forbidden - may need authentication or public access")
            elif e.code == 500:
                print("   → Server error - check Odoo logs")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_odoo_module()