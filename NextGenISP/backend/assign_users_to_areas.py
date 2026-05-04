import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import User, Area

print("Assigning Users to Areas...")

areas = list(Area.objects.all())
if not areas:
    print("No areas found! Please run seed_coordinates.py first.")
    exit()

customers = User.objects.filter(role='CUSTOMER')
count = 0

for user in customers:
    if not user.area:
        user.area = random.choice(areas)
        user.save()
        print(f"Assigned {user.username} to {user.area.name}")
        count += 1
    else:
        print(f"{user.username} already has area {user.area.name}")

print(f"Assignment Complete. Updated {count} users.")
