import { useState, useEffect } from "react";
import api from "../../config/api";
import { MessageSquare, Plus, Clock, CheckCircle } from "lucide-react";

export default function Support() {
    const [tickets, setTickets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ subject: "", type: "LOGICAL", description: "" });

    // Chat State
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchTickets();
        // Polling for new tickets or status updates
        const interval = setInterval(fetchTickets, 10000);
        return () => clearInterval(interval);
    }, []);

    // Polling for active chat
    useEffect(() => {
        let interval;
        if (selectedTicket) {
            fetchMessages(selectedTicket.id);
            interval = setInterval(() => fetchMessages(selectedTicket.id), 3000); // Poll every 3s for chat
        }
        return () => clearInterval(interval);
    }, [selectedTicket]);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets/');
            setTickets(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMessages = async (ticketId) => {
        try {
            const res = await api.get(`/chat/messages/?ticket_id=${ticketId}`);
            setMessages(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post('/chat/messages/', {
                ticket: selectedTicket.id,
                message: newMessage
            });
            setNewMessage("");
            fetchMessages(selectedTicket.id); // Refresh immediately
        } catch (err) { alert("Failed to send message"); }
    };

    const openChat = (ticket) => {
        setSelectedTicket(ticket);
        setChatLoading(true);
        fetchMessages(ticket.id).finally(() => setChatLoading(false));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tickets/', {
                subject: form.subject,
                description: form.description,
                ticket_type: form.type,
                status: 'OPEN'
            });
            alert("Ticket Created!");
            setShowModal(false);
            fetchTickets();
        } catch (err) { alert("Failed to create ticket"); }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
                    <p className="text-gray-500 mt-2">Get help with your connection.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all">
                    <Plus size={20} /> New Ticket
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.length === 0 ? (
                    <div className="col-span-2 text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
                        <MessageSquare size={48} className="mx-auto mb-4 text-gray-200" />
                        <p>No active tickets. You're all good!</p>
                    </div>
                ) : (
                    tickets.map(t => (
                        <div key={t.id} onClick={() => openChat(t)} className="cursor-pointer bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'OPEN' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {t.status}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12} /> {new Date(t.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{t.subject || "Support Request"}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                {t.assigned_to ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                                        <CheckCircle size={14} /> Agent Assigned
                                    </div>
                                ) : <span className="text-xs text-gray-400">waiting for agent...</span>}
                                <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-600 flex items-center gap-1">
                                    View Details <MessageSquare size={12} />
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Ticket Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Raise a Ticket</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Issue Type</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                >
                                    <option value="LOGICAL">Internet Slow / Authentication</option>
                                    <option value="PHYSICAL">Wire Cut / Red Light</option>
                                    <option value="BILLING">Billing Issue</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                                <input
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                                    placeholder="e.g. Internet is very slow at night"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-32"
                                    placeholder="Explain the issue in detail..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    required
                                ></textarea>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Submit Ticket</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Chat / Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-sm animate-in slide-in-from-right duration-300">
                    <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">ticket #{selectedTicket.id}</h3>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{selectedTicket.subject}</div>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <CheckCircle className="rotate-45" size={24} color="#6b7280" />
                                {/* Using rotated CheckCircle as Close icon, or import X */}
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {/* Original Ticket Description */}
                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-sm text-gray-700 shadow-sm">
                                <div className="font-bold text-yellow-800 text-xs mb-1 uppercase">Original Request</div>
                                {selectedTicket.message}
                            </div>

                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender_name === 'You' || msg.sender === selectedTicket.customer ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender_name === 'You' || msg.sender === selectedTicket.customer
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                        <div className="font-bold text-[10px] opacity-70 mb-1">{msg.sender_name || 'Agent'}</div>
                                        {msg.message}
                                        <div className="text-[10px] opacity-50 text-right mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            ))}
                            <div id="scroll-anchor"></div>
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Type your reply..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                />
                                <button disabled={!newMessage.trim()} type="submit" className="bg-indigo-600 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                    <MessageSquare size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
