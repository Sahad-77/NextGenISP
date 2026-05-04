from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# 0. Master Data (Area/Zone Management)
class Area(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, help_text="Unique Zone Code e.g., KOC-01")
    city = models.CharField(max_length=100, default='Kochi')
    description = models.TextField(blank=True)
    coordinates = models.TextField(blank=True, null=True, help_text="JSON list of [lat, lng] points for polygon")
    is_under_maintenance = models.BooleanField(default=False, help_text="Toggle to show maintenance warning to users")
    maintenance_message = models.CharField(max_length=255, blank=True, null=True, help_text="Specific warning message (e.g. Fiber cut, ETA 2 hours)")

    def __str__(self):
        return f"{self.name} ({self.code})"

# 1. User Management
class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        TECHNICAL_STAFF = 'TECHNICAL_STAFF', 'Technical Staff'
        FIELD_STAFF = 'FIELD_STAFF', 'Field Staff'
        CUSTOMER = 'CUSTOMER', 'Customer'

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CUSTOMER)
    
    # Status for Customer Onboarding
    class Status(models.TextChoices):
        LEAD = 'LEAD', 'Lead (Pending)'
        VERIFIED = 'VERIFIED', 'Verified (Select Plan)'
        READY_TO_INSTALL = 'READY_TO_INSTALL', 'Ready to Install'
        INSTALLATION_PENDING = 'INSTALLATION_PENDING', 'Installation Pending'
        ACTIVE = 'ACTIVE', 'Active'
        SUSPENDED = 'SUSPENDED', 'Suspended'
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    area = models.ForeignKey('Area', on_delete=models.SET_NULL, null=True, blank=True)
    id_proof = models.ImageField(upload_to='id_proofs/', null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    # Geo-location for Network Map
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

# 2. Plans
class Plan(models.Model):
    class PlanType(models.TextChoices):
        FIBER = 'FIBER', 'Fiber'
        WIRELESS = 'WIRELESS', 'Wireless'

    name = models.CharField(max_length=100)
    hero_tagline = models.CharField(max_length=200, blank=True, null=True, help_text="Catchy marketing phrase (e.g. Unstoppable Gaming Speed)")
    speed_mbps = models.IntegerField(help_text="Speed in Mbps")
    data_limit_gb = models.IntegerField(default=1000, help_text="Monthly Data Limit (FUP)")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    plan_type = models.CharField(max_length=10, choices=PlanType.choices, default=PlanType.FIBER)
    areas = models.ManyToManyField('Area', related_name='plans')
    features = models.TextField(blank=True, null=True, help_text="Comma-separated list of benefits")
    description = models.TextField(blank=True)
    recommended_hardware = models.ManyToManyField('Hardware', blank=True, related_name='recommended_for_plans', help_text="Hardware suggested for this plan")

    def __str__(self):
        return f"{self.name} - {self.price}"

# 3. Subscriptions
class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        SUSPENDED = 'SUSPENDED', 'Suspended'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    billing_cycle = models.CharField(max_length=20, default='MONTHLY') 

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"

# 4. Billing & Payments
class Invoice(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        OVERDUE = 'OVERDUE', 'Overdue'

    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=200, default="Monthly Subscription Charge")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    upgrade_to_plan = models.ForeignKey('Plan', on_delete=models.SET_NULL, null=True, blank=True, help_text="If set, paying this invoice upgrades the subscription to this plan")

    def __str__(self):
        return f"Invoice #{self.id} - {self.status}"

class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE)
    transaction_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=50, default='ONLINE') # 'CASH', 'ONLINE'

    def __str__(self):
        return f"Payment {self.transaction_id}"

class PromoCode(models.Model):
    code = models.CharField(max_length=20, unique=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    valid_from = models.DateField()
    valid_until = models.DateField()
    is_active = models.BooleanField(default=True)
    usage_limit = models.IntegerField(default=100)
    used_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.code} (-{self.discount_amount})"

# 5. CRM (Ticketing)
class Ticket(models.Model):
    class Type(models.TextChoices):
        LOGICAL = 'LOGICAL', 'Logical (Speed/Billing)'
        PHYSICAL = 'PHYSICAL', 'Physical (Wire Cut/Device)'
        INSTALLATION = 'INSTALLATION', 'New Installation'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets_created')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets_assigned')
    
    ticket_type = models.CharField(max_length=20, choices=Type.choices)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"#{self.id} {self.subject} ({self.status})"

class ChatMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.message[:20]}"

# 6. Installation Task
class InstallationTask(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        PHYSICAL_COMPLETED = 'PHYSICAL_COMPLETED', 'Physical Completed'
        CLOSED = 'CLOSED', 'Closed'

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='installation_tasks')
    assigned_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_installations', help_text="Field Staff")
    assigned_technical_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_technical_installations', help_text="Technical Staff")
    
    # New Fields for Enhanced Staff Assignment Flow
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, help_text="Selected Internet Plan")
    hardware = models.ForeignKey('Hardware', on_delete=models.SET_NULL, null=True, blank=True, help_text="Selected Company Router")
    own_router_model = models.CharField(max_length=100, blank=True, null=True, help_text="Model if customer brings own router")
    own_router_mac = models.CharField(max_length=50, blank=True, null=True, help_text="MAC if customer brings own router")
    own_router_image = models.ImageField(upload_to='customer_routers/', null=True, blank=True)

    is_router_required = models.BooleanField(default=True, help_text="Did customer choose to buy router?")
    one_time_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    router_mac = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Install {self.customer.username} - {self.status}"

# 7. Customer Enquiries (Public)
class Enquiry(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        CONTACTED = 'CONTACTED', 'Contacted'
        CONVERTED = 'CONVERTED', 'Converted to Lead'
        CLOSED = 'CLOSED', 'Closed'

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    subject = models.CharField(max_length=200, default='General Inquiry')
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_enquiries')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Enquiry from {self.name} ({self.status})"

# 8. Hardware & Inventory
class Hardware(models.Model):
    name = models.CharField(max_length=100)
    hero_tagline = models.CharField(max_length=200, blank=True, null=True, help_text="Short catchy slogan for the router")
    description = models.TextField(help_text="General description")
    features = models.TextField(blank=True, null=True, help_text="Comma-separated or JSON list of key features (e.g. Wi-Fi 6, Dual-Band)")
    specifications = models.TextField(blank=True, null=True, help_text="JSON format of specs (e.g. {'Antennas': '4', 'Ports': '4 Gigabit'})")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='hardware/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class InventoryItem(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    quantity = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    low_stock_threshold = models.IntegerField(default=5)
    category = models.CharField(max_length=50, default='ROUTER') # ROUTER, CABLE, CONNECTOR

    def __str__(self):
        return f"{self.name} (Qty: {self.quantity})"

class AssetAssignment(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.PROTECT)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    serial_number = models.CharField(max_length=100, help_text="Specific Device Serial Number")
    assigned_date = models.DateField(auto_now_add=True)
    is_returned = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.item.name} -> {self.user.username} ({self.serial_number})"
