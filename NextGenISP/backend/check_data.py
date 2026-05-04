import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from api.models import User, Plan, Invoice, Ticket, Area, InstallationTask

print(f"Users: {User.objects.count()}")
print(f"Plans: {Plan.objects.count()}")
print(f"Invoices: {Invoice.objects.count()}")
print(f"Tickets: {Ticket.objects.count()}")
print(f"Areas: {Area.objects.count()}")
print(f"Installations: {InstallationTask.objects.count()}")
