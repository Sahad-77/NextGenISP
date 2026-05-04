import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import User, Area

# Coordinates definitely outside our "Inland" polygons
# Mainland Center: 9.9700, 76.2800
# Let's put these guys way out in Aluva/Kalamassery (North) or across the water
NO_SERVICE_LAT = 10.0500 
NO_SERVICE_LNG = 76.3300 

def ensure_user(username, email):
    user, created = User.objects.get_or_create(username=username, defaults={
        'email': email,
        'role': 'CUSTOMER',
        'status': 'LEAD' # Pending because no service
    })
    if created:
        print(f"Created new user: {username}")
        user.set_password('password123')
    else:
        print(f"Found existing user: {username}")
    
    # 1. Unassign Area (Clean slate)
    user.area = None
    
    # 2. Set coordinates to "No Service Zone"
    # Add slight jitter so they don't stack perfectly
    user.latitude = NO_SERVICE_LAT + (random.random() - 0.5) * 0.01
    user.longitude = NO_SERVICE_LNG + (random.random() - 0.5) * 0.01
    
    # 3. Add explicit address note
    user.address = f"Unserviceable Location (Outskirts) - {username.capitalize()}'s House"
    
    user.save()
    print(f" - Moved {username} to {user.latitude}, {user.longitude} (Outside Service Area)")

# Target Users
ensure_user('ravi', 'ravi@example.com')
ensure_user('paul', 'paul@example.com')

print("Done! Ravi and Paul are now in the 'No Service' black hole.")
