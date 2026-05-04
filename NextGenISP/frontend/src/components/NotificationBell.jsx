import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, AlertCircle, Info, X } from "lucide-react";
import api from "../config/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        let newNotifs = [];

        try {
            // 1. ADMIN Notifications
            if (user.role === 'ADMIN') {
                const res = await api.get("/users/");
                const leads = res.data.filter(u => u.status === 'LEAD');
                if (leads.length > 0) {
                    newNotifs.push({
                        id: 'leads',
                        type: 'info',
                        message: `${leads.length} New Registration Request(s)`,
                        link: '/admin/requests',
                        time: 'Just now'
                    });
                }

                const resTasks = await api.get("/installation-tasks/");
                const pendingTasks = resTasks.data.filter(t => t.status === 'PENDING').length;
                if (pendingTasks > 0) {
                    newNotifs.push({
                        id: 'tasks',
                        type: 'warning',
                        message: `${pendingTasks} Installation(s) Pending Assignment`,
                        link: '/admin/requests',
                        time: 'Just now'
                    });
                }

                const resTickets = await api.get("/tickets/");
                const openTickets = resTickets.data.filter(t => t.status === 'OPEN');
                openTickets.forEach(ticket => {
                    const isUpgrade = ticket.subject.toLowerCase().includes('upgrade');
                    newNotifs.push({
                        id: `ticket-${ticket.id}`,
                        type: isUpgrade ? 'success' : 'info',
                        message: ticket.subject,
                        link: '/admin/requests',
                        time: new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                });
            }

            // 2. CUSTOMER Notifications
            if (user.role === 'CUSTOMER' && user.status === 'ACTIVE') {
                const resInv = await api.get("/invoices/");
                const unpaid = resInv.data.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE');
                unpaid.forEach(inv => {
                    newNotifs.push({
                        id: `inv-${inv.id}`,
                        type: 'alert',
                        message: `Invoice #${inv.id} of ₹${inv.amount} is Pending`,
                        link: '/customer/pay',
                        time: inv.issue_date
                    });
                });

                const resTic = await api.get("/enquiries/");
                const updatedTickets = resTic.data.filter(t => t.status === 'RESOLVED');
                updatedTickets.forEach(t => {
                    newNotifs.push({
                        id: `tic-${t.id}`,
                        type: 'success',
                        message: `Ticket #${t.id} has been Resolved`,
                        link: '/customer/support',
                        time: 'Check Now'
                    });
                });
            }

            // 3. STAFF Notifications
            if (user.role.includes('STAFF')) {
                // Logic for assigned tasks can be added here
                // For now simpler
            }

            setNotifications(newNotifs);
            setUnreadCount(newNotifs.length);

        } catch (err) {
            console.error("Notification Polling Error", err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all relative"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                        <span className="text-xs font-bold text-gray-400">{unreadCount} New</span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                No new notifications
                            </div>
                        ) : (
                            notifications.map((notif, idx) => (
                                <Link
                                    to={notif.link}
                                    key={idx}
                                    onClick={() => setIsOpen(false)}
                                    className="block p-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 min-w-[32px] h-8 rounded-full flex items-center justify-center 
                                            ${notif.type === 'alert' ? 'bg-red-100 text-red-600' :
                                                notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                                    notif.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {notif.type === 'alert' ? <AlertCircle size={14} /> :
                                                notif.type === 'success' ? <CheckCircle size={14} /> : <Info size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 leading-snug">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                            <button onClick={() => setNotifications([])} className="text-xs font-bold text-gray-500 hover:text-gray-900">
                                Mark all as read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
