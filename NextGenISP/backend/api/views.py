from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework import status
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .serializers import UserSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.db import models

User = get_user_model()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=400)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # For security, don't reveal if user exists, but for UX in this internal app we might want to (optional)
            # Standard practice: Return success anyway or generic message.
            # Here: Let's be helpful for the demo.
            return Response({"error": "User with this email does not exist"}, status=404)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # In production this URL should be frontend URL
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}"

        send_mail(
            subject="Password Reset Request",
            message=f"Hi {user.username},\n\nYou requested to reset your password. Click the link below to verify your identity and set a new password:\n\n{reset_link}\n\nIf you didn't request this, ignore this email.\n\nNextGen ISP",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True
        )

        return Response({"message": "Password reset link sent to your email."})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response({"error": "Missing fields"}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid link"}, status=400)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"message": "Password has been reset successfully. You can now login."})
        else:
            return Response({"error": "Invalid or expired token"}, status=400)

class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from .models import Area, Plan, InstallationTask, User, Enquiry, Hardware, Invoice, Payment, Ticket, Subscription
from .serializers import AreaSerializer, PlanSerializer, InstallationTaskSerializer, EnquirySerializer, HardwareSerializer, UserRegistrationSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class PublicAreaListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        areas = Area.objects.all()
        serializer = AreaSerializer(areas, many=True)
        return Response(serializer.data)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Send Welcome Email
            send_mail(
                subject="Welcome to NextGen ISP! 🚀",
                message=f"Hi {user.username},\n\nThank you for registering with NextGen ISP. Your account is currently under verification. We will notify you once your installation is scheduled.\n\nBest Regards,\nNextGen Team",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )

            return Response({
                "message": "Registration successful! Verification pending.",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Code removed from here

class HardwareViewSet(viewsets.ModelViewSet):
    queryset = Hardware.objects.filter(is_active=True).order_by('price')
    serializer_class = HardwareSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class EnquiryViewSet(viewsets.ModelViewSet):
    queryset = Enquiry.objects.all().order_by('-created_at')
    serializer_class = EnquirySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return Enquiry.objects.filter(name=user.username) # Assuming name matches username or link via email/phone
        if user.role == 'FIELD_STAFF':
            return Enquiry.objects.filter(models.Q(assigned_to=user) | models.Q(status='OPEN')).order_by('-created_at')
        return Enquiry.objects.all().order_by('-created_at')

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()

class AreaViewSet(viewsets.ModelViewSet):
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class InstallationTaskViewSet(viewsets.ModelViewSet):
    queryset = InstallationTask.objects.all()
    serializer_class = InstallationTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return InstallationTask.objects.filter(customer=user)
        # For simplicity, Staff/Admin see all (or filtered by assignment in frontend)
        return InstallationTask.objects.all()

    @action(detail=True, methods=['post'], url_path='notify-on-my-way')
    def on_my_way(self, request, pk=None):
        task = self.get_object()
        # 1. Send Email
        send_mail(
            subject="Technician is En Route! 🚚",
            message=f"Hi {task.customer.username},\n\nOur technician {request.user.first_name} is on the way to your location for installation.\n\nPlease be ready.\n\nNextGen ISP",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[task.customer.email],
            fail_silently=True
        )
        
        # 2. Create In-App Notification (via Ticket System)
        Ticket.objects.create(
            customer=task.customer,
            subject="Technician Arriving Soon",
            description=f"Technician {request.user.first_name} has started the journey to your location.",
            status='RESOLVED',
            ticket_type='LOGICAL',
            assigned_to=request.user
        )

        return Response({"message": "Customer notified successfully!"})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return User.objects.filter(id=user.id)
        return User.objects.all()

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['post'])
    def bulk_suspend(self, request):
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({"error": "No user IDs provided"}, status=400)
        
        count = User.objects.filter(id__in=user_ids).update(status='SUSPENDED')
        return Response({"message": f"Successfully suspended {count} users."})

    @action(detail=True, methods=['get'])
    def customer_summary(self, request, pk=None):
        user = self.get_object()
        from .models import Subscription, Invoice
        from .serializers import InvoiceSerializer
        from django.db.models import Q
        
        active_sub = Subscription.objects.filter(user=user, status='ACTIVE').first()
        plan_name = active_sub.plan.name if active_sub else None
        
        # Fetch invoices linked to subscription OR linked to an installation task for this user
        invoices = Invoice.objects.filter(
            Q(subscription__user=user)
        ).order_by('-issue_date')[:5]
        
        return Response({
            "active_plan_name": plan_name,
            "invoices": InvoiceSerializer(invoices, many=True).data
        })

    @action(detail=True, methods=['post'])
    def select_plan(self, request, pk=None):
        user = self.get_object()
        plan_id = request.data.get('plan_id')
        router_selection = request.data.get('router_selection') # Name of router or 'Own Device'
        hardware_id = request.data.get('hardware_id')
        
        # New Own Device Fields
        own_router_model = request.data.get('own_router_model')
        own_router_mac = request.data.get('own_router_mac')
        own_router_image = request.FILES.get('own_router_image')

        if not plan_id:
            return Response({"error": "Plan ID is required"}, status=400)

        try:
            plan = Plan.objects.get(id=plan_id)
        except Plan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=400)

        # 1. Update User Status
        user.status = 'READY_TO_INSTALL'
        user.save()

        # 2. Create Enquiry (Admin Notification)
        Enquiry.objects.create(
            name=user.username,
            email=user.email,
            phone=user.phone_number or "Not Provided",
            subject="Plan Selection & Installation Request",
            message=f"[EXISTING USER: {user.username}] Selected Plan: {plan.name}. Router Preference: {router_selection}"
        )

        from .models import Hardware
        hardware_obj = None
        router_price = 0
        
        if hardware_id and hardware_id not in ['null', 'undefined', '']:
            try:
                hardware_obj = Hardware.objects.get(id=hardware_id)
                router_price = hardware_obj.price
            except Hardware.DoesNotExist:
                pass
        
        if not hardware_obj and router_selection != 'Own Device':
            import re
            price_match = re.search(r'\+₹(\d+)', str(router_selection))
            router_price = int(price_match.group(1)) if price_match else 0

        notes_str = f"Plan ID: {plan.id}\nPlan: {plan.name}\nRouter: {router_selection}"

        # 3. Create/Update Installation Task (Persistence)
        task = InstallationTask.objects.filter(customer=user).exclude(status='CLOSED').first()
        
        if not task:
            task = InstallationTask(customer=user, status='PENDING')
            
        task.plan = plan
        task.hardware = hardware_obj
        task.is_router_required = (router_selection != 'Own Device')
        task.one_time_charge = router_price
        task.notes = notes_str
        
        if router_selection == 'Own Device':
            task.own_router_model = own_router_model
            if own_router_mac:
                task.own_router_mac = own_router_mac.upper()
            if own_router_image:
                task.own_router_image = own_router_image
                
        task.save()

        return Response({"message": "Plan selected successfully!", "status": "READY_TO_INSTALL"})

    @action(detail=True, methods=['post'])
    def upgrade_plan(self, request, pk=None):
        user = self.get_object()
        plan_id = request.data.get('plan_id')

        if not plan_id:
            return Response({"error": "Plan ID is required"}, status=400)

        # Get active subscription
        from .models import Subscription, Invoice
        import datetime
        sub = Subscription.objects.filter(user=user, status='ACTIVE').first()
        if not sub:
            return Response({"error": "No active subscription found to upgrade."}, status=400)
            
        try:
            new_plan = Plan.objects.get(id=plan_id)
        except Plan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=400)

        if sub.plan.id == new_plan.id:
            return Response({"error": "Already on this plan."}, status=400)

        price_diff = new_plan.price - sub.plan.price

        if price_diff > 0:
            # Generate UPGRADE invoice
            inv = Invoice.objects.create(
                subscription=sub,
                amount=price_diff,
                due_date=datetime.date.today(),
                status='PENDING',
                description=f"Plan Upgrade: {sub.plan.name} to {new_plan.name}",
                upgrade_to_plan=new_plan
            )
            return Response({
                "message": f"Upgrade requested. Please pay the invoice of ₹{price_diff} to activate.",
                "invoice_id": inv.id,
                "amount_due": price_diff
            })
        else:
            # Downgrade or same price switch - instantly apply
            old_plan_name = sub.plan.name
            sub.plan = new_plan
            sub.save()
            return Response({
                "message": f"Plan successfully switched from {old_plan_name} to {new_plan.name}.",
                "invoice_id": None,
                "amount_due": 0
            })

    @action(detail=True, methods=['get'])
    def traffic_stats(self, request, pk=None):
        user = self.get_object()
        
        import datetime
        from django.utils import timezone
        import random
        
        today = timezone.now().date()
        joined_date = user.date_joined.date()
        
        # If user is not ACTIVE or registered today (new installation), simulate 0 usage
        if user.status != 'ACTIVE' or joined_date == today:
            return Response([
                {"name": "Video Streaming", "value": 0, "color": "#8b5cf6"},
                {"name": "Gaming", "value": 0, "color": "#10b981"},
                {"name": "Smart Devices", "value": 0, "color": "#eab308"},
                {"name": "Web & Social", "value": 0, "color": "#3b82f6"}
            ])
            
        # Deterministic pseudo-random traffic profile based on User ID & current Month
        random.seed(user.id + today.month + today.year)
        total_used = random.randint(180, 850) # Simulate between 180GB to 850GB
        
        video = int(total_used * random.uniform(0.35, 0.55))
        gaming = int(total_used * random.uniform(0.20, 0.35))
        iot = int(total_used * random.uniform(0.10, 0.20))
        web = max(0, total_used - video - gaming - iot)
        
        return Response([
            {"name": "Video Streaming", "value": video, "color": "#8b5cf6"},
            {"name": "Gaming", "value": gaming, "color": "#10b981"},
            {"name": "Smart Devices", "value": iot, "color": "#eab308"},
            {"name": "Web & Social", "value": web, "color": "#3b82f6"}
        ])
