import sys
import os
import requests

def test():
    # Login as admin
    res = requests.post('http://127.0.0.1:8000/api/token/', json={
        "username": "admin",
        "password": "adminpassword"
    })
    
    if res.status_code != 200:
        print("Failed to login:", res.text)
        return

    token = res.json().get('access')
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get all users to find a suitable lead
    users = requests.get('http://127.0.0.1:8000/api/users/', headers=headers).json()
    lead = next((u for u in users if u['status'] in ['LEAD', 'READY_TO_INSTALL']), None)
    
    if not lead:
        print("No leads available.")
        return
        
    field_staff = next((u for u in users if u['role'] == 'FIELD_STAFF'), None)
    tech_staff = next((u for u in users if u['role'] == 'TECHNICAL_STAFF'), None)
    
    if not field_staff or not tech_staff:
        print("Missing staff.")
        return
        
    print(f"Assigning Lead {lead['username']} ({lead['id']}) to FS: {field_staff['id']}, TS: {tech_staff['id']}")
    
    # 1. Fetch existing tasks
    tasks = requests.get('http://127.0.0.1:8000/api/tasks/', headers=headers).json()
    existing_task = next((t for t in tasks if t['customer'] == lead['id'] and t['status'] != 'CLOSED'), None)
    
    if existing_task:
        print("Found existing task, testing PATCH...")
        res2 = requests.patch(f"http://127.0.0.1:8000/api/tasks/{existing_task['id']}/", json={
            "assigned_staff": field_staff['id'],
            "assigned_technical_staff": tech_staff['id'],
            "status": "PENDING"
        }, headers=headers)
        print("PATCH Task Status:", res2.status_code)
        print("PATCH Task Response:", res2.text)
    else:
        print("No existing task, testing POST...")
        res2 = requests.post("http://127.0.0.1:8000/api/tasks/", json={
            "customer": lead['id'],
            "assigned_staff": field_staff['id'],
            "assigned_technical_staff": tech_staff['id'],
            "status": "PENDING",
            "notes": "Test"
        }, headers=headers)
        print("POST Task Status:", res2.status_code)
        print("POST Task Response:", res2.text)

    # 2. Update user status
    if res2.status_code in [200, 201]:
        res3 = requests.patch(f"http://127.0.0.1:8000/api/users/{lead['id']}/", json={
            "status": "INSTALLATION_PENDING"
        }, headers=headers)
        print("PATCH User Status:", res3.status_code)
        print("PATCH User Response:", res3.text)

if __name__ == '__main__':
    test()
