import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Area, Plan, Hardware, InventoryItem, User

User = get_user_model()

def run():
    print("WARNING: This will wipe all data except Superusers. Proceeding...")

    # 1. Clean Data (Order matters for ForeignKeys)
    # Delete non-superusers
    User.objects.filter(is_superuser=False).delete()
    print("Deleted all non-admin users.")
    
    Plan.objects.all().delete()
    print("Deleted all Plans.")
    
    InventoryItem.objects.all().delete()
    print("Deleted all Inventory.")
    
    Hardware.objects.all().delete()
    print("Deleted all Hardware.")

    # Delete Areas (Plans/Users depend on this)
    Area.objects.all().delete()
    print("Deleted all Areas.")


    # 2. Create Areas
    area1 = Area.objects.create(name="Kochi Central", code="KOC-01", city="Kochi")
    area2 = Area.objects.create(name="Edapally Zone", code="EDP-01", city="Kochi")
    print(f"Created Areas: {area1}, {area2}")

    # 3. Create Plans
    plan1 = Plan.objects.create(name="Fiber Starter", speed_mbps=50, price=499.00, plan_type="FIBER")
    plan1.areas.add(area1, area2)
    
    plan2 = Plan.objects.create(name="Fiber Gamer", speed_mbps=150, price=999.00, plan_type="FIBER")
    plan2.areas.add(area1) # Only in Central
    print(f"Created Plans: {plan1}, {plan2}")

    # 4. Create Hardware
    hw1 = Hardware.objects.create(name="Dual-Band Gigabit Router", price=1499.00, description="AC1200 Wireless Speed")
    print(f"Created Hardware: {hw1}")

    # 5. Create Inventory
    inv1 = InventoryItem.objects.create(name="Fiber Cable (Simplex)", sku="CAB-001", quantity=500, unit_price=10.00, category="CABLE")
    inv2 = InventoryItem.objects.create(name="ONU Device", sku="ONU-X1", quantity=20, unit_price=1200.00, category="ROUTER")
    print(f"Created Inventory: {inv1}, {inv2}")

    print(f"Created Inventory: {inv1}, {inv2}")

    # 6. Create Staff with Geo-Location (for Map)
    tech = User.objects.create_user(
        username="tech_arun",
        email="arun@isp.com",
        password="password123",
        role="TECHNICAL_STAFF",
        phone_number="9876543210",
        area=area1,
        latitude=9.9312, longitude=76.2673 # Kochi Center
    )
    print(f"Created Technical Staff: {tech.username}")

    field = User.objects.create_user(
        username="field_manu",
        email="manu@isp.com",
        password="password123",
        role="FIELD_STAFF",
        phone_number="9123456780",
        area=area2,
        latitude=10.0236, longitude=76.3125 # Edapally
    )
    print(f"Created Field Staff: {field.username}")

    # 7. Create Dummy Customers (Active & Defaulters to show map colors)
    cust1 = User.objects.create_user(
        username="cust_ravi", email="ravi@gmail.com", password="password123",
        role="CUSTOMER", status="ACTIVE",
        phone_number="9000000001", area=area1,
        address="MG Road, Kochi",
        latitude=9.9400, longitude=76.2700 # Near Center
    )
    
    cust2 = User.objects.create_user(
        username="cust_sarah", email="sarah@gmail.com", password="password123",
        role="CUSTOMER", status="SUSPENDED", # Should be Yellow on Map
        phone_number="9000000002", area=area2,
        address="Lulu Mall Area, Edapally",
        latitude=10.0250, longitude=76.3100 # Near Edapally
    )

    cust3 = User.objects.create_user(
        username="cust_paul", email="paul@gmail.com", password="password123",
        role="CUSTOMER", status="ACTIVE",
        phone_number="9000000003", area=area1,
        address="Fort Kochi",
        latitude=9.9600, longitude=76.2400 # Fort Kochi
    )
    print(f"Created Customers: {cust1.username}, {cust2.username}, {cust3.username}")

    print("✅ Database Reset & Seed Completed Successfully!")

if __name__ == '__main__':
    run()
