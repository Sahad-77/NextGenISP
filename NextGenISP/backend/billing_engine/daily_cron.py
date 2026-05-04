import os
import sys
import django
from datetime import date, timedelta

# ---------------------------------------------------------
# 1. SETUP DJANGO CONTEXT
# (Required because this script runs outside the server)
# ---------------------------------------------------------
project_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import User, Invoice, Subscription, Plan

# ---------------------------------------------------------
# 2. THE LOGIC
# ---------------------------------------------------------
def run_billing_cycle():
    today = date.today()
    print(f"\n[CRON] --- Starting Billing Cycle for {today} ---")

    # =====================================================
    # TASK A: AUTO-SUSPENSION (The "Enforcer")
    # Logic: Find bills that are 'PENDING' and 'Due Date' has passed.
    # =====================================================
    overdue_invoices = Invoice.objects.filter(status='PENDING', due_date__lt=today)
    
    if overdue_invoices.exists():
        print(f"[SUSPEND] Found {overdue_invoices.count()} overdue invoices.")
        
        for inv in overdue_invoices:
            # 1. Mark Invoice as Overdue
            inv.status = 'OVERDUE'
            inv.save()
            
            # 2. Suspend the User (Cut Internet)
            user = inv.subscription.user
            if user.status == 'ACTIVE':
                user.status = 'SUSPENDED'
                user.save()
                print(f"   🚫 SUSPENDED: {user.username} (Unpaid: ₹{inv.amount})")
    else:
        print("[SUSPEND] No defaulters found today.")

    # =====================================================
    # TASK B: RECURRING BILL GENERATION (The "Revenue")
    # Logic: Find subscriptions that end today (or expired yesterday).
    # =====================================================
    expiring_subs = Subscription.objects.filter(status='ACTIVE', end_date__lte=today)
    
    if expiring_subs.exists():
        print(f"[RENEWAL] Found {expiring_subs.count()} subscriptions to renew.")
        
        for sub in expiring_subs:
            # 1. Generate New Invoice
            new_invoice = Invoice.objects.create(
                subscription=sub,
                amount=sub.plan.price,  # recurring price
                due_date=today + timedelta(days=7), # 7-Day Grace Period
                status='PENDING',
                description=f"Monthly Renewal: {sub.plan.name} (Cycle: {today})"
            )
            
            # 2. Extend Subscription Date (Add 30 Days)
            sub.start_date = today
            sub.end_date = today + timedelta(days=30)
            sub.save()
            
            print(f"   💰 GENERATED: Bill #{new_invoice.id} for {sub.user.username}")
    else:
        print("[RENEWAL] No subscriptions expiring today.")

    print("[CRON] --- Cycle Complete ---")

if __name__ == "__main__":
    run_billing_cycle()
