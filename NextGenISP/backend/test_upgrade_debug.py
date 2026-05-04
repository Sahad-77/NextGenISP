import os, django, sys
sys.stdout = open('trace_output.txt', 'w', encoding='utf-8')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_core.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from api.models import User, Plan, Subscription, Invoice, Ticket
from api.views import UserViewSet, PaymentViewSet

user = User.objects.filter(username='anzalna').first()
sub = Subscription.objects.filter(user=user, status='ACTIVE').first()

old_plan = sub.plan
new_plan = Plan.objects.exclude(id=sub.plan.id).filter(price__gt=sub.plan.price).first()

print(f'\n--- UPGRADE TEST START ---')

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
        print('\n--- VERIFICATION ---')
        print(f'Invoice Status: {inv.status}')
        print(f'Subscription Plan: {sub.plan.name}')
        
        # Cleanup
        inv.delete()
        if sub.plan.id == new_plan.id:
            sub.plan = old_plan
            sub.save()

except Exception as e:
    import traceback
    traceback.print_exc()
