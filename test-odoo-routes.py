# Test script to check Odoo routes and module status
import requests
import json

def test_odoo_routes():
    base_url = "http://localhost:8069"
    
    # Test basic Odoo connectivity
    print("Testing basic Odoo connectivity...")
    try:
        response = requests.get(base_url, timeout=10)
        print(f"✅ Odoo is running (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Cannot connect to Odoo: {e}")
        return
    
    # Test API routes
    routes_to_test = [
        "/api/properties",
        "/api/properties?limit=50&db=odoo_18", 
        "/odoo/api/properties?limit=50&db=odoo_18",
        "/real_estate/api/properties",
        "/web/database/selector"
    ]
    
    for route in routes_to_test:
        url = f"{base_url}{route}"
        print(f"\nTesting: {url}")
        try:
            response = requests.get(url, timeout=10)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"✅ Route found!")
                if 'application/json' in response.headers.get('content-type', ''):
                    data = response.json()
                    print(f"Response preview: {str(data)[:200]}...")
            elif response.status_code == 404:
                print(f"❌ Route not found")
            elif response.status_code == 403:
                print(f"⚠️  Access forbidden - may need authentication")
            else:
                print(f"Response: {response.text[:200]}...")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_odoo_routes()