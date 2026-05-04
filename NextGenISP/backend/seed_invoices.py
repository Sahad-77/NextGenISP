import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Invoice, Plan, Subscription

User = get_user_model()

def run():
    print("Seeding Invoices...")
    
    # 0. Clean old invoices/subscriptions to prevent duplicates if rerunning
    Invoice.objects.all().delete()
    Subscription.objects.all().delete()

    # 1. Sarah (Suspended)
    try:
        sarah = User.objects.get(username="cust_sarah")
        plan_gamer = Plan.objects.get(name="Fiber Gamer")
        
        # Create Subscription
        sub1 = Subscription.objects.create(
            user=sarah,
            plan=plan_gamer,
            status='SUSPENDED',
            end_date=date.today() + timedelta(days=30)
        )
        
        # Create Overdue Invoice
        inv1 = Invoice.objects.create(
            subscription=sub1,
            amount=plan_gamer.price,
            status='OVERDUE',
            due_date=date.today() - timedelta(days=1)
        )
        print(f"Created OVERDUE Invoice #{inv1.id} for {sarah.username}")

        # 2. Ravi (Active)
        ravi = User.objects.get(username="cust_ravi")
        plan_starter = Plan.objects.get(name="Fiber Starter")
        
        sub2 = Subscription.objects.create(
            user=ravi,
            plan=plan_starter,
            status='ACTIVE'
        )
        
        inv2 = Invoice.objects.create(
            subscription=sub2,
            amount=plan_starter.price,
            status='PAID',
            due_date=date.today() - timedelta(days=20)
        )
        print(f"Created PAID Invoice #{inv2.id} for {ravi.username}")
        
        # 3. Paul (Active)
        paul = User.objects.get(username="cust_paul")
        
        sub3 = Subscription.objects.create(
            user=paul,
            plan=plan_starter,
            status='ACTIVE'
        )
        
        inv3 = Invoice.objects.create(
            subscription=sub3,
            amount=plan_starter.price,
            status='PENDING',
            due_date=date.today() + timedelta(days=5)
        )
        print(f"Created PENDING Invoice #{inv3.id} for {paul.username}")
        
        print("  [OK] Invoice Seeding Complete")

    except Exception as e:
        print(f"  [ERROR] Error during seeding: {e}")

if __name__ == '__main__':
    run()
