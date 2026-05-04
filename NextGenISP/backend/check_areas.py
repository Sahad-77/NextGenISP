import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import Area

count = Area.objects.count()
print(f"Area count: {count}")
if count > 0:
    for area in Area.objects.all():
        print(f"- {area.name} ({area.code})")
