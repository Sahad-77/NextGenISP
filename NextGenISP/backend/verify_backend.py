import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000/api"

def make_request(url, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        data_bytes = urllib.parse.urlencode(data).encode('utf-8')
        # For JSON data, we need json.dumps and application/json header
        if headers.get('Content-Type') == 'application/json':
            data_bytes = json.dumps(data).encode('utf-8')
    else:
        data_bytes = None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            resp_body = response.read().decode('utf-8')
            return response.status, json.loads(resp_body)
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(resp_body)
        except:
             return e.code, dict(error=str(e), body=resp_body)

    except Exception as e:
        return 0, str(e)

def run_verification():
    print("1. Testing Login (cust_sarah)...")
    
    login_url = f"{BASE_URL}/token/"
    # DRF Token accept JSON
    status, body = make_request(login_url, 'POST', {"username": "cust_sarah", "password": "password123"}, {'Content-Type': 'application/json'})
    
    if status != 200:
        print(f"FAILED: Login -- {status} {body}")
        return

    token = body['access']
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("  [OK] Login Successful")

    print("\n2. Checking Profile Status...")
    status, body = make_request(f"{BASE_URL}/auth/me/", 'GET', headers=headers)
    if status == 200:
        print(f"  [OK] Profile: {body.get('username')} is {body.get('status')}")
    else:
        print(f"FAILED: Profile -- {status} {body}")

    print("\n3. Checking Invoices...")
    status, body = make_request(f"{BASE_URL}/invoices/", 'GET', headers=headers)
    if status == 200:
        invoices = body
        print(f"  [OK] Found {len(invoices)} invoices")
        overdue = next((inv for inv in invoices if inv['status'] == 'OVERDUE'), None)
        
        if overdue:
            print(f"   Found Overdue Invoice #{overdue['id']}. Attempting Payment...")
            pay_url = f"{BASE_URL}/payments/mock/"
            p_status, p_body = make_request(pay_url, 'POST', {"invoice_id": overdue['id']}, headers)
            if p_status == 200:
                print("  [OK] Payment Successful")
            else:
                print(f"FAILED: Payment -- {p_status} {p_body}")
        else:
            print("   No Overdue invoice found to test payment.")
    else:
        print(f"FAILED: Invoices -- {status} {body}")

    print("\n4. Creating Support Ticket...")
    print("\n4. Creating Support Ticket...")
    ticket_data = {"subject": "Api Test", "message": "Verify backend", "ticket_type": "LOGICAL", "description": "Description of issue", "status": "OPEN"}
    # Note: Ticket model has 'description', not 'message'. And needs 'ticket_type'.
    # Correcting payload and endpoint.
    status, body = make_request(f"{BASE_URL}/tickets/", 'POST', ticket_data, headers)
    
    if status in [200, 201]:
         print(f"  [OK] Ticket Created: #{body.get('id')}")
    else:
         print(f"FAILED: Ticket -- {status} {body}")

    print("\nBackend Verification Complete")

if __name__ == "__main__":
    run_verification()
