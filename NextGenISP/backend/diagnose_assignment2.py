import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import InstallationTask, User
from api.serializers import InstallationTaskSerializer

def test_api():
    # Find a lead
    lead = User.objects.filter(status__in=['LEAD', 'READY_TO_INSTALL']).first()
    field_staff = User.objects.filter(role='FIELD_STAFF').first()
    tech_staff = User.objects.filter(role='TECHNICAL_STAFF').first()

    if not lead or not field_staff or not tech_staff:
        print("Missing required users to test.")
        return

    print(f"Lead: {lead.id}, Field: {field_staff.id}, Tech: {tech_staff.id}")

    task = InstallationTask.objects.filter(customer=lead).exclude(status='CLOSED').first()
    
    data = {
        "assigned_staff": field_staff.id,
        "assigned_technical_staff": tech_staff.id,
        "status": "PENDING"
    }

    if task:
        print(f"Testing PATCH on Task {task.id}")
        # When using ModelSerializer with partial=True, it updates fields
        serializer = InstallationTaskSerializer(task, data=data, partial=True)
    else:
        print(f"Testing POST for Customer {lead.id}")
        data["customer"] = lead.id
        data["notes"] = "Admin assignment"
        serializer = InstallationTaskSerializer(data=data)

    if serializer.is_valid():
        print("Serializer is valid!")
        serializer.save()
        print("Saved successfully!")
    else:
        print("Serializer errors:", serializer.errors)

test_api()