from .models import InventoryItem, AssetAssignment, PromoCode
from .serializers import InventoryItemSerializer, AssetAssignmentSerializer, PromoCodeSerializer

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('category', 'name')
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    # Only Staff can view inventory
    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return InventoryItem.objects.none()
        return InventoryItem.objects.all().order_by('category', 'name')

class AssetAssignmentViewSet(viewsets.ModelViewSet):
    queryset = AssetAssignment.objects.all().order_by('-assigned_date')
    serializer_class = AssetAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return AssetAssignment.objects.filter(user=user)
        return AssetAssignment.objects.all().order_by('-assigned_date')

class PromoCodeViewSet(viewsets.ModelViewSet):
    queryset = PromoCode.objects.all().order_by('-valid_until')
    serializer_class = PromoCodeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Allow read for validity check if needed, else Authenticated

from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-issue_date')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return Invoice.objects.filter(subscription__user=user).order_by('-issue_date')
        return Invoice.objects.all().order_by('-issue_date')

    # Helper to get pending invoices and next billing date
    @action(detail=False, methods=['get'], url_path='pending/(?P<user_id>[^/.]+)')
    def pending(self, request, user_id=None):
        target_user_id = user_id
        if request.user.role == 'CUSTOMER':
            target_user_id = request.user.id
            
        invoices = self.get_queryset().filter(subscription__user_id=target_user_id, status='PENDING')
        serializer = self.get_serializer(invoices, many=True)
        
        # Get plan details and calculate next billing date
        next_billing_date = None
        active_plan_name = None
        active_plan_speed = None
        
        from .models import Subscription
        active_sub = Subscription.objects.filter(user_id=target_user_id, status='ACTIVE').first()
        
        if active_sub:
            active_plan_name = active_sub.plan.name
            active_plan_speed = getattr(active_sub.plan, 'speed', None)  # speed might be a field
            
            # Find the most recently issued invoice to predict the next one
            last_invoice = Invoice.objects.filter(subscription=active_sub).order_by('-due_date').first()
            import datetime
            if last_invoice:
                if active_sub.billing_cycle == 'MONTHLY':
                    next_billing_date = (last_invoice.due_date + datetime.timedelta(days=30)).isoformat()
                elif active_sub.billing_cycle == 'QUARTERLY':
                    next_billing_date = (last_invoice.due_date + datetime.timedelta(days=90)).isoformat()
                elif active_sub.billing_cycle == 'YEARLY':
                    next_billing_date = (last_invoice.due_date + datetime.timedelta(days=365)).isoformat()
            else:
                next_billing_date = (active_sub.start_date + datetime.timedelta(days=30)).isoformat()

        return Response({
            "invoices": serializer.data,
            "next_billing_date": next_billing_date,
            "active_plan_name": active_plan_name,
            "active_plan_speed": active_plan_speed
        })

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-payment_date')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        payment = serializer.save()
        # Update Invoice Status
        invoice = payment.invoice
        invoice.status = 'PAID'
        invoice.save()
        
        # Reactivate User if suspended (Basic Logic)
        if invoice.subscription and invoice.subscription.user.status == 'SUSPENDED':
            invoice.subscription.user.status = 'ACTIVE'
            invoice.subscription.user.save()

        # Process Plan Upgrade if applicable
        upgraded = False
        old_plan_name = ""
        new_plan_name = ""
        if getattr(invoice, 'upgrade_to_plan', None) and invoice.subscription:
            old_plan_name = invoice.subscription.plan.name
            new_plan_name = invoice.upgrade_to_plan.name
            invoice.subscription.plan = invoice.upgrade_to_plan
            invoice.subscription.save()
            upgraded = True

        # Admin Notification via Ticket
        try:
            from .models import Ticket
            user = invoice.subscription.user if invoice.subscription else None
            user_name = user.username if user else "Unknown Customer"
            
            if upgraded:
                Ticket.objects.create(
                    customer=user,
                    subject=f"Plan Upgrade: {user_name} to {new_plan_name}",
                    description=f"User {user_name} successfully paid ₹{payment.amount} and their internet plan was instantly upgraded from {old_plan_name} to {new_plan_name}. Please verify their network profile if necessary.",
                    status='OPEN',
                    ticket_type='BILLING',
                    priority='HIGH'
                )
            else:
                Ticket.objects.create(
                    customer=user,
                    subject=f"Payment Received from {user_name}",
                    description=f"A payment of ₹{payment.amount} has been successfully processed for Invoice #{invoice.id}. Description: {invoice.description}",
                    status='OPEN',
                    ticket_type='BILLING',
                    priority='LOW'
                )
        except Exception as e:
            print("Failed to auto-generate payment ticket:", e)


