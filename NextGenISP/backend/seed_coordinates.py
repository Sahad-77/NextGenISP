import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import Area

# Default Center: [9.9700, 76.2800] (Ernakulam Mainland - Safer from water)
DEFAULT_LAT = 9.9700
DEFAULT_LNG = 76.2800

def create_polygon(center_lat, center_lng, offset=0.01):
    """Creates a simple square polygon around a center point"""
    return json.dumps([
        [center_lat + offset, center_lng + offset],
        [center_lat - offset, center_lng + offset],
        [center_lat - offset, center_lng - offset],
        [center_lat + offset, center_lng - offset]
    ])

print("Seeding Coordinates for Areas...")
areas = Area.objects.all()

for i, area in enumerate(areas):
    # Offset each area slightly so they don't perfectly overlap
    lat_offset = (i * 0.02)
    lng_offset = (i * 0.02)
    
    # Create distinct polygons
    coords = create_polygon(DEFAULT_LAT + lat_offset, DEFAULT_LNG + lng_offset)
    
    area.coordinates = coords
    area.save()
    print(f"Updated {area.name} with coordinates.")

print("Area Seeding Complete!")
