import os, django, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

import django.core.mail as mail
def mock_send(*args, **kwargs):
    print("MOCKED EMAIL SENT:", kwargs.get('subject', args[0] if args else ''))
mail.send_mail = mock_send

print("Django setup done")

from rest_framework.test import APIRequestFactory, force_authenticate
from api.models import User, Plan, InstallationTask, Subscription, Invoice
from api.views import UserViewSet, ActivationView

print('--- SIMULATING NEW CUSTOMER LIFECYCLE ---')
try:
    # 1. Registration
    user, _ = User.objects.get_or_create(username='sim100', email='sim100@sim.com', role='CUSTOMER')
    user.status = 'LEAD'
    user.save()
    print('1. User Created:', user.username)

    # 2. Staff Verification
    user.status = 'VERIFIED'
    user.save()
    print('2. User Verified')

    # 3. Plan Selection
    plan = Plan.objects.first()
    factory = APIRequestFactory()
    request = factory.post(f'/api/users/{user.id}/select_plan/', {
        'plan_id': plan.id,
        'router_selection': 'Basic Router +₹1500'
    }, format='json')
    force_authenticate(request, user=user)
    view = UserViewSet.as_view({'post': 'select_plan'})
    response = view(request, pk=user.id)
    print('3. Plan Selected API Response:', response.data)
    
    task = InstallationTask.objects.filter(customer=user).first()
    if task:
        print('   Task Plan Set:', task.plan.name if task.plan else None)
    else:
        print('   NO TASK CREATED!')

    # 4. Activation
    staff, _ = User.objects.get_or_create(username='sim_staff100', role='TECH_STAFF')
    req2 = factory.post('/api/installation/activate/', {
        'user_id': user.id,
        'mac_address': 'A1:B2:C3:D4:E5:F6'
    }, format='json')
    force_authenticate(req2, user=staff)
    
    v2 = ActivationView.as_view()
    resp2 = v2(req2)
    print('4. Activation API Response:', resp2.data)

    # 5. Check outcome
    subs = Subscription.objects.filter(user=user)
    print('   Subscriptions Created:', subs.count())
    invoices = Invoice.objects.filter(subscription__user=user)
    print('   Invoices Created:', invoices.count())
    if invoices.exists():
        for inv in invoices:
            print(f'   -> Invoice ID: {inv.id}, Amount: {inv.amount}, Status: {inv.status}, Desc: {inv.description}')
    
except Exception as e:
    import traceback
    traceback.print_exc()
