import { useState, useEffect } from "react";
import api from "../../config/api";
import { Mail, Send, Radio, MapPin, Tag, Plus, Trash2, Copy } from "lucide-react";

export default function Broadcast() {
    const [activeTab, setActiveTab] = useState("broadcast");

    // Broadcast State
    const [areas, setAreas] = useState([]);
    const [form, setForm] = useState({
        target: "ALL", // ALL, AREA, DEFAULTERS
        area_id: "",
        subject: "",
        message: ""
    });
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [areaRes, usersRes] = await Promise.all([
                api.get("/areas/"),
                api.get("/users/")
            ]);
            setAreas(areaRes.data);
            setUsers(usersRes.data.filter(u => u.role === 'CUSTOMER'));
        } catch (err) { console.error(err); }
    };

    // --- Broadcast Logic ---
    const handleSendBroadcast = async (e) => {
        e.preventDefault();
        if (!confirm("Are you sure you want to send this broadcast? Emails will be queued immediately.")) return;

        setLoading(true);
        try {
            const payload = {
                target_audience: form.target,
                area_id: form.area_id,
                subject: form.subject,
                message: form.message
            };
            const res = await api.post("/broadcast/", payload);
            alert(res.data.message);
            setForm({ target: "ALL", area_id: "", subject: "", message: "" });
        } catch (err) {
            alert(err.response?.data?.error || "Broadcast Failed");
        } finally {
            setLoading(false);
        }
    };

    // --- Promo Logic ---


    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Comms & Marketing</h1>
            <p className="text-gray-500 mb-8">Manage mass communications and alerts.</p>

            {/* BROADCAST TAB */}
            {activeTab === "broadcast" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Compose Card */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Send size={20} className="text-indigo-600" /> Compose Message</h3>

                        <form onSubmit={handleSendBroadcast} className="space-y-6">
                            {/* Target Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Target Audience</label>
                                <div className="flex gap-4">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${form.target === 'ALL' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}>
                                        <input type="radio" name="target" value="ALL" checked={form.target === 'ALL'} onChange={e => setForm({ ...form, target: e.target.value })} className="hidden" />
                                        <Radio size={16} /> All Users
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${form.target === 'AREA' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200'}`}>
                                        <input type="radio" name="target" value="AREA" checked={form.target === 'AREA'} onChange={e => setForm({ ...form, target: e.target.value })} className="hidden" />
                                        <MapPin size={16} /> Specific Area
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${form.target === 'DEFAULTERS' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200'}`}>
                                        <input type="radio" name="target" value="DEFAULTERS" checked={form.target === 'DEFAULTERS'} onChange={e => setForm({ ...form, target: e.target.value })} className="hidden" />
                                        <Tag size={16} /> Defaulters
                                    </label>
                                </div>
                            </div>

                            {form.target === 'AREA' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Area</label>
                                    <select value={form.area_id} onChange={e => setForm({ ...form, area_id: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required>
                                        <option value="">-- Choose Zone --</option>
                                        {areas.map(area => (
                                            <option key={area.id} value={area.id}>
                                                {area.name} ({area.code}) - {area.customer_count || 0} Customers
                                            </option>
                                        ))}
                                    </select>

                                    {form.area_id && (
                                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customers in this Region:</h4>
                                            <div className="max-h-32 overflow-y-auto w-full text-sm text-gray-700">
                                                {users.filter(u => u.area_details?.id == form.area_id).length > 0 ? (
                                                    <ul className="list-disc pl-5 grid grid-cols-2 gap-x-4">
                                                        {users.filter(u => u.area_details?.id == form.area_id).map(u => (
                                                            <li key={u.id} className="truncate">{u.first_name || u.username} {(u.last_name || '')}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-gray-400 italic">No customers assigned tracking this area yet.</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                                <input placeholder="e.g., Important Maintenance Update" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                                <textarea placeholder="Type your broadcast message here..." rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required />
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                                {loading ? "Queueing Emails..." : <><Send size={18} /> Send Broadcast</>}
                            </button>
                        </form>
                    </div>

                    {/* Preview / Tips */}
                    <div>
                        <div className="bg-indigo-900 text-white p-6 rounded-2xl mb-6">
                            <h4 className="font-bold mb-2">Pro Tips</h4>
                            <ul className="text-sm space-y-2 opacity-90">
                                <li>• Keep subject lines concise.</li>
                                <li>• Avoid spammy keywords like "FREE" or "WIN".</li>
                                <li>• Maintenance alerts should be sent at least 24h in advance.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
