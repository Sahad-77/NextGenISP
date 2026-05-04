from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Area, Plan, Subscription, Invoice, Payment, Ticket, InstallationTask, Enquiry, Hardware, InventoryItem, AssetAssignment, PromoCode, ChatMessage

User = get_user_model()

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['sender', 'created_at']

class AssetAssignmentSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = AssetAssignment
        fields = '__all__'

class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = '__all__'

    def get_customer_name(self, obj):
        return obj.subscription.user.username if obj.subscription else "Ad-hoc User"

    def get_plan_name(self, obj):
        return obj.subscription.plan.name if obj.subscription else obj.description

class PaymentSerializer(serializers.ModelSerializer):
    invoice_details = InvoiceSerializer(source='invoice', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'

class HardwareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hardware
        fields = '__all__'

class EnquirySerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    class Meta:
        model = Enquiry
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    customer_address = serializers.CharField(source='customer.address', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['customer']

class AreaSerializer(serializers.ModelSerializer):
    customer_count = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = '__all__'
    
    def get_customer_count(self, obj):
        # Count all CUSTOMER role users assigned to this area
        return User.objects.filter(area=obj, role='CUSTOMER').count()

class InstallationTaskSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    technical_staff_name = serializers.SerializerMethodField()

    class Meta:
        model = InstallationTask
        fields = '__all__'

    def get_technical_staff_name(self, obj):
        return obj.assigned_technical_staff.username if obj.assigned_technical_staff else None

class PlanSerializer(serializers.ModelSerializer):
    areas = AreaSerializer(many=True, read_only=True)
    area_ids = serializers.PrimaryKeyRelatedField(source='areas', many=True, queryset=Area.objects.all(), write_only=True)

    class Meta:
        model = Plan
        fields = ['id', 'name', 'speed_mbps', 'data_limit_gb', 'price', 'plan_type', 'description', 'areas', 'area_ids']

class UserSerializer(serializers.ModelSerializer):
    area_details = AreaSerializer(source='area', read_only=True)
    area = serializers.PrimaryKeyRelatedField(queryset=Area.objects.all(), write_only=True, required=False)
    has_open_ticket = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'phone_number', 'address', 'password', 'area', 'area_details', 'status', 'id_proof', 'profile_picture', 'latitude', 'longitude', 'date_joined', 'has_open_ticket']
        extra_kwargs = {'password': {'write_only': True}}

    def get_has_open_ticket(self, obj):
        from .models import Ticket
        return Ticket.objects.filter(customer=obj, status__in=['OPEN', 'IN_PROGRESS']).exists()

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'phone_number', 'address', 'area', 'password', 'id_proof']
    
    def create(self, validated_data):
        validated_data['role'] = 'CUSTOMER'
        validated_data['status'] = 'LEAD' # Pending verification
        user = User.objects.create_user(**validated_data)
        return user
