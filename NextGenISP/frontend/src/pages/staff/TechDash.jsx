import { useState, useEffect } from "react";
import api from "../../config/api";
import {
    Phone, CheckCircle, Clock, Search, MessageSquare, Briefcase,
    Wifi, Activity, Server, AlertTriangle, Send, Play, MapPin
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Simple Recharts

export default function TechDash() {
    const { user } = useAuth();

    // State
    const [viewMode, setViewMode] = useState("DASHBOARD"); // DASHBOARD, TICKET, ACTIVATION
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedUserForActivation, setSelectedUserForActivation] = useState(null);

    // Data
    const [tickets, setTickets] = useState([]);
    const [pendingActivations, setPendingActivations] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // Diagnostics
    const [pingResult, setPingResult] = useState(null);
    const [trafficData, setTrafficData] = useState([]);

    useEffect(() => {
        fetchInitialData();
        const interval = setInterval(fetchInitialData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchInitialData = async () => {
        try {
            const [usersRes, ticketsRes, tasksRes] = await Promise.all([
                api.get('/users/'),
                api.get('/enquiries/'),
                api.get('/tasks/')
            ]);

            // Filter Pending Activations (Tasks assigned to ME + Status PHYSICAL_COMPLETED)
            const myActivations = tasksRes.data.filter(t =>
                t.assigned_technical_staff === user?.id &&
                t.status === 'PHYSICAL_COMPLETED'
            );
            setPendingActivations(myActivations);

            // Filter Open Tickets (Enquiries assigned to Tech)
            setTickets(ticketsRes.data.filter(t => t.assigned_to === user?.id && t.status !== 'OPEN')); // Showing assigned enquiries
        } catch (err) { console.error(err); }
    };

    // --- ACTIONS ---
    const handleActivateService = async (e) => {
        e.preventDefault();
        const mac = e.target.mac.value;
        if (!mac) return alert("MAC Address Required");

        try {
            await api.post('/activations/activate/', {
                user_id: selectedUserForActivation.customer, // Task object has 'customer' ID
                mac_address: mac
            });
            alert("Service Activated Successfully!");
            setSelectedUserForActivation(null);
            setViewMode("DASHBOARD");
            fetchInitialData();
        } catch (err) { alert("Activation Failed"); }
    };

    const runDiagnostics = async (type) => {
        setPingResult(null);
        try {
            const res = await api.get(`/diagnostics/${type}/`);
            if (type === 'ping') setPingResult(res.data);
            if (type === 'traffic') setTrafficData(res.data);
        } catch (err) { alert("Diagnostics Failed"); }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        // Mock sending message (Backend implementation creates ChatMessage)
        // await api.post('/chat/messages/', { ticket: selectedTicket.id, message: newMessage });
        setChatHistory([...chatHistory, { text: newMessage, sender: "You", time: "Now" }]);
        setNewMessage("");
    };

    // --- RENDERERS ---

    const renderLeftColumn = () => (
        <div className="bg-white h-full border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 font-bold text-gray-700">Triage Queue</div>

            {/* 1. Pending Activations */}
            <div className="p-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <Play size={12} /> Activation Queue ({pendingActivations.length})
                </h4>
                <div className="space-y-2">
                    {pendingActivations.map(task => (
                        <div key={task.id}
                            onClick={() => { setSelectedUserForActivation(task); setViewMode("ACTIVATION"); }}
                            className={`p-3 rounded-lg border cursor-pointer hover:bg-indigo-50 transition-colors ${selectedUserForActivation?.id === task.id ? 'bg-indigo-50 border-indigo-300' : 'border-gray-100'}`}
                        >
                            <div className="font-bold text-sm text-gray-800">{task.customer_name}</div>
                            <div className="text-xs text-gray-500">MAC: {task.router_mac || 'Pending'}</div>
                            <div className="text-[10px] text-indigo-600 font-bold mt-1">Ready for Activation</div>
                        </div>
                    ))}
                    {pendingActivations.length === 0 && <p className="text-xs text-center text-gray-400 py-2">No pending activations</p>}
                </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* 2. My Tickets */}
            <div className="p-3 flex-1 overflow-y-auto">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <MessageSquare size={12} /> My Tickets ({tickets.length})
                </h4>
                <div className="space-y-2">
                    {tickets.map(t => (
                        <div key={t.id}
                            onClick={() => { setSelectedTicket(t); setViewMode("TICKET"); }}
                            className={`p-3 rounded-lg border cursor-pointer hover:bg-indigo-50 transition-colors ${selectedTicket?.id === t.id ? 'bg-indigo-50 border-indigo-300' : 'border-gray-100'}`}
                        >
                            <div className="flex justify-between">
                                <span className="font-bold text-sm text-gray-800 line-clamp-1">{t.subject || t.message}</span>
                                <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">High</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{t.name} • {new Date(t.created_at).toLocaleDateString()}</div>
                        </div>
                    ))}
                    {tickets.length === 0 && <p className="text-xs text-center text-gray-400 py-2">No active tickets</p>}
                </div>
            </div>
        </div>
    );

    const renderMiddleColumn = () => (
        <div className="flex-1 bg-gray-50 h-full flex flex-col overflow-hidden">
            {viewMode === 'DASHBOARD' && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Activity size={48} className="mb-4 text-gray-300" />
                    <p>Select an item from the queue to begin working.</p>
                </div>
            )}

            {viewMode === 'ACTIVATION' && selectedUserForActivation && (
                <div className="p-8 max-w-2xl mx-auto w-full">
                    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
                        <div className="bg-indigo-600 p-6 text-white">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Play size={24} /> Activation Gatekeeper
                            </h2>
                            <p className="opacity-80">Finalize installation for {selectedUserForActivation.customer_name}</p>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <span className="block text-xs text-gray-500 uppercase">Customer</span>
                                    <span className="font-bold">{selectedUserForActivation.customer_name}</span>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <span className="block text-xs text-gray-500 uppercase">Field Note</span>
                                    <span className="font-bold text-xs">{selectedUserForActivation.notes}</span>
                                </div>
                            </div>

                            <form onSubmit={handleActivateService}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Router MAC Address</label>
                                <input
                                    name="mac"
                                    type="text"
                                    defaultValue={selectedUserForActivation.router_mac}
                                    placeholder="e.g. AA:BB:CC:11:22:33"
                                    className="w-full p-3 border border-gray-300 rounded-lg font-mono text-lg mb-6 focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                                    required
                                />

                                <button type="submit" className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex justify-center items-center gap-2">
                                    <CheckCircle size={20} /> ACTIVATE SERVICE & START BILLING
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'TICKET' && selectedTicket && (
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{selectedTicket.subject || "Support Request"}</h2>
                            <p className="text-xs text-gray-500">Ticket #{selectedTicket.id} • {selectedTicket.name} ({selectedTicket.phone})</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="text-red-600 text-xs font-bold border border-red-100 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">Route to Field</button>
                            <button className="text-green-600 text-xs font-bold border border-green-100 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100">Resolve</button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Original Message */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">C</div>
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 max-w-[80%]">
                                <p className="text-sm text-gray-800">{selectedTicket.message}</p>
                            </div>
                        </div>

                        {/* History */}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.sender === 'You' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${msg.sender === 'You' ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                                    {msg.sender === 'You' ? 'T' : 'C'}
                                </div>
                                <div className={`p-3 rounded-2xl shadow-sm max-w-[80%] ${msg.sender === 'You' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                        <input
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            type="text"
                            className="flex-1 bg-gray-50 border-0 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-100 outline-none"
                            placeholder="Type a reply..."
                        />
                        <button type="submit" className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg"><Send size={20} /></button>
                    </form>

                    {/* Diagnostics Panel - Integrated */}
                    <div className="bg-slate-900 text-white p-4 shrink-0">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Remote Diagnostics</span>
                            <div className="flex gap-2">
                                <button onClick={() => runDiagnostics('ping')} className="text-[10px] bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">Ping Device</button>
                                <button onClick={() => runDiagnostics('traffic')} className="text-[10px] bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">Check Traffic</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 h-32">
                            <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-center relative overflow-hidden">
                                {pingResult ? (
                                    <div className="text-center animate-in fade-in zoom-in">
                                        <div className="text-3xl font-bold text-green-400">{pingResult.latency}</div>
                                        <div className="text-xs text-slate-400">{pingResult.status}</div>
                                    </div>
                                ) : <div className="text-slate-600 text-xs">Ready to Ping</div>}
                            </div>
                            <div className="bg-slate-800 rounded-lg p-2">
                                {trafficData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trafficData}>
                                            <Line type="monotone" dataKey="mbps" stroke="#818cf8" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : <div className="h-full flex items-center justify-center text-slate-600 text-xs">No Traffic Data</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderRightColumn = () => (
        <div className="bg-white h-full border-l border-gray-200 flex flex-col w-72">
            <div className="p-4 border-b border-gray-200 font-bold text-gray-700 flex items-center justify-between">
                <span>Network Pulse</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>

            <div className="p-4 space-y-6">
                {/* Node Status */}
                <div>
                    <h5 className="text-xs text-gray-500 font-bold uppercase mb-3">Core Nodes</h5>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Server size={14} /> Marine Drive</span>
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">Stable</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Server size={14} /> Edapally</span>
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">Stable</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Server size={14} /> Kakkanad</span>
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">Load: 80%</span>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                <div>
                    <h5 className="text-xs text-gray-500 font-bold uppercase mb-3">Alerts</h5>
                    <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
                            <AlertTriangle size={14} /> High Latency
                        </div>
                        <p className="text-xs text-red-600">Detected jitter in Sector 4. Likely physical interference.</p>
                        <button className="mt-2 w-full text-[10px] bg-red-600 text-white py-1 rounded hover:bg-red-700">Broadcast Alert</button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 -m-8">
            {/* Negative margin to counteract default padding if any, forcing full screen feel */}
            <div className="w-80 shrink-0">
                {renderLeftColumn()}
            </div>
            {renderMiddleColumn()}
            <div className="w-72 shrink-0 hidden xl:block">
                {renderRightColumn()}
            </div>
        </div>
    );
}