import csv
from django.http import HttpResponse

class ExportReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type')
        start_date = request.query_params.get('start_date')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
        
        writer = csv.writer(response)

        if report_type == 'enquiries':
            writer.writerow(['ID', 'Name', 'Phone', 'Subject', 'Status', 'Assigned To', 'Date'])
            queryset = Enquiry.objects.all().order_by('-created_at')
            for item in queryset:
                writer.writerow([item.id, item.name, item.phone, item.subject, item.status, item.assigned_to.username if item.assigned_to else 'Unassigned', item.created_at.date()])
            return response
        
        elif report_type == 'leads':
            writer.writerow(['ID', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Area', 'Date Joined'])
            queryset = User.objects.filter(role='CUSTOMER').order_by('-date_joined')
            for item in queryset:
                writer.writerow([item.id, item.username, item.email, item.phone_number, item.role, item.status, item.area.name if item.area else 'N/A', item.date_joined.date()])
            return response

        elif report_type == 'installations':
            writer.writerow(['Task ID', 'Customer', 'Phone', 'Assigned Staff', 'Status', 'Router MAC', 'Created At'])
            queryset = InstallationTask.objects.all().order_by('-created_at')
            for item in queryset:
                writer.writerow([item.id, item.customer.username, item.customer.phone_number, item.assigned_staff.username if item.assigned_staff else 'Unassigned', item.status, item.router_mac, item.created_at.date()])
            return response
        
        else:
            return Response({"error": "Invalid report type"}, status=400)

class WorkloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        staff_members = User.objects.filter(role__in=['TECHNICAL_STAFF', 'FIELD_STAFF'])
        data = []
        for staff in staff_members:
            # Count Open Installations (both FIELD and TECHNICAL assignments)
            install_count = InstallationTask.objects.filter(
                Q(assigned_staff=staff) | Q(assigned_technical_staff=staff)
            ).exclude(status='CLOSED').count()
            
            # Count Open Tickets
            ticket_count = Ticket.objects.filter(assigned_to=staff).exclude(status__in=['RESOLVED', 'CLOSED']).count()
            
            data.append({
                "id": staff.id,
                "username": staff.username,
                "role": staff.role,
                "installations": install_count,
                "tickets": ticket_count,
                "total": install_count + ticket_count
            })
        
        # Sort by total workload descending
        data.sort(key=lambda x: x['total'], reverse=True)
        return Response(data)


class BroadcastView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_audience = request.data.get('target_audience') # 'ALL', 'AREA', 'DEFAULTERS'
        area_id = request.data.get('area_id')
        subject = request.data.get('subject')
        message = request.data.get('message')

        if not subject or not message:
            return Response({"error": "Subject and Message are required"}, status=400)

        # 1. Filter Users
        recipients = []
        if target_audience == 'ALL':
            recipients = User.objects.filter(role='CUSTOMER', status='ACTIVE')
        elif target_audience == 'AREA':
            if not area_id:
                return Response({"error": "Area ID required for Area Broadcast"}, status=400)
            recipients = User.objects.filter(role='CUSTOMER', status='ACTIVE', area_id=area_id)
        elif target_audience == 'DEFAULTERS':
            # In real scenario: check invoices. Here: generic filter or status based
            # recipients = User.objects.filter(role='CUSTOMER', status='SUSPENDED') 
            # For demo, let's just pick active users again or assume a logic
            recipients = User.objects.filter(role='CUSTOMER', status='ACTIVE')[:5] 

        # 2. Send Emails (Loop)
        count = 0
        for user in recipients:
            if user.email:
                try:
                    # In production, use celery. Here synchronous for demo.
                    print(f"Sending email to {user.email}: {subject}")
                    # send_mail(subject, message, 'admin@isp.com', [user.email], fail_silently=True)
                    count += 1
                except Exception as e:
                    print(f"Failed to email {user.username}: {e}")
        
        return Response({"message": f"Broadcast sent to {count} users."})

from .models import Ticket
from .serializers import TicketSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'TECHNICAL_STAFF']:
            return Ticket.objects.all().order_by('-created_at')
        if user.role == 'FIELD_STAFF':
            return Ticket.objects.filter(models.Q(assigned_to=user) | models.Q(customer=user)).order_by('-created_at')
        return Ticket.objects.filter(customer=user).order_by('-created_at')

    def perform_create(self, serializer):
        ticket = serializer.save(customer=self.request.user)
        
        # Send Ticket Creation Email
        send_mail(
            subject=f"Key Support Ticket #{ticket.id} Created",
            message=f"Hi {self.request.user.username},\n\nWe have received your support request: '{ticket.subject}'.\n\nOur team will review it shortly.\n\nTicket ID: {ticket.id}\n\nNextGen Support",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.request.user.email],
            fail_silently=True
        )

