import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../config/api"; // Added api import
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Ticket,
    Settings,
    LogOut,
    Menu,
    X,
    Server,
    Activity,
    MapPin,
    Box,
    DollarSign,
    Megaphone,
    Globe,
    Briefcase,
    FileText
} from "lucide-react";
import NotificationBell from "../components/NotificationBell";

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Define navigation based on roles
    const [pendingCount, setPendingCount] = useState(0);

    // Poll for notifications
    useEffect(() => {
        if (user?.role === 'ADMIN') {
            const checkRequests = async () => {
                try {
                    const res = await api.get("/users/");
                    const pending = res.data.filter(u => u.status === 'LEAD').length;
                    setPendingCount(pending);
                } catch (e) { }
            };
            checkRequests();
            const interval = setInterval(checkRequests, 30000); // Check every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    const getNavItems = () => {
        switch (user?.role) {
            case "ADMIN":
                return [
                    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
                    { name: "Requests", path: "/admin/requests", icon: Ticket, badge: pendingCount },
                    { name: "Customers", path: "/admin/users", icon: Users },
                    { name: "Staff", path: "/admin/staff", icon: Briefcase },
                    { name: "Manage Areas", path: "/admin/areas", icon: MapPin },
                    { name: "Models / Plan", path: "/admin/plans", icon: Server },
                    { name: "Inventory", path: "/admin/inventory", icon: Box },
                    { name: "Broadcast", path: "/admin/broadcast", icon: Megaphone },
                    { name: "War Room", path: "/admin/map", icon: Globe },
                    { name: "Reports", path: "/admin/reports", icon: FileText },
                    // Finance can be added later as requested
                ];
            case "TECHNICAL_STAFF":
                return [
                    { name: "Dashboard", path: "/staff/tech", icon: LayoutDashboard },
                ];
            case "FIELD_STAFF":
                return [
                    { name: "My Tasks", path: "/staff/field", icon: LayoutDashboard },
                    { name: "Repairs", path: "/staff/field/repairs", icon: Tool },
                ];
            case "CUSTOMER":
                // For pending users, only show Overview, Support, and Profile
                if (user?.status !== 'ACTIVE') {
                    return [
                        { name: "Overview", path: "/customer", icon: LayoutDashboard },
                        { name: "Support", path: "/customer/support", icon: Ticket },
                        { name: "Profile", path: "/customer/profile", icon: Users },
                    ];
                }
                return [
                    { name: "Overview", path: "/customer", icon: LayoutDashboard },
                    { name: "Pay Bill", path: "/customer/pay", icon: CreditCard },
                    { name: "Support", path: "/customer/support", icon: Ticket },
                    { name: "Profile", path: "/customer/profile", icon: Users },
                ];
            default:
                return [];
        }
    };

    return (
        <div className="flex h-screen bg-[#f1f5f9] text-gray-900 font-inter">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                flex flex-col border-r border-white/5 shadow-2xl
            `}>
                {/* Brand Header */}
                <div className="flex items-center gap-3 h-20 px-8 bg-[#020617] border-b border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Activity size={18} className="text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold tracking-tight text-white block">NextGen</span>
                        <span className="text-xs font-medium text-indigo-400 tracking-wider">COMMAND CENTER</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                    <div className="mb-6 px-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
                        <nav className="space-y-1">
                            {getNavItems().map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`
                                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                                            ${isActive
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                            }
                                        `}
                                    >
                                        <item.icon size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                        <span className="text-sm font-medium flex-1 relative z-10">{item.name}</span>
                                        {isActive && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-100 z-0"></div>}
                                        {item.badge > 0 && (
                                            <span className="relative z-10 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/5 bg-[#020617]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                    >
                        <LogOut size={20} className="group-hover:text-rose-400 transition-colors" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f1f5f9]">
                {/* Desktop Top Header */}
                <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm transition-all">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-900">
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-gray-800 hidden sm:block">
                            {getNavItems().find(i => i.path === location.pathname)?.name || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Notifications / Actions */}
                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <div className="h-6 w-px bg-gray-200 mx-2"></div>
                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all relative">
                                <Settings size={20} />
                            </button>
                        </div>

                        {/* User Profile Dropdown (Simplified) */}
                        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-900 leading-none">{user?.username}</p>
                                <p className="text-xs text-indigo-600 font-medium mt-1 uppercase tracking-wide">{user?.role?.replace("_", " ")}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-lg shadow-indigo-500/20 cursor-pointer hover:scale-105 transition-transform overflow-hidden">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-indigo-700 font-extrabold text-sm border-2 border-transparent overflow-hidden">
                                    {user?.profile_picture ? (
                                        <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.username?.charAt(0).toUpperCase()
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

// Fallback icon for undefined
const Tool = ({ size }) => <Ticket size={size} />; 
