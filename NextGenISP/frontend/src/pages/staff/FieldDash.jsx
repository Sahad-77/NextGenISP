import { useState, useEffect } from "react";
import api from "../../config/api";
import {
    MapPin, Navigation, CheckCircle, Clock, Play, Briefcase,
    Phone, FileText, Camera, Box, Truck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function FieldDash() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState("NEW"); // NEW, ACTIVE, DONE
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completionForm, setCompletionForm] = useState({ mac: "", notes: "", cabling: 0 });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks/');
            // Filter tasks assigned to this field staff
            const myTasks = res.data.filter(t => t.assigned_staff === user?.id);
            setTasks(myTasks);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // --- ACTIONS ---
    const handleStartJob = async (id) => {
        try {
            await api.patch(`/tasks/${id}/`, { status: "IN_PROGRESS" });
            fetchTasks();
            setActiveTab("ACTIVE");
        } catch (err) { alert("Failed to start job"); }
    };

    const handleNavigate = (address) => {
        const query = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    const handleCompleteSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTask) return;

        try {
            await api.patch(`/tasks/${selectedTask.id}/`, {
                status: "PHYSICAL_COMPLETED",
                router_mac: completionForm.mac,
                notes: completionForm.notes + `\n[Cabling Used: ${completionForm.cabling}m]`
            });
            alert("Job Completed! Sent to Technical for Activation.");
            setShowCompleteModal(false);
            fetchTasks();
            setActiveTab("DONE");
        } catch (err) { alert("Failed to complete job"); }
    };

    // --- FILTERING ---
    const getFilteredTasks = () => {
        if (activeTab === "NEW") return tasks.filter(t => t.status === "PENDING");
        if (activeTab === "ACTIVE") return tasks.filter(t => t.status === "IN_PROGRESS");
        if (activeTab === "DONE") return tasks.filter(t => ["PHYSICAL_COMPLETED", "CLOSED"].includes(t.status));
        return [];
    };

    // --- RENDER CARD ---
    const renderCard = (task) => (
        <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 active:scale-[0.98] transition-transform">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${task.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                        task.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                        }`}>
                        {task.status.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900 mt-2">{task.customer_name || 'Customer'}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Phone size={12} /> {task.customer_phone || 'Unknown Phone'}
                    </p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-gray-400">
                    <Briefcase size={20} />
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-4 flex flex-col gap-3">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-indigo-500" />
                    <div>
                        <div className="font-semibold">{task.customer_address || "Address pending"}</div>
                        <div className="text-xs text-gray-500 mt-1 whitespace-pre-line bg-white p-2 rounded border border-gray-100">{task.notes || "No specific instructions."}</div>
                    </div>
                </div>

                {/* Extended Hardware Details Block */}
                <div className="border-t border-gray-200 pt-3 flex flex-col gap-2 relative">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Box size={14} /> Hardware Required</h4>

                    {task.is_router_required ? (
                        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center shadow-sm">
                                <Box size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-indigo-900">Provide Company Router</div>
                                <div className="text-xs text-indigo-700">Check notes above for specific model</div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm shrink-0">
                                    <FileText size={16} className="text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-amber-900">Own Device Config (No hardware needed)</div>
                                    <div className="text-xs text-amber-700">{task.own_router_model || "Verify on-site compatible model"}</div>
                                </div>
                            </div>

                            {/* Rich Data */}
                            {(task.own_router_mac || task.own_router_image) && (
                                <div className="mt-2 bg-white/60 p-2 rounded border border-amber-200/50 flex flex-wrap gap-4 items-center">
                                    {task.own_router_mac && (
                                        <div className="text-xs bg-white px-2 py-1 rounded shadow-sm border border-gray-100 font-mono text-gray-700">
                                            MAC: {task.own_router_mac}
                                        </div>
                                    )}
                                    {task.own_router_image && (
                                        <a href={task.own_router_image} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 flex-1">
                                            <Camera size={14} /> View Device Photo
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions based on Status */}
            <div className="grid grid-cols-2 gap-3">
                {task.status === 'PENDING' && (
                    <button onClick={() => handleStartJob(task.id)} className="col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2">
                        <Play size={16} /> START JOB
                    </button>
                )}

                {task.status === 'IN_PROGRESS' && (
                    <>
                        <button onClick={() => handleNavigate("Kochi")} className="bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                            <Navigation size={16} /> NAVIGATE
                        </button>
                        <button onClick={() => {
                            if (confirm("Notify customer you are coming?")) {
                                api.post(`/tasks/${task.id}/notify-on-my-way/`)
                                    .then(() => alert("Customer Notified! 🚚"))
                                    .catch(e => alert("Failed to notify"));
                            }
                        }} className="bg-yellow-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-yellow-200">
                            <Truck size={16} /> ON MY WAY
                        </button>
                        <button onClick={() => { setSelectedTask(task); setShowCompleteModal(true); }} className="bg-green-600 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-green-200 flex items-center justify-center gap-2">
                            <CheckCircle size={16} /> COMPLETE
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
                    <h1 className="text-xl font-bold text-gray-900">Field Operations</h1>
                    <p className="text-xs text-gray-500">Welcome, {user?.username}</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {tasks.filter(t => t.status === 'IN_PROGRESS').length}
                </div>
            </header>

            {/* Tabs */}
            <div className="flex p-2 gap-2 overflow-x-auto my-2 px-4">
                {['NEW', 'ACTIVE', 'DONE'].map(tab => (
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
                {loading ? <div className="text-center py-10 text-gray-400">Loading Jobs...</div> : (
                    getFilteredTasks().length > 0 ? getFilteredTasks().map(renderCard) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Box size={48} className="mb-4 text-gray-200" />
                            <p>No jobs found in {activeTab}</p>
                        </div>
                    )
                )}
            </div>

            {/* Completion Modal */}
            {showCompleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <h2 className="text-xl font-bold mb-1">Complete Installation</h2>
                        <p className="text-xs text-gray-500 mb-6">Enter device details to notify Technical Staff.</p>

                        <form onSubmit={handleCompleteSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Input Router MAC</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-green-100 outline-none"
                                        placeholder="AA:BB:CC:DD:EE:FF"
                                        value={completionForm.mac}
                                        onChange={e => setCompletionForm({ ...completionForm, mac: e.target.value })}
                                        required
                                    />
                                    <Camera className="absolute right-3 top-3 text-gray-400" size={20} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Cabling Used (Meters)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                    placeholder="0"
                                    value={completionForm.cabling}
                                    onChange={e => setCompletionForm({ ...completionForm, cabling: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Field Notes</label>
                                <textarea
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                    rows="2"
                                    placeholder="Installation successful. Signal strength -20dBm."
                                    value={completionForm.notes}
                                    onChange={e => setCompletionForm({ ...completionForm, notes: e.target.value })}
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-200 hover:scale-[1.02] transition-transform">
                                SUBMIT JOB CARD
                            </button>
                            <button type="button" onClick={() => setShowCompleteModal(false)} className="w-full py-3 text-gray-500 font-bold">
                                CANCEL
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