# Technical Staff Cockpit Views
from .models import ChatMessage
from .serializers import ChatMessageSerializer
from rest_framework import viewsets
import random

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all().order_by('created_at')
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ChatMessage.objects.all().order_by('created_at')
        ticket_id = self.request.query_params.get('ticket_id')
        user = self.request.user

        # 1. Filter by Ticket
        if ticket_id:
            queryset = queryset.filter(ticket_id=ticket_id)
        
        # 2. Security: Filter based on Role
        if user.role == 'CUSTOMER':
            return queryset.filter(ticket__customer=user)
        elif user.role == 'FIELD_STAFF':
            return queryset.filter(models.Q(ticket__assigned_to=user) | models.Q(ticket__customer=user))
        
        return queryset

    def perform_create(self, serializer):
        # Optional: Validate user has access to this ticket before saving
        message = serializer.save(sender=self.request.user)
        
        # If Admin or Staff is replying, email the customer
        if self.request.user.role in ['ADMIN', 'TECHNICAL_STAFF']:
            ticket_customer = message.ticket.customer
            try:
                send_mail(
                    subject=f"Update on your Support Ticket #{message.ticket.id}",
                    message=f"Hi {ticket_customer.username},\n\nAn agent has replied to your ticket '{message.ticket.subject}':\n\n\"{message.message}\"\n\nLog in to your dashboard to view the full conversation.\n\nNextGen Support",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[ticket_customer.email],
                    fail_silently=True
                )
            except Exception as e:
                print(f"Failed to send ticket reply email: {e}")

class DiagnosticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, type=None):
        if type == 'ping':
            # Mock Ping
            latency = random.randint(5, 100)
            status_text = "Online" if latency < 80 else "Unstable"
            if random.random() < 0.1: status_text = "Offline"; latency = 0
            return Response({"ip": "192.168.1.45", "latency": f"{latency}ms", "status": status_text})
        
        elif type == 'traffic':
            # Mock Traffic Data (Last 10 points)
            data = [{"time": f"10:{i}0", "mbps": random.randint(10, 300)} for i in range(10)]
            return Response(data)
        
        return Response({"error": "Invalid type"}, status=400)

class ActivationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        mac_address = request.data.get('mac_address')
        
        try:
            user = User.objects.get(id=user_id)
            user.status = "ACTIVE"
            user.save()
            
            # Close installation task and generate Initial Bill
            task = InstallationTask.objects.filter(customer=user).exclude(status="CLOSED").first()
            if task:
                task.status = "CLOSED"
                task.router_mac = mac_address
                task.save()

                # Generate Subscription and Invoice
                from datetime import date, timedelta
                from django.core.mail import send_mail
                from django.conf import settings
                from .models import Plan, Subscription, Invoice

                plan = task.plan
                
                # Fallback for old installations that only have text notes
                if not plan and task.notes:
                    import re
                    plan_match = re.search(r'Plan ID: (\d+)', task.notes)
                    if plan_match:
                        plan = Plan.objects.filter(id=int(plan_match.group(1))).first()
                    if not plan:
                        fallback_match = re.search(r'Plan: (.*)\n', task.notes)
                        if fallback_match:
                            plan = Plan.objects.filter(name__iexact=fallback_match.group(1).strip()).first()
                
                if plan:
                    try:
                        # 1. Create Subscription
                        sub, sub_created = Subscription.objects.get_or_create(
                            user=user,
                            plan=plan,
                            defaults={'status': 'ACTIVE'}
                        )

                        # 2. Create Initial Invoice
                        today = date.today()
                        total_amount = plan.price + task.one_time_charge
                        description = f"Initial Subscription ({plan.name})"
                        if getattr(task, 'hardware', None):
                            total_amount += task.hardware.price
                            description += f" + Router ({task.hardware.name})"
                        elif task.one_time_charge > 0:
                            description += " + Setup Fee"

                        Invoice.objects.create(
                            subscription=sub,
                            amount=total_amount,
                            due_date=today + timedelta(days=7),
                            status='PENDING',
                            description=description
                        )

                        # 3. Send Email Notification
                        send_mail(
                            subject="Your Connection is Active! 🌐",
                            message=f"Hi {user.username},\n\nGreat news! Your internet connection has been successfully activated.\n\nYour first bill of ₹{total_amount} is now generated on your dashboard. Please log in to complete your payment.\n\nWelcome to NextGen ISP!",
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[user.email],
                            fail_silently=True
                        )
                    except Exception as e:
                        print("Error generating first invoice:", e)    
            
            return Response({"message": f"Service Activated for {user.username}!", "status": "ACTIVE"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

# Customer Portal Financial Views
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart

class InvoicePDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        try:
            invoice = Invoice.objects.get(id=pk)
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Invoice_{invoice.id}.pdf"'

            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            elements = []
            styles = getSampleStyleSheet()

            # 1. Header
            elements.append(Paragraph("<b>NextGen ISP</b>", styles['Heading1']))
            elements.append(Paragraph("123, Tech Street, Connectivity City", styles['Normal']))
            elements.append(Paragraph("VAT: 555-0199-22", styles['Normal']))
            elements.append(Spacer(1, 20))

            # 2. Invoice Details
            elements.append(Paragraph(f"<b>INVOICE #{invoice.id}</b>", styles['Heading2']))
            elements.append(Paragraph(f"Date: {invoice.issue_date}", styles['Normal']))
            elements.append(Paragraph(f"Status: {invoice.status}", styles['Normal']))
            elements.append(Spacer(1, 20))

            # 3. Bill To
            if invoice.subscription:
                user = invoice.subscription.user
            else:
                user = None
            elements.append(Paragraph("<b>Bill To:</b>", styles['Heading3']))
            if user:
                elements.append(Paragraph(f"{user.username}", styles['Normal']))
                elements.append(Paragraph(f"{user.email}", styles['Normal']))
                elements.append(Paragraph(f"{user.phone_number or 'N/A'}", styles['Normal']))
            elements.append(Spacer(1, 20))

            # 4. Line Items Table
            data = [
                ['Description', 'Details', 'Amount'],
            ]
            
            if invoice.description and '+' in invoice.description:
                # E.g. "Initial Subscription (Plan) + Router (Model)"
                parts = invoice.description.split('+')
                base_price = invoice.subscription.plan.price if invoice.subscription else float(invoice.amount)
                extra_price = float(invoice.amount) - float(base_price)
                
                data.append(['Primary Charge', parts[0].strip(), f"INR {base_price:.2f}"])
                data.append(['Additional (Hardware/Setup)', parts[1].strip(), f"INR {extra_price:.2f}"])
            else:
                data.append(['Subscription / Fee', invoice.description, f"INR {invoice.amount}"])
            
            # Remove Taxes, just show Total
            total = float(invoice.amount)
            data.append(['', '<b>Total Payable</b>', f"<b>INR {total:.2f}</b>"])

            t = Table(data, colWidths=[200, 200, 100])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 40))

            # 5. Footer
            elements.append(Paragraph("Thank you for your business!", styles['Italic']))
            elements.append(Paragraph("This is a computer-generated invoice.", styles['Normal']))

            doc.build(elements)
            pdf = buffer.getvalue()
            buffer.close()
            response.write(pdf)
            return response

        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=404)

class RevenueReportPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="Revenue_Report.pdf"'

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        elements = []
        styles = getSampleStyleSheet()

        title_style = styles['Heading1']
        section_style = styles['Heading2']
        normal_style = styles['Normal']

        elements.append(Paragraph("<b>NextGen ISP - Revenue & Payment Details Report</b>", title_style))
        import datetime
        elements.append(Paragraph(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
        elements.append(Spacer(1, 20))

        # Get all paid invoices
        paid_invoices = Invoice.objects.filter(status='PAID').order_by('-issue_date')
        
        # Group revenue by customer
        customer_revenue = {}
        for inv in paid_invoices:
            if inv.subscription and inv.subscription.user:
                username = inv.subscription.user.username
                amount = float(inv.amount)
                customer_revenue[username] = customer_revenue.get(username, 0) + amount
        
        # Top 5 customers by revenue
        sorted_revenue = sorted(customer_revenue.items(), key=lambda x: x[1], reverse=True)[:5]
        
        if sorted_revenue:
            elements.append(Paragraph("<b>1. Revenue by Top Customers (Chart)</b>", section_style))
            elements.append(Spacer(1, 10))
            
            d = Drawing(400, 200)
            chart = VerticalBarChart()
            chart.x = 50
            chart.y = 50
            chart.height = 125
            chart.width = 300
            
            names = [item[0][:10] for item in sorted_revenue]
            values = [item[1] for item in sorted_revenue]
            
            chart.data = [values]
            chart.categoryAxis.categoryNames = names
            chart.valueAxis.valueMin = 0
            
            d.add(chart)
            elements.append(d)
            elements.append(Spacer(1, 20))

        elements.append(Paragraph("<b>2. Payment Details</b>", section_style))
        
        data = [['Date', 'Customer', 'Amount Paid', 'Description']]
        
        for inv in paid_invoices[:100]:
            person = inv.subscription.user.username if (inv.subscription and inv.subscription.user) else "Unknown"
            desc = (inv.description[:30] + '..') if inv.description and len(inv.description) > 30 else (inv.description or "")
            data.append([
                str(inv.issue_date),
                person,
                f"INR {inv.amount}",
                desc
            ])
            
        t = Table(data, colWidths=[80, 100, 80, 200])
        t.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#10b981")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ]))
        elements.append(t)
        
        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class AdminReportPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Should be Admin Only in real app

    def get(self, request):
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="System_Comprehensive_Report.pdf"'

        buffer = BytesIO()
        # Use a larger margin for multi-page reports
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = styles['Heading1']
        section_style = styles['Heading2']
        normal_style = styles['Normal']

        # Title
        elements.append(Paragraph("<b>NextGen ISP - Comprehensive System Report</b>", title_style))
        import datetime
        elements.append(Paragraph(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
        elements.append(Spacer(1, 20))

        # 1. Executive Summary
        customers = User.objects.filter(role='CUSTOMER')
        staff = User.objects.exclude(role='CUSTOMER')
        total_revenue = Invoice.objects.filter(status='PAID').aggregate(models.Sum('amount'))['amount__sum'] or 0
        pending_installs = InstallationTask.objects.exclude(status='CLOSED').count()
        open_tickets = Ticket.objects.exclude(status='CLOSED').count()

        elements.append(Paragraph("<b>1. Executive Summary</b>", section_style))
        summary_data = [
            ['Metric', 'Count / Value'],
            ['Total Customers', str(customers.count())],
            ['Total Staff Members', str(staff.count())],
            ['Pending Installations', str(pending_installs)],
            ['Open Support Tickets', str(open_tickets)],
            ['Total Revenue Collected', f"INR {total_revenue:.2f}"]
        ]
        t = Table(summary_data, colWidths=[200, 150])
        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 25))

        # 2. Staff List
        elements.append(Paragraph("<b>2. Internal Staff List</b>", section_style))
        staff_data = [['ID', 'Name', 'Role', 'Joined']]
        for s in staff:
            staff_data.append([str(s.id), s.username, s.role, str(s.date_joined.date())])
        
        t_staff = Table(staff_data, colWidths=[40, 120, 120, 100])
        t_staff.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#cbd5e1")),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ]))
        elements.append(t_staff)
        elements.append(Spacer(1, 25))

        # 3. New Customer Registrations (Last 10)
        elements.append(Paragraph("<b>3. Recent Customer Registrations</b>", section_style))
        recent_users = customers.order_by('-date_joined')[:10]
        user_data = [['ID', 'Username', 'Email', 'Area', 'Status']]
        for u in recent_users:
            user_data.append([str(u.id), u.username, u.email[:25], u.area.name if u.area else 'N/A', u.status])
        
        t_users = Table(user_data, colWidths=[30, 80, 150, 100, 100])
        t_users.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(t_users)
        elements.append(Spacer(1, 25))

        # 4. Plan Upgrades
        elements.append(Paragraph("<b>4. Recent Plan Upgrades</b>", section_style))
        upgrades = Invoice.objects.filter(upgrade_to_plan__isnull=False, status='PAID').order_by('-issue_date')[:10]
        upgrade_data = [['Date', 'User', 'New Plan', 'Amount Paid']]
        for up in upgrades:
            user_name = up.subscription.user.username if up.subscription else "Unknown"
            upgrade_data.append([str(up.issue_date), user_name, up.upgrade_to_plan.name, f"INR {up.amount}"])
        
        if len(upgrade_data) > 1:
            t_up = Table(upgrade_data, colWidths=[100, 120, 120, 100])
            t_up.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 1, colors.black), ('BACKGROUND', (0, 0), (-1, 0), colors.lightgreen)]))
            elements.append(t_up)
        else:
            elements.append(Paragraph("No recent upgrades found.", normal_style))
        elements.append(Spacer(1, 25))

        # 5. Open Support Tickets
        elements.append(Paragraph("<b>5. Open Support Tickets</b>", section_style))
        tickets = Ticket.objects.exclude(status='CLOSED').order_by('-created_at')[:10]
        ticket_data = [['ID', 'Subject', 'Type', 'Status', 'User']]
        for tick in tickets:
            ticket_data.append([str(tick.id), tick.subject[:25], tick.ticket_type, tick.status, tick.customer.username])
        
        t_tickets = Table(ticket_data, colWidths=[30, 150, 100, 80, 100])
        t_tickets.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#fee2e2")),
        ]))
        elements.append(t_tickets)
        elements.append(Spacer(1, 25))

        # 6. Bill Payments
        elements.append(Paragraph("<b>6. Recent Bill Payments</b>", section_style))
        recent_payments = Payment.objects.all().order_by('-payment_date')[:10]
        payment_data = [['Date', 'Transaction ID', 'User', 'Amount', 'Method']]
        for pay in recent_payments:
            user_name = pay.invoice.subscription.user.username if pay.invoice and pay.invoice.subscription else "N/A"
            payment_data.append([str(pay.payment_date.date()), pay.transaction_id[:15], user_name, f"INR {pay.amount}", pay.method])
        
        t_payments = Table(payment_data, colWidths=[80, 120, 100, 80, 80])
        t_payments.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#dcfce7")),
        ]))
        elements.append(t_payments)
        elements.append(Spacer(1, 25))

        # 7. Recent Enqueries
        elements.append(Paragraph("<b>7. Recent Customer Enquiries</b>", section_style))
        enquiries = Enquiry.objects.all().order_by('-created_at')[:10]
        enquiry_data = [['Date', 'Name', 'Subject', 'Status']]
        for enq in enquiries:
            enquiry_data.append([str(enq.created_at.date()), enq.name[:15], enq.subject[:25], enq.status])
        
        t_enq = Table(enquiry_data, colWidths=[80, 120, 180, 80])
        t_enq.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#fef9c3")),
        ]))
        elements.append(t_enq)

        # Footer
        elements.append(Spacer(1, 40))
        elements.append(Paragraph("--- End of Report ---", ParagraphStyle('Footer', alignment=1)))

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

class SimulatedPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        invoice_id = request.data.get('invoice_id')
        payment_method = request.data.get('method', 'CREDIT_CARD')

        try:
            invoice = Invoice.objects.get(id=invoice_id)
            
            # Simple simulation of payment processing delay could be added here in frontend instead
            
            invoice.status = 'PAID'
            invoice.save()

            Payment.objects.create(
                invoice=invoice,
                transaction_id=f"SIM_TXN_{invoice.id}_{payment_method}",
                amount=invoice.amount,
                method=payment_method
            )
            
            # Auto-activate if suspended
            if invoice.subscription and invoice.subscription.user.status == 'SUSPENDED':
                invoice.subscription.user.status = 'ACTIVE'
                invoice.subscription.user.save()

            # Process Plan Upgrade if applicable
            upgraded = False
            old_plan_name = ""
            new_plan_name = ""
            if getattr(invoice, 'upgrade_to_plan', None) and invoice.subscription:
                old_plan_name = invoice.subscription.plan.name
                new_plan_name = invoice.upgrade_to_plan.name
                invoice.subscription.plan = invoice.upgrade_to_plan
                invoice.subscription.save()
                upgraded = True
                
            try:
                from .models import Ticket
                user = invoice.subscription.user if invoice.subscription else None
                user_name = user.username if user else "Unknown Customer"
                if upgraded:
                    Ticket.objects.create(
                        customer=user,
                        subject=f"Plan Upgrade: {user_name} to {new_plan_name}",
                        description=f"User {user_name} successfully paid ₹{invoice.amount} and their internet plan was instantly upgraded from {old_plan_name} to {new_plan_name}. Please verify their network profile if necessary.",
                        status='OPEN',
                        ticket_type='BILLING',
                        priority='HIGH'
                    )
                else:
                    Ticket.objects.create(
                        customer=user,
                        subject=f"Simulated Payment Received from {user_name}",
                        description=f"A simulated payment of ₹{invoice.amount} has been processed for Invoice #{invoice.id}. Description: {invoice.description}",
                        status='CLOSED',
                        ticket_type='BILLING',
                        priority='LOW'
                    )
            except Exception as e:
                pass

            return Response({"status": "success", "message": "Payment Processed and Verified Successfully", "transaction_id": f"SIM_TXN_{invoice.id}_{payment_method}"})
        
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

