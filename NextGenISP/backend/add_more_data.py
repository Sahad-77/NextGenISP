import os
import django
import shutil
from django.core.files import File

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import Plan, Hardware, Area

def run():
    print("Starting to add new Plans and Routers...")

    # Fetch existing areas to attach plans to
    areas = list(Area.objects.all())
    if not areas:
        print("No areas found! Please run the main seed script first.")
        return

    # 1. Add New Plans
    plans_data = [
        {"name": "Platinum Max", "speed_mbps": 300, "price": 1499.00, "plan_type": "FIBER", "desc": "Ultimate speed for 4K streaming and low-latency gaming."},
        {"name": "Corporate Fiber", "speed_mbps": 1000, "price": 4999.00, "plan_type": "FIBER", "desc": "1 Gbps dedicated speed for offices and large enterprises."},
        {"name": "Budget Net", "speed_mbps": 30, "price": 399.00, "plan_type": "FIBER", "desc": "Affordable entry-level plan for basic browsing and social media."}
    ]

    print("\n--- Adding Plans ---")
    for p in plans_data:
        plan, created = Plan.objects.get_or_create(
            name=p["name"],
            defaults={
                "speed_mbps": p["speed_mbps"],
                "price": p["price"],
                "plan_type": p["plan_type"],
                "description": p["desc"],
                "data_limit_gb": 3000 if "Corporate" in str(p["name"]) else 1000
            }
        )
        if created:
            plan.areas.add(*areas)
            print(f"Created Plan: {plan.name}")
        else:
            print(f"Plan already exists: {plan.name}")

    # 2. Add New Hardware (Routers) with AI Images
    hardware_data = [
        {
            "name": "WiFi 6 Mesh Router",
            "price": 3499.00,
            "desc": "Next-Gen WiFi 6 Technology for whole-home coverage. Eliminates dead zones with speeds up to 1800 Mbps.",
            "image_source_path": r"C:\Users\sahad\.gemini\antigravity\brain\445cf8d1-846c-4f97-81dd-5ad140b6e9ea\wifi_6_mesh_router_1772684242868.png",
            "image_filename": "wifi_6_mesh_router.png"
        },
        {
            "name": "Gaming Router Pro",
            "price": 5999.00,
            "desc": "Extreme performance gaming router. Features QoS prioritization, stealth black design, and ultra-low latency.",
            "image_source_path": r"C:\Users\sahad\.gemini\antigravity\brain\445cf8d1-846c-4f97-81dd-5ad140b6e9ea\gaming_router_pro_1772684264052.png",
            "image_filename": "gaming_router_pro.png"
        },
        {
            "name": "Basic ONU Wi-Fi Modem",
            "price": 1200.00,
            "desc": "Standard minimalist Fiber ONU modem with built-in dual-band Wi-Fi. Perfect for basic plans.",
            "image_source_path": r"C:\Users\sahad\.gemini\antigravity\brain\445cf8d1-846c-4f97-81dd-5ad140b6e9ea\basic_onu_modem_1772684280051.png",
            "image_filename": "basic_onu_modem.png"
        }
    ]

    print("\n--- Adding Hardware ---")
    
    # Ensure media directory exists
    media_hw_dir = os.path.join(os.getcwd(), 'media', 'hardware')
    os.makedirs(media_hw_dir, exist_ok=True)

    for h in hardware_data:
        # Check if hardware already exists to avoid duplicates
        hw, created = Hardware.objects.get_or_create(
            name=h["name"],
            defaults={
                "price": h["price"],
                "description": h["desc"],
                "is_active": True
            }
        )
        
        # Save Generated Image to Model
        if os.path.exists(str(h["image_source_path"])):
            with open(str(h["image_source_path"]), 'rb') as f:
                # Need to give a unique name so Django handles it nicely
                hw.image.save(str(h["image_filename"]), File(f), save=True)
            print(f"{'Created' if created else 'Updated'} Hardware with Image: {hw.name}")
        else:
            print(f"Warning: Image file not found at {h['image_source_path']} for hardware: {hw.name}")

    print("\n✅ New Plans and Routers added successfully!")

if __name__ == '__main__':
    run()
