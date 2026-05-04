from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoginView, UserMeView, AreaViewSet, PlanViewSet, InstallationTaskViewSet, UserViewSet, EnquiryViewSet, HardwareViewSet, ExportReportView, InventoryItemViewSet, AssetAssignmentViewSet, PromoCodeViewSet, InvoiceViewSet, PaymentViewSet, BroadcastView, DiagnosticsView, ActivationView, ChatMessageViewSet, InvoicePDFView, TicketViewSet, WorkloadView, RegisterView, PublicAreaListView, SimulatedPaymentView, AdminReportPDFView, RevenueReportPDFView, PasswordResetRequestView, PasswordResetConfirmView, ChatAssistantView

router = DefaultRouter()
router.register(r'areas', AreaViewSet)
router.register(r'plans', PlanViewSet)
router.register(r'tasks', InstallationTaskViewSet)
router.register(r'enquiries', EnquiryViewSet)
router.register(r'users', UserViewSet)
router.register(r'hardware', HardwareViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'assets', AssetAssignmentViewSet)
router.register(r'promocodes', PromoCodeViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'chat/messages', ChatMessageViewSet)

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# ... (imports)

urlpatterns = [
    path('chat/assistant/', ChatAssistantView.as_view(), name='chat-assistant'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/me/', UserMeView.as_view(), name='user-me'),
    path('reports/export/', ExportReportView.as_view(), name='export_report'),
    path('reports/admin-pdf/', AdminReportPDFView.as_view(), name='admin-report-pdf'),
    path('reports/revenue-pdf/', RevenueReportPDFView.as_view(), name='revenue-report-pdf'),
    path('reports/workload/', WorkloadView.as_view(), name='workload'),
    path('broadcast/', BroadcastView.as_view(), name='broadcast'), # Corrected from original instruction's typo
    path('diagnostics/<str:type>/', DiagnosticsView.as_view(), name='diagnostics'),
    path('activations/activate/', ActivationView.as_view(), name='activate-service'),

    path('invoices/<int:pk>/pdf/', InvoicePDFView.as_view(), name='invoice-pdf'),

    # Public Registration Endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('public/areas/', PublicAreaListView.as_view(), name='public-areas'),

    # Simulated Payment Endpoint
    path('payments/simulate/', SimulatedPaymentView.as_view(), name='simulate-payment'),

    path('', include(router.urls)),
]
