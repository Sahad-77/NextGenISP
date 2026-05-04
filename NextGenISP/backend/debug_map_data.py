import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import Area, Plan

print(f"--- Areas ({Area.objects.count()}) ---")
for area in Area.objects.all():
    print(f"ID: {area.id}, Name: {area.name}, Code: {area.code}")
    print(f"Coordinates: {area.coordinates[:50]}..." if area.coordinates else "Coordinates: NULL/EMPTY")
    try:
        if area.coordinates:
            parsed = json.loads(area.coordinates)
            print(f"Parsed Coords: {len(parsed)} points found.")
        else:
            print("Parsed Coords: N/A")
    except Exception as e:
        print(f"Parsed Coords: INVALID JSON ({e})")
    print("-" * 20)

print(f"\n--- Plans ({Plan.objects.count()}) ---")
for plan in Plan.objects.all():
    print(f"ID: {plan.id}, Name: {plan.name}, Price: {plan.price}")
