import { useState, useEffect } from "react";
import api from "../../config/api";
import { Check, X, Eye, Phone, MessageSquare, Clock, UserPlus, Ticket, Send, CheckCircle, Mail } from "lucide-react";

export default function ManageRequests() {
    const [activeTab, setActiveTab] = useState("leads"); // leads, enquiries
    const [leads, setLeads] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chat State (Support Tickets)
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    // Enquiry Reply Modal State
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [enquiryReply, setEnquiryReply] = useState("");
    const [enquiryReplyLoading, setEnquiryReplyLoading] = useState(false);

    // Assignment Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedFieldStaffId, setSelectedFieldStaffId] = useState("");
    const [selectedTechStaffId, setSelectedTechStaffId] = useState("");
    const [assignType, setAssignType] = useState(""); // 'INSTALLATION' or 'ENQUIRY'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, enqRes, ticketsRes] = await Promise.all([
                api.get("/users/"),
                api.get("/enquiries/"),
                api.get("/tickets/")
            ]);

            const allUsers = usersRes.data;
            const pendingLeads = allUsers.filter(u => ["LEAD", "READY_TO_INSTALL"].includes(u.status));
            const staffMembers = allUsers.filter(u => ["TECHNICAL_STAFF", "FIELD_STAFF"].includes(u.role));

            setLeads(pendingLeads);
            setEnquiries(enqRes.data);
            setTickets(ticketsRes.data);
            setStaff(staffMembers);
        } catch (err) { console.error("Error fetching requests", err); }
        finally { setLoading(false); }
    };

    const handleVerifyUser = async (user) => {
        if (!window.confirm(`Verify identity for ${user.username}? This will allow them to select a plan.`)) return;
        try {
            await api.patch(`/users/${user.id}/`, { status: 'VERIFIED' });
            alert("User Verified Successfully!");
            fetchData();
        } catch (err) { alert("Verification Failed"); }
    };

    // Chat Functions
    useEffect(() => {
        let interval;
        if (selectedTicket) {
            fetchMessages(selectedTicket.id);
            interval = setInterval(() => fetchMessages(selectedTicket.id), 3000);
        }
        return () => clearInterval(interval);
    }, [selectedTicket]);

    const fetchMessages = async (ticketId) => {
        try {
            const res = await api.get(`/chat/messages/?ticket_id=${ticketId}`);
            setChatMessages(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCloseTicket = async (ticketId) => {
        if (!window.confirm("Are you sure you want to permanently close this ticket?")) return;
        try {
            await api.patch(`/tickets/${ticketId}/`, { status: 'CLOSED' });
            if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status: 'CLOSED' });
            fetchData();
        } catch (err) { alert("Failed to close ticket: " + JSON.stringify(err.response?.data)); }
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
            fetchMessages(selectedTicket.id);
        } catch (err) { alert("Failed to send message. " + JSON.stringify(err.response?.data)); }
    };

    // Enquiry Reply Handlers
    const handleEnquiryReply = async (e) => {
        e.preventDefault();
        if (!enquiryReply.trim()) return;
        setEnquiryReplyLoading(true);
        try {
            // Mark enquiry as CONTACTED and save the note
            await api.patch(`/enquiries/${selectedEnquiry.id}/`, {
                status: 'CONTACTED',
                subject: `[Admin Reply] ${enquiryReply.substring(0, 80)}`
            });
            alert(`Reply noted for ${selectedEnquiry.name}. Enquiry marked as Contacted.`);
            setSelectedEnquiry(null);
            setEnquiryReply("");
            fetchData();
        } catch (err) {
            alert("Failed to save reply.");
        } finally {
            setEnquiryReplyLoading(false);
        }
    };

    const openChat = (ticket) => {
        setSelectedTicket(ticket);
        setChatLoading(true);
        fetchMessages(ticket.id).finally(() => setChatLoading(false));
    };

    const openAssignModal = (request, type) => {
        setSelectedRequest(request);
        setAssignType(type);
        setSelectedFieldStaffId("");
        setSelectedTechStaffId("");
        setAssignModalOpen(true);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();

        try {
            if (assignType === 'INSTALLATION') {
                if (!selectedFieldStaffId || !selectedTechStaffId) return alert("Please select both Field and Technical staff");

                // 1. Fetch Existing Task to avoid duplicates
                const tasksRes = await api.get("/tasks/");
                const existingTask = tasksRes.data.find(t => t.customer === selectedRequest.id && t.status !== 'CLOSED');

                if (existingTask) {
                    await api.patch(`/tasks/${existingTask.id}/`, {
                        assigned_staff: selectedFieldStaffId,
                        assigned_technical_staff: selectedTechStaffId,
                        status: "PENDING" // Make sure it's pending for staff to pick up
                    });
                } else {
                    await api.post("/tasks/", {
                        customer: selectedRequest.id,
                        assigned_staff: selectedFieldStaffId,
                        assigned_technical_staff: selectedTechStaffId,
                        status: "PENDING",
                        notes: "New Connection Request assigned via Admin Panel"
                    });
                }
                // 2. Update User Status
                await api.patch(`/users/${selectedRequest.id}/`, { status: "INSTALLATION_PENDING" });
                alert("Installation Assigned Successfully!");
            } else if (assignType === 'ENQUIRY') {
                if (!selectedTechStaffId) return alert("Please select a technical staff member");

                // Update Enquiry
                await api.patch(`/enquiries/${selectedRequest.id}/`, {
                    assigned_to: selectedTechStaffId,
                    status: "OPEN" // Keep open, but assigned
                });
                alert("Enquiry Assigned Successfully!");
            }
            setAssignModalOpen(false);
            fetchData();
        } catch (err) { alert("Assignment Failed: " + JSON.stringify(err.response?.data || err.message)); console.error(err); }
    };

    const handleRejectLead = async (id) => {
        if (!window.confirm("Are you sure? This will delete the user request.")) return;
        try {
            await api.delete(`/users/${id}/`);
            fetchData();
        } catch (err) { alert("Error rejecting lead"); }
    };

    const getFilteredStaff = () => {
        if (assignType === 'INSTALLATION') return staff.filter(s => s.role === 'FIELD_STAFF');
        if (assignType === 'ENQUIRY') return staff.filter(s => s.role === 'TECHNICAL_STAFF');
        return [];
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Request Management</h1>
                <p className="text-gray-500">Handle new connections and customer inquiries.</p>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('leads')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors ${activeTab === 'leads' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <UserPlus size={18} />
                    New Connections ({leads.length})
                </button>
                <button
                    onClick={() => setActiveTab('enquiries')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors ${activeTab === 'enquiries' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <MessageSquare size={18} />
                    General Enquiries ({enquiries.filter(e => e.status === 'OPEN').length})
                </button>
                <button
                    onClick={() => setActiveTab('tickets')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors ${activeTab === 'tickets' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Ticket size={18} />
                    Support Tickets ({tickets.filter(t => t.status === 'OPEN').length})
                </button>
            </div>

            {/* CONTENT */}
            {loading ? <div className="text-center py-10">Loading...</div> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">

                    {/* LEADS TABLE */}
                    {activeTab === 'leads' && (
                        leads.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">No pending connection requests.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                                        <tr>
                                            <th className="px-6 py-4">Applicant</th>
                                            <th className="px-6 py-4">Location</th>
                                            <th className="px-6 py-4">Documents</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {leads.map(lead => (
                                            <tr key={lead.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-900">{lead.username}</p>
                                                        {lead.status === 'READY_TO_INSTALL' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 uppercase font-bold">Plan Selected</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-500">{lead.email}</p>
                                                    <p className="text-xs text-gray-500">{lead.phone_number}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                        {lead.area_details?.name || 'Unknown Area'}
                                                    </span>
                                                    <p className="text-xs text-gray-400 mt-1 max-w-[150px] truncate">{lead.address}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {lead.id_proof ? (
                                                        <a href={lead.id_proof} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-sm"><Eye size={14} /> Proof</a>
                                                    ) : <span className="text-red-400 text-xs">Missing</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    {lead.status === 'LEAD' ? (
                                                        <button onClick={() => handleVerifyUser(lead)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">Verify Identity</button>
                                                    ) : lead.status === 'VERIFIED' ? (
                                                        <button disabled className="bg-gray-300 text-gray-500 px-3 py-1.5 rounded-lg text-sm cursor-not-allowed" title="Waiting for user to select a plan & router in their dashboard">Awaiting Plan</button>
                                                    ) : (
                                                        <button onClick={() => openAssignModal(lead, 'INSTALLATION')} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700">Assign Installation</button>
                                                    )}
                                                    <button onClick={() => handleRejectLead(lead.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100">Reject</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* ENQUIRIES TABLE */}
                    {activeTab === 'enquiries' && (
                        enquiries.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">No enquiries received.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                                        <tr>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">From</th>
                                            <th className="px-6 py-4">Message</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {enquiries.map(e => (
                                            <tr key={e.id} className={`hover:bg-gray-50 ${e.status === 'CONTACTED' ? 'opacity-60' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${e.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                        {e.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{e.name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12} /> {e.phone}</p>
                                                    {e.email && <p className="text-xs text-indigo-600 hover:underline"><a href={`mailto:${e.email}`}>{e.email}</a></p>}
                                                    <p className="text-xs text-gray-400 mt-1"><Clock size={10} className="inline mr-1" />{new Date(e.created_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">{e.message}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => { setSelectedEnquiry(e); setEnquiryReply(""); }}
                                                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 inline-flex items-center gap-1"
                                                    >
                                                        <MessageSquare size={14} /> Reply
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* TICKETS TABLE */}
                    {activeTab === 'tickets' && (
                        tickets.filter(t => t.status !== 'CLOSED').length === 0 ? (
                            <div className="p-10 text-center text-gray-400">No active support tickets found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                                        <tr>
                                            <th className="px-6 py-4">Status & Priority</th>
                                            <th className="px-6 py-4">Customer Info</th>
                                            <th className="px-6 py-4">Issue Details</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {tickets.filter(t => t.status !== 'CLOSED').map(t => (
                                            <tr key={t.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'OPEN' ? 'bg-orange-100 text-orange-600' : t.status === 'RESOLVED' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {t.status}
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-2 font-bold">{t.ticket_type}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{t.customer_name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12} /> {t.customer_phone || 'N/A'}</p>
                                                    <p className="text-xs text-gray-400 mt-1"><Clock size={10} className="inline mr-1" />{new Date(t.created_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-sm text-gray-800">{t.subject}</p>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs">{t.description}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                                    {t.status !== 'CLOSED' && (
                                                        <button onClick={() => handleCloseTicket(t.id)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 hover:text-red-700 inline-flex items-center gap-1 border border-gray-200 hover:border-red-200 transition-colors" title="Close Ticket">
                                                            <X size={14} /> Close
                                                        </button>
                                                    )}
                                                    <button onClick={() => openChat(t)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700 inline-flex items-center gap-1">
                                                        <MessageSquare size={14} /> Open Chat
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                </div>
            )}

            {/* ASSIGN MODAL */}
            {assignModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">
                                {assignType === 'INSTALLATION' ? 'Assign Installation Task' : 'Assign Support Ticket'}
                            </h3>
                            <button onClick={() => setAssignModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Select a qualified staff member to handle this request from <strong>{selectedRequest?.username || selectedRequest?.name}</strong>.
                        </p>

                        <form onSubmit={handleAssignSubmit} className="space-y-4">

                            {/* Field Staff Selection (Only for Installation) */}
                            {assignType === 'INSTALLATION' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Field Staff (Physical Installation)</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={selectedFieldStaffId}
                                        onChange={e => setSelectedFieldStaffId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Field Staff --</option>
                                        {staff.filter(s => s.role === 'FIELD_STAFF').map(s => (
                                            <option key={s.id} value={s.id}>{s.username}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Technical Staff Selection (For Both) */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {assignType === 'INSTALLATION' ? 'Technical Staff (Activation & QC)' : 'Support Staff'}
                                </label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={selectedTechStaffId}
                                    onChange={e => setSelectedTechStaffId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Technical Staff --</option>
                                    {staff.filter(s => s.role === 'TECHNICAL_STAFF').map(s => (
                                        <option key={s.id} value={s.id}>{s.username}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setAssignModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Confirm Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CHAT / TICKET MODAL */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-sm shadow-2xl">
                    <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Ticket #{selectedTicket.id}</h3>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{selectedTicket.subject}</div>
                            </div>
                            <div className="flex gap-2 items-center">
                                                {selectedTicket.status !== 'CLOSED' && (
                                                    <button onClick={() => handleCloseTicket(selectedTicket.id)} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg border border-red-200 transition-colors">Close Ticket</button>
                                                )}
                                                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                                    <X size={24} color="#6b7280" />
                                                </button>
                                            </div>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {/* Original Ticket Description */}
                            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-sm text-gray-700 shadow-sm mb-6">
                                <div className="font-bold text-yellow-800 text-xs mb-1 uppercase">Original Request from {selectedTicket.name}</div>
                                {selectedTicket.description}
                            </div>

                            {/* Chat Messages */}
                            {chatLoading ? (
                                <div className="text-center text-xs text-gray-400 py-4">Loading messages...</div>
                            ) : chatMessages.length === 0 ? (
                                <div className="text-center text-xs text-gray-400 py-4">No replies yet. Start the conversation!</div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.sender_name === 'You' || msg.sender_role === 'ADMIN' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.sender_name === 'You' || msg.sender_role === 'ADMIN' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                                            {msg.message}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                                            {msg.sender_name === 'You' || msg.sender_role === 'ADMIN' ? 'Admin' : selectedTicket.name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                            <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Reply to customer (sends email)..."
                                    className="flex-1 bg-transparent border-0 px-4 py-3 focus:ring-0 outline-none text-sm"
                                    disabled={selectedTicket.status === 'CLOSED'}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || selectedTicket.status === 'CLOSED'}
                                    className="bg-emerald-600 text-white px-4 flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            {selectedTicket.status === 'CLOSED' && (
                                <p className="text-xs text-center text-red-500 mt-2 font-bold">This ticket is closed.</p>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* ENQUIRY IN-APP REPLY MODAL */}
            {selectedEnquiry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Mail size={18} className="text-indigo-600" /> Reply to Enquiry
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">From: <strong>{selectedEnquiry.name}</strong> {selectedEnquiry.phone && `• ${selectedEnquiry.phone}`}</p>
                            </div>
                            <button onClick={() => setSelectedEnquiry(null)} className="p-1 hover:bg-indigo-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Original Message */}
                        <div className="px-6 pt-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Original Enquiry</p>
                                {selectedEnquiry.message}
                            </div>
                        </div>

                        {/* Reply Form */}
                        <form onSubmit={handleEnquiryReply} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Reply / Internal Note</label>
                                <textarea
                                    rows={4}
                                    value={enquiryReply}
                                    onChange={(e) => setEnquiryReply(e.target.value)}
                                    placeholder="Write your response or internal note here..."
                                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">This will mark the enquiry as <strong>Contacted</strong> and save your note.</p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setSelectedEnquiry(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm">Cancel</button>
                                <button type="submit" disabled={enquiryReplyLoading} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                    <Send size={16} /> {enquiryReplyLoading ? 'Saving...' : 'Save & Mark Contacted'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
