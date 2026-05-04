import { useState, useEffect } from "react";
import api from "../../config/api";
import {
    Users, DollarSign, Activity, AlertCircle,
    Check, X, Eye, FileText, MapPin, Search, Plus, Bell
} from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { useNavigate } from "react-router-dom";

export default function AdminDash() {
    const [stats, setStats] = useState({ revenue: 0, customers: 0, distinct_leads: 0, tickets: 0 });
    const [users, setUsers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [activeTab, setActiveTab] = useState("overview"); // overview, users, leads
    const [selectedLead, setSelectedLead] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const navigate = useNavigate();

    // Real Zone Data Derivation
    const areaCounts = users.reduce((acc, user) => {
        const areaName = user.area_details?.name || 'Unknown';
        acc[areaName] = (acc[areaName] || 0) + 1;
        return acc;
    }, {});

    const zoneData = Object.keys(areaCounts).length > 0
        ? Object.keys(areaCounts).map(name => ({ name, value: areaCounts[name] }))
        : [{ name: 'No Data', value: 1 }];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [usersRes, ticketsRes, invoicesRes] = await Promise.all([
                api.get("/users/"),
                api.get("/tickets/"),
                api.get("/invoices/")
            ]);

            const allUsers = usersRes.data;
            const customers = allUsers.filter(u => u.role === "CUSTOMER" && u.status === "ACTIVE");
            const pendingLeads = allUsers.filter(u => u.status === "LEAD");
            const openTickets = ticketsRes.data.filter(t => t.status === 'OPEN').length;

            setUsers(customers);
            setLeads(pendingLeads);

            // Build Revenue Chart from PAID invoices
            const paidInvoices = invoicesRes.data.filter(inv => inv.status === 'PAID');
            const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

            // Group PAID invoices by month
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyRevenue = {};
            paidInvoices.forEach(inv => {
                const d = new Date(inv.issue_date);
                const key = monthNames[d.getMonth()];
                monthlyRevenue[key] = (monthlyRevenue[key] || 0) + parseFloat(inv.amount || 0);
            });
            const chartData = monthNames
                .filter(m => monthlyRevenue[m])
                .map(m => ({ name: m, revenue: monthlyRevenue[m] }));

            setRevenueData(chartData.length > 0 ? chartData : [{ name: 'No Data', revenue: 0 }]);

            setStats({
                revenue: Math.round(totalRevenue),
                customers: customers.length,
                distinct_leads: pendingLeads.length,
                tickets: openTickets
            });

        } catch (err) { console.error("Dashboard fetch error", err); }
    };

    const handleExport = async (type) => {
        try {
            const endpoint = type === 'pdf' ? '/reports/admin-pdf/' : 
                             type === 'revenue' ? '/reports/revenue-pdf/' :
                             `/reports/export/?type=${type}`;
            const res = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = type === 'pdf' ? 'system_report.pdf' :
                         type === 'revenue' ? 'revenue_report.pdf' :
                         `${type}_report.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Export Failed:", err);
            alert("Failed to export report. Verify your admin role capabilities.");
        }
    };

    return (
        <div className="space-y-8 min-h-full font-inter">

            {/* 1. ACTION BAR */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mb-2">
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => navigate('/admin/areas')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-100 px-5 py-2.5 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 shadow-sm transition-all font-medium text-sm">
                        <MapPin size={18} /> Manage Zones
                    </button>
                    <button onClick={() => navigate('/admin/plans')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all font-medium text-sm">
                        <FileText size={18} /> Manage Plans
                    </button>
                </div>
            </div>

            {/* 2. AT-A-GLANCE WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="relative z-10">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-3xl font-extrabold text-gray-900 mt-2">₹ {stats.revenue.toLocaleString()}</h3>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-md">Current Month</span>
                        </div>
                    </div>
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={80} className="text-indigo-600 transform rotate-12 translate-x-4 -translate-y-4" />
                    </div>
                </div>

                {/* Subscribers Card */}
                <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
                    <div className="relative z-10">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Subscribers</p>
                        <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.customers}</h3>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">+ New this week</span>
                        </div>
                    </div>
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={80} className="text-blue-600 transform rotate-12 translate-x-4 -translate-y-4" />
                    </div>
                </div>

                {/* Pending Actions Card */}
                <div
                    onClick={() => navigate('/admin/requests')}
                    className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-2xl shadow-lg shadow-orange-500/20 text-white relative overflow-hidden cursor-pointer hover:shadow-orange-500/40 transition-all transform hover:-translate-y-1"
                >
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-orange-100 uppercase tracking-wider">Pending Approvals</p>
                        <h3 className="text-3xl font-extrabold text-white mt-2">{stats.distinct_leads}</h3>
                        <div className="mt-3 inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
                            <span className="text-xs font-bold text-white">Action Required</span>
                        </div>
                    </div>
                    <div className="absolute right-4 bottom-4 opacity-20">
                        <Activity size={64} />
                    </div>
                </div>

                {/* Tickets Card */}
                <div 
                    onClick={() => navigate('/admin/requests')}
                    className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                >
                    <div className="relative z-10">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Critical Tickets</p>
                        <h3 className="text-3xl font-extrabold text-gray-900 mt-2">{stats.tickets}</h3>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">Urgent</span>
                        </div>
                    </div>
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={80} className="text-rose-600 transform rotate-12 translate-x-4 -translate-y-4" />
                    </div>
                </div>
            </div>

            {/* 3. MAIN CONTENT AREA (Tabs) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 min-h-[500px] overflow-hidden">
                {/* Tab Navigation (Pill Style) */}
                <div className="border-b border-gray-100 px-6 py-4 flex flex-wrap gap-2 bg-gray-50/50">
                    {['overview', 'users', 'reports'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${activeTab === tab
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                                }
                            `}
                        >
                            {tab === 'overview' && 'Analytics Overview'}
                            {tab === 'users' && 'Active Customer Base'}
                            {tab === 'reports' && 'Reports & Exports'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 md:p-8">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-indigo-500 rounded-full"></span> Revenue Trend
                                </h4>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-purple-500 rounded-full"></span> Zone Distribution
                                </h4>
                                <div className="h-72 flex justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={zoneData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                cornerRadius={4}
                                            >
                                                {zoneData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                                <h3 className="text-xl font-bold text-gray-800">Subscriber Database</h3>
                                <div className="relative group w-full sm:w-72">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input
                                        placeholder="Search users..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Customer</th>
                                            <th className="px-6 py-4 text-left">Status</th>
                                            <th className="px-6 py-4 text-left">Area</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold font-mono">
                                                            {u.username.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{u.username}</div>
                                                            <div className="text-xs text-gray-500">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Active</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-600">{u.area_details?.name || '-'}</td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-12 text-center text-gray-400">
                                                    No active subscribers found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && (
                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                            <div className="mb-8 text-center">
                                <h3 className="text-2xl font-bold text-gray-800">Operational Reports</h3>
                                <p className="text-gray-500 mt-2">Export data for analysis or official records.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Enquiries Report */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:-translate-y-1">
                                    <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                        <FileText size={28} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2">Enquiries Register</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6">Download all public enquiries, including status and assigned staff.</p>
                                    <button onClick={() => handleExport('enquiries')} className="w-full block bg-white border border-indigo-200 text-indigo-600 text-center py-3 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors">
                                        Download CSV
                                    </button>
                                </div>

                                {/* Leads Report */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:-translate-y-1">
                                    <div className="bg-green-50 w-14 h-14 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors shadow-sm">
                                        <Users size={28} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2">New Connections</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6">Report of new leads, status, and service area distribution.</p>
                                    <button onClick={() => handleExport('leads')} className="w-full block bg-white border border-green-200 text-green-600 text-center py-3 rounded-xl text-sm font-bold hover:bg-green-50 transition-colors">
                                        Download CSV
                                    </button>
                                </div>

                                {/* Installations Report */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:-translate-y-1">
                                    <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
                                        <Activity size={28} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2">Installation Tasks</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6">Track field operations, pending installs, and device allocation.</p>
                                    <button onClick={() => handleExport('installations')} className="w-full block bg-white border border-orange-200 text-orange-600 text-center py-3 rounded-xl text-sm font-bold hover:bg-orange-50 transition-colors">
                                        Download CSV
                                    </button>
                                </div>

                                {/* System Report PDF */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:-translate-y-1">
                                    <div className="bg-red-50 w-14 h-14 rounded-2xl flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm">
                                        <FileText size={28} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2">System Operations PDF</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6">Comprehensive PDF report of key metrics, recent actions, and tickets.</p>
                                    <button onClick={() => handleExport('pdf')} className="w-full block bg-white border border-red-200 text-red-600 text-center py-3 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">
                                        Download PDF
                                    </button>
                                </div>

                                {/* Revenue Report PDF */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:-translate-y-1">
                                    <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                                        <DollarSign size={28} />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-900 mb-2">Revenue Report</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6">Detailed PDF report showing chart and tabular view of customer revenue.</p>
                                    <button onClick={() => handleExport('revenue')} className="w-full block bg-white border border-emerald-200 text-emerald-600 text-center py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors">
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
