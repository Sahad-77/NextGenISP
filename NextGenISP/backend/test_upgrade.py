import os, django, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

import django.core.mail as mail
def mock_send(*args, **kwargs):
    print("MOCKED EMAIL SENT:", kwargs.get('subject', args[0] if args else ''))
mail.send_mail = mock_send

print("Django setup done")

from rest_framework.test import APIRequestFactory, force_authenticate
from api.models import User, Plan, Subscription, Invoice, Ticket
from api.views import UserViewSet, PaymentViewSet

user = User.objects.filter(username='anzalna').first()
sub = Subscription.objects.filter(user=user, status='ACTIVE').first()

if not user or not sub:
    print('No active customer/subscription found.')
    sys.exit()

old_plan = sub.plan
new_plan = Plan.objects.exclude(id=sub.plan.id).filter(price__gt=sub.plan.price).first()
if not new_plan:
    print('No higher tier plan found for testing.')
    sys.exit()

print(f'\n--- UPGRADE TEST START ---')
print(f'User: {user.username}')
print(f'Old Plan: {old_plan.name} (₹{old_plan.price})')
print(f'New Plan: {new_plan.name} (₹{new_plan.price})')

factory = APIRequestFactory()

# 1. UPGRADE REQUEST
request = factory.post(f'/api/users/{user.id}/upgrade_plan/', {
    'plan_id': new_plan.id
}, format='json')
force_authenticate(request, user=user)

view = UserViewSet.as_view({'post': 'upgrade_plan'})
try:
    response = view(request, pk=user.id)
    print('\n[Step 1] Upgrade API Response:', response.data)
    
    if 'invoice_id' in response.data and response.data['invoice_id']:
        inv_id = response.data['invoice_id']
        inv = Invoice.objects.get(id=inv_id)
        print(f' -> Created UPGRADE Invoice #{inv.id} for ₹{inv.amount} (Status: {inv.status})')

        initial_tickets = Ticket.objects.filter(customer=user, ticket_type='BILLING').count()
        
        # 2. PAYMENT REQUEST
        pay_request = factory.post('/api/payments/', {
            'user': user.id,
            'invoice': inv.id,
            'amount': float(inv.amount),
            'payment_method': 'CREDIT_CARD'
        }, format='json')
        force_authenticate(pay_request, user=user)
        
        pay_view = PaymentViewSet.as_view({'post': 'create'})
        pay_response = pay_view(pay_request)
        print('\n[Step 2] Payment API Response:', pay_response.data)

        # 3. VERIFICATION
        inv.refresh_from_db()
        sub.refresh_from_db()
        final_tickets = Ticket.objects.filter(customer=user, ticket_type='BILLING').count()

        print('\n--- VERIFICATION ---')
        print(f'Invoice Status: {inv.status} (Expected: PAID)')
        print(f'Subscription Plan: {sub.plan.name} (Expected: {new_plan.name})')
        print(f'New Admin Tickets: {final_tickets - initial_tickets} (Expected: 1)')
        
        if inv.status == 'PAID' and sub.plan.id == new_plan.id:
            print('VERIFICATION: SUCCESS')
        else:
            print('VERIFICATION: FAILED')

        # Cleanup test
        inv.delete()
        if sub.plan.id == new_plan.id:
            sub.plan = old_plan
            sub.save()
            print('Reverted subscription back to normal.')

except Exception as e:
    import traceback
    traceback.print_exc()
