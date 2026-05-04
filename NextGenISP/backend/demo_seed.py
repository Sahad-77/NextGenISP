import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import User, Plan, Invoice, Ticket, Area, InstallationTask, Subscription

def create_demo_data():
    print("Starteing Demo Data Seeding...")
    
    # 1. Ensure we have customers
    customers = User.objects.filter(role='CUSTOMER')
    tech_staff = User.objects.filter(role='TECHNICAL_STAFF').first()
    
    if not tech_staff:
        print("Creating Tech Staff...")
        tech_staff = User.objects.create_user(username='tech1', email='tech1@example.com', password='password123', role='TECHNICAL_STAFF')

    print(f"Found {customers.count()} customers.")

    # 2. Create Installations
    print("Creating Installations...")
    statuses = ['PENDING', 'IN_PROGRESS', 'PHYSICAL_COMPLETED', 'CLOSED']
    for i, customer in enumerate(customers[:5]):
        if not InstallationTask.objects.filter(customer=customer).exists():
            status = statuses[i % len(statuses)]
            InstallationTask.objects.create(
                customer=customer,
                assigned_staff=tech_staff,
                status=status,
                is_router_required=True,
                notes=f"Demo installation for {customer.username}"
            )
            print(f" - Created Installation for {customer.username} ({status})")

    # 3. Create Tickets
    print("Creating Tickets...")
    ticket_types = ['LOGICAL', 'PHYSICAL', 'INSTALLATION']
    ticket_statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
    
    for i in range(10):
        customer = random.choice(customers)
        Ticket.objects.create(
            customer=customer,
            subject=f"Issue regarding {random.choice(['Speed', 'Router', 'Billing', 'Connection'])}",
            description="Experiencing intermittent connectivity issues since yesterday.",
            ticket_type=random.choice(ticket_types),
            status=random.choice(ticket_statuses)
        )
    print(" - Created 10 Random Tickets")

    # 4. Create Invoices
    print("Creating Invoices...")
    for customer in customers[:3]:
        subs = Subscription.objects.filter(user=customer).first()
        if subs:
            # Past Invoice
            Invoice.objects.create(
                subscription=subs,
                amount=subs.plan.price,
                status='PAID',
                issue_date=timezone.now().date() - timedelta(days=30),
                due_date=timezone.now().date() - timedelta(days=25)
            )
            # Pending Invoice
            Invoice.objects.create(
                subscription=subs,
                amount=subs.plan.price,
                status='PENDING',
                issue_date=timezone.now().date(),
                due_date=timezone.now().date() + timedelta(days=5)
            )
            print(f" - Created Invoices for {customer.username}")

    print("Demo Data Seeding Complete!")

if __name__ == '__main__':
    create_demo_data()