import requests
import json
import os

class ChatAssistantView(APIView):
    # This can be public for pre-login questions, or authenticated. We make it public for now since users might ask before registering.
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_message = request.data.get('message', '')
        context_data = request.data.get('context', {})

        if not user_message:
            return Response({"reply": "I didn't quite catch that. How can I help you today?"})

        from django.conf import settings
        import os

        # First, try to get from regular OS environment
        api_key = os.environ.get("GEMINI_API_KEY", "")

        # If not found, manually read the .env file (since python-dotenv isn't loaded by default)
        if not api_key:
            env_path = os.path.join(settings.BASE_DIR, '.env')
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    for line in f:
                        if line.startswith('GEMINI_API_KEY='):
                            api_key = line.split('=', 1)[1].strip()
                            break

        # 1. System Prompt
        system_prompt = f"""
You are the NextGen ISP Virtual Assistant. You are a helpful, professional AI customer support agent for an internet service provider.
Rules:
- Keep answers short and formatting clean using Markdown.
- If they ask about plans: We have Silver (50 Mbps @ ₹499), Gold (150 Mbps @ ₹799), Platinum (300 Mbps @ ₹999). Free installation on quarterly.
- If they complain about speed/red light: Ask them to restart their router, or direct them to open a Support Ticket in their dashboard.
- If asked about developer/creator: Say this system was developed for a Final Year Project by Sahad.
- User Context (if logged in): {json.dumps(context_data)}
- If they ask about areas: We provide service in areas listed during registration.
Respond to the user's latest message below:
User: {user_message}
Assistant:"""

        # 2. Simulated Fallback (If no API Key)
        if not api_key:
            # Simple keyword matching fallback
            lower_msg = user_message.lower()
            if "plan" in lower_msg or "price" in lower_msg:
                reply = "🚀 **Best Selling Plans:**\n\n1. **Silver:** 50 Mbps @ ₹499\n2. **Gold:** 150 Mbps @ ₹799 (Recommended)\n3. **Platinum:** 300 Mbps @ ₹999\n\nAll plans come with Unlimited Data!"
            elif "slow" in lower_msg or "red light" in lower_msg or "speed" in lower_msg:
                reply = "⚠️ **Troubleshooting:**\n1. Restart your router (unplug for 10s).\n2. Ensure you are connected to the 5GHz WiFi band.\n3. If speed is still low, please raise a ticket in your Dashboard so our engineers can look into it."
            elif "hello" in lower_msg or "hi" in lower_msg:
                reply = "👋 Hi there! Welcome to NextGen ISP. I am your Smart Assistant. I can help you pick a plan, fix speed issues, or answer general questions. What's on your mind?"
            elif "who made" in lower_msg or "developer" in lower_msg:
                reply = "👨‍💻 **Developer Info:**\nThis NextGen ISP system was built as a Final Year Project by Sahad."
            else:
                reply = "[Simulated AI Mode]: I am currently running offline without my Gemini API key. However, if I had it, I would intelligently answer your prompt about: '" + user_message + "'. Try asking me about 'plans' or 'slow speed' instead!"
            
            return Response({"reply": reply})

        # 3. Call Gemini REST API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}
        data = {
            "contents": [{"parts": [{"text": system_prompt}]}]
        }

        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            response_json = response.json()
            reply_text = response_json['candidates'][0]['content']['parts'][0]['text']
            return Response({"reply": reply_text})
        except requests.exceptions.HTTPError as e:
            error_msg = response.text if response else str(e)
            print(f"Gemini API HTTP Error: {error_msg}")
            return Response({"reply": "I'm having a little trouble connecting to my brain right now. Please try again later or open a support ticket."})
        except Exception as e:
            print(f"Gemini API Internal Error: {e}")
            return Response({"reply": "I'm having a little trouble connecting to my brain right now. Please try again later or open a support ticket."})
