import { useState, useEffect } from "react";
import api from "../../config/api";
import {
    MapPin, Navigation, CheckCircle, Clock, Play, Briefcase,
    Phone, FileText, Wrench, AlertTriangle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FieldRepairs() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [activeTab, setActiveTab] = useState("OPEN"); // OPEN, IN_PROGRESS, RESOLVED
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets/'); // Assuming this endpoint returns all tickets
            // Filter tickets assigned to this field staff
            const myTickets = res.data.filter(t => t.assigned_to === user?.id);
            setTickets(myTickets);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // --- ACTIONS ---
    const handleStartJob = async (id) => {
        try {
            await api.patch(`/tickets/${id}/`, { status: "IN_PROGRESS" });
            fetchTickets();
            setActiveTab("IN_PROGRESS");
        } catch (err) { alert("Failed to start repair"); }
    };

    const handleNavigate = (address) => {
        const query = encodeURIComponent(address || "Unknown Location");
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    const handleResolve = async (id) => {
        if (!window.confirm("Mark this ticket as resolved?")) return;
        try {
            await api.patch(`/tickets/${id}/`, { status: "RESOLVED" });
            alert("Ticket Resolved!");
            fetchTickets();
            setActiveTab("RESOLVED");
        } catch (err) { alert("Failed to resolve ticket"); }
    };

    // --- FILTERING ---
    const getFilteredTickets = () => {
        if (activeTab === "OPEN") return tickets.filter(t => t.status === "OPEN");
        if (activeTab === "IN_PROGRESS") return tickets.filter(t => t.status === "IN_PROGRESS");
        if (activeTab === "RESOLVED") return tickets.filter(t => ["RESOLVED", "CLOSED"].includes(t.status));
        return [];
    };

    // --- RENDER CARD ---
    const renderCard = (ticket) => (
        <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 active:scale-[0.98] transition-transform">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-600' :
                            ticket.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                        }`}>
                        {ticket.status.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900 mt-2">{ticket.subject}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Phone size={12} /> {ticket.customer_phone || 'Masked Number'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{ticket.ticket_type}</p>
                </div>
                <div className="bg-red-50 p-2 rounded-lg text-red-400">
                    <Wrench size={20} />
                </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl mb-4 text-xs text-gray-600 leading-relaxed flex gap-2">
                <FileText size={14} className="shrink-0 mt-0.5" />
                {ticket.description || "No specific details provided."}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs text-slate-600 leading-relaxed flex gap-2">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                {ticket.customer_address || "Address details unavailable."}
            </div>

            {/* Actions based on Status */}
            <div className="grid grid-cols-2 gap-3">
                {ticket.status === 'OPEN' && (
                    <button onClick={() => handleStartJob(ticket.id)} className="col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2">
                        <Play size={16} /> START REPAIR
                    </button>
                )}

                {ticket.status === 'IN_PROGRESS' && (
                    <>
                        <button onClick={() => handleNavigate(ticket.customer_address)} className="bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                            <Navigation size={16} /> NAVIGATE
                        </button>
                        <button onClick={() => handleResolve(ticket.id)} className="bg-green-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-green-200 flex items-center justify-center gap-2">
                            <CheckCircle size={16} /> RESOLVE
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Repair Jobs</h1>
                    <p className="text-xs text-gray-500"> Assigned to {user?.username}</p>
                </div>
                <div className="bg-red-50 text-red-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'OPEN').length}
                </div>
            </header>

            {/* Tabs */}
            <div className="flex p-2 gap-2 overflow-x-auto my-2 px-4">
                {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="px-4">
                {loading ? <div className="text-center py-10 text-gray-400">Loading Tickets...</div> : (
                    getFilteredTickets().length > 0 ? getFilteredTickets().map(renderCard) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Wrench size={48} className="mb-4 text-gray-200" />
                            <p>No tickets in {activeTab}</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
