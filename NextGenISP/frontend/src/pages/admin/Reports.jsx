import { useState, useEffect } from "react";
import { 
    FileText, 
    Download, 
    TrendingUp, 
    Users, 
    Briefcase, 
    Ticket, 
    CreditCard, 
    MessageSquare,
    ChevronRight,
    Loader2
} from "lucide-react";
import api from "../../config/api";

export default function Reports() {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        customers: 0,
        staff: 0,
        tickets: 0,
        installs: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, ticketsRes, tasksRes] = await Promise.all([
                    api.get("/users/"),
                    api.get("/tickets/"),
                    api.get("/tasks/")
                ]);
                
                setStats({
                    customers: usersRes.data.filter(u => u.role === 'CUSTOMER').length,
                    staff: usersRes.data.filter(u => u.role === 'TECHNICAL_STAFF' || u.role === 'FIELD_STAFF' || u.role === 'ADMIN').length,
                    tickets: ticketsRes.data.filter(t => t.status !== 'CLOSED').length,
                    installs: tasksRes.data.filter(t => t.status !== 'CLOSED').length
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/admin-pdf/", {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'NextGen_System_Report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Failed to generate report. Please check if the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const reportSections = [
        { title: "Executive Summary", desc: "Overall metrics and KPIs", icon: TrendingUp, color: "bg-blue-500" },
        { title: "Staff Directory", desc: "List of all internal team members", icon: Briefcase, color: "bg-slate-500" },
        { title: "Recent Registrations", desc: "Latest customers joined the platform", icon: Users, color: "bg-indigo-500" },
        { title: "Plan Upgrades", desc: "History of data plan changes", icon: TrendingUp, color: "bg-green-500" },
        { title: "Support Tickets", desc: "Open and resolved customer issues", icon: Ticket, color: "bg-rose-500" },
        { title: "Bill Payments", desc: "Recent financial transactions", icon: CreditCard, color: "bg-emerald-500" },
        { title: "Customer Enqueries", desc: "Status of public contact requests", icon: MessageSquare, color: "bg-yellow-500" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Reports</h1>
                    <p className="text-gray-500 font-medium">Generate comprehensive PDF reports for the entire ISP infrastructure.</p>
                </div>
                <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className={`
                        group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-white transition-all duration-300
                        ${loading 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 active:scale-95"}
                    `}
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <Download className="group-hover:translate-y-0.5 transition-transform" size={20} />
                    )}
                    <span>{loading ? "Generating Report..." : "Generate Full System Report"}</span>
                </button>
            </div>

            {/* Live Stats Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Active Customers", value: stats.customers, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Open Tickets", value: stats.tickets, icon: Ticket, color: "text-rose-600", bg: "bg-rose-50" },
                    { label: "Pending Installs", value: stats.installs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Staff Members", value: stats.staff, icon: Briefcase, color: "text-slate-600", bg: "bg-slate-50" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live</span>
                        </div>
                        <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                        <p className="text-gray-500 text-sm font-semibold mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Report Contents Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-800">What's in the generated report?</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportSections.map((section, index) => (
                        <div key={index} className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-default flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${section.color} flex items-center justify-center text-white shadow-lg`}>
                                <section.icon size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-sm">{section.title}</h4>
                                <p className="text-xs text-gray-500 font-medium">{section.desc}</p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Information Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <h3 className="text-2xl font-bold mb-3">Enterprise Data Management</h3>
                    <p className="text-indigo-100 font-medium opacity-90 leading-relaxed">
                        Our reporting engine collates real-time data from every department including logistics, finance, and technical support. 
                        The generated PDF is legally formatted and ready for stakeholder presentations or internal records.
                    </p>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
                <FileText className="absolute right-12 bottom-0 translate-y-1/3 text-white/10" size={240} />
            </div>
        </div>
    );
}
