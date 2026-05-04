import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import Hardware

def run():
    # 1. Update Existing Basic Router
    hw_basic, created = Hardware.objects.get_or_create(
        name="Dual-Band Gigabit Router",
        defaults={'price': 1499.00, 'description': "AC1200 Wireless Speed, 4x Gigabit LAN"}
    )
    hw_basic.image = 'hardware/basic_router.png'
    hw_basic.save()
    print(f"Updated Basic Router: {hw_basic.image}")

    # 2. Create/Update Pro Gaming Router
    hw_pro, created = Hardware.objects.get_or_create(
        name="ROG Rapture Gaming Router",
        defaults={'price': 14999.00, 'description': "Wi-Fi 6, 11000Mbps, Triple-level Game Acceleration"}
    )
    hw_pro.price = 14999.00
    hw_pro.image = 'hardware/pro_router.png'
    hw_pro.save()
    print(f"Updated Pro Router: {hw_pro.image}")

    # 3. Create/Update Mesh System
    hw_mesh, created = Hardware.objects.get_or_create(
        name="ZenWiFi Mesh System (3-Pack)",
        defaults={'price': 25999.00, 'description': "Whole Home Coverage, AX Mini, 3000 sq.ft coverage"}
    )
    hw_mesh.price = 25999.00
    hw_mesh.image = 'hardware/mesh_system.png'
    hw_mesh.save()
    print(f"Updated Mesh System: {hw_mesh.image}")

if __name__ == '__main__':
    run()
