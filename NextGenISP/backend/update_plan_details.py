import os
import django
import sys
import json

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import Plan, Hardware

def seed_plan_details():
    # Attempt to fetch hardware objects to link
    basic_router = Hardware.objects.filter(name__icontains="TP-LINK TL").first()
    ac_router = Hardware.objects.filter(name__icontains="Dual-Band").first()
    pro_router = Hardware.objects.filter(name__icontains="Gaming Router Pro").first() or Hardware.objects.filter(name__icontains="Mesh").first()

    plans_data = {
        "Basic Starter": {
            "hero_tagline": "The Perfect Foundation for Everyday Browsing.",
            "features": "100% Fiber Optic,No Throttling,Free Standard Router,24/7 Support",
            "recommended": [basic_router] if basic_router else []
        },
        "Home Plus": {
            "hero_tagline": "Powering Your Smart Home with Seamless Connectivity.",
            "features": "Symmetric Speeds,4K Streaming Ready,Supports 10+ Devices,Free Advanced Router",
            "recommended": [basic_router, ac_router] if basic_router and ac_router else []
        },
        "Gamer Pro": {
            "hero_tagline": "Zero Lag. Infinite Possibilities.",
            "features": "Ultra-Low Latency Routing,Static IP Included,Priority Traffic Shaping,Premium Gaming Router",
            "recommended": [ac_router, pro_router] if ac_router and pro_router else []
        },
        "Enterprise Gigabit": {
            "hero_tagline": "Unleash Ultimate Bandwidth for Your Business.",
            "features": "Dedicated Symmetrical Fiber,99.9% Uptime SLA,Mesh System Included,Dedicated Support Line",
            "recommended": [pro_router] if pro_router else []
        }
    }

    count = 0
    for name, data in plans_data.items():
        plan = Plan.objects.filter(name__icontains=name).first()
        if plan:
            plan.hero_tagline = data["hero_tagline"]
            plan.features = data["features"]
            plan.save()
            
            # Clear and set recommended hardware
            if data["recommended"]:
                valid_hardware = [h for h in data["recommended"] if h is not None]
                if valid_hardware:
                    plan.recommended_hardware.set(valid_hardware)
            
            print(f"✅ Updated details for Plan: {plan.name}")
            count += 1
            
    print(f"\n🎉 Successfully enriched {count} internet plans!")

if __name__ == '__main__':
    seed_plan_details()
