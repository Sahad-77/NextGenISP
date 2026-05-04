import { useState, useEffect } from "react";
import api from "../../config/api";
import { Plus, Trash, Edit2 } from "lucide-react";

export default function ManagePlans() {
    const [activeTab, setActiveTab] = useState("plans");
    const [plans, setPlans] = useState([]);
    const [hardware, setHardware] = useState([]);
    const [areas, setAreas] = useState([]);

    // Plan Form State
    const [planForm, setPlanForm] = useState({ name: "", speed_mbps: "", price: "", plan_type: "FIBER", area_ids: [] });

    // Hardware Form State
    const [hwForm, setHwForm] = useState({ name: "", price: "", description: "", image: null });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        fetchPlans();
        fetchAreas();
        fetchHardware();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get("/plans/");
            setPlans(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchHardware = async () => {
        try {
            const res = await api.get("/hardware/");
            setHardware(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAreas = async () => {
        try {
            const res = await api.get("/areas/");
            setAreas(res.data);
        } catch (err) { console.error(err); }
    };

    // --- PLAN HANDLERS ---
    const handlePlanSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/plans/${editId}/`, planForm);
            } else {
                await api.post("/plans/", planForm);
            }
            setPlanForm({ name: "", speed_mbps: "", price: "", plan_type: "FIBER", area_ids: [] });
            setIsEditing(false);
            setEditId(null);
            fetchPlans();
        } catch (err) { alert("Error saving plan"); }
    };

    const deletePlan = async (id) => {
        if (confirm("Delete this plan?")) {
            await api.delete(`/plans/${id}/`);
            fetchPlans();
        }
    };

    const editPlan = (plan) => {
        setPlanForm({
            name: plan.name,
            speed_mbps: plan.speed_mbps,
            price: plan.price,
            plan_type: plan.plan_type,
            area_ids: plan.areas.map(a => a.id)
        });
        setIsEditing(true);
        setEditId(plan.id);
        setActiveTab("plans"); // ensure tab
    };

    const toggleArea = (id) => {
        const current = planForm.area_ids;
        if (current.includes(id)) setPlanForm({ ...planForm, area_ids: current.filter(x => x !== id) });
        else setPlanForm({ ...planForm, area_ids: [...current, id] });
    };

    // --- HARDWARE HANDLERS ---
    const handleHardwareSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', hwForm.name);
        fd.append('price', hwForm.price);
        fd.append('description', hwForm.description);
        fd.append('is_active', 'true');
        if (hwForm.image instanceof File) fd.append('image', hwForm.image);

        try {
            if (isEditing && activeTab === 'hardware') {
                await api.patch(`/hardware/${editId}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
                alert("Hardware Updated");
            } else {
                await api.post("/hardware/", fd, { headers: { "Content-Type": "multipart/form-data" } });
                alert("Hardware Added");
            }
            setHwForm({ name: "", price: "", description: "", image: null });
            setIsEditing(false);
            setEditId(null);
            fetchHardware();
        } catch (err) { alert("Error saving hardware"); console.error(err); }
    };

    const deleteHardware = async (id) => {
        if (confirm("Delete this device?")) {
            await api.delete(`/hardware/${id}/`);
            fetchHardware();
        }
    };

    const editHardware = (hw) => {
        setHwForm({
            name: hw.name,
            price: hw.price,
            description: hw.description,
            image: null // Keep null, only update if new file chosen
        });
        setIsEditing(true);
        setEditId(hw.id);
        window.scrollTo(0, 0);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Manage Offerings</h1>

            {/* TAB NAV */}
            <div className="flex gap-4 mb-6 border-b pb-1">
                <button onClick={() => { setActiveTab("plans"); setIsEditing(false); setEditId(null); }} className={`pb-2 px-4 font-medium ${activeTab === "plans" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>Internet Plans</button>
                <button onClick={() => { setActiveTab("hardware"); setIsEditing(false); setEditId(null); }} className={`pb-2 px-4 font-medium ${activeTab === "hardware" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500"}`}>Hardware</button>
            </div>

            {/* PLANS TAB */}
            {activeTab === "plans" && (
                <>
                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <form onSubmit={handlePlanSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Plan Name</label>
                                <input value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Speed (Mbps)</label>
                                <input type="number" value={planForm.speed_mbps} onChange={e => setPlanForm({ ...planForm, speed_mbps: e.target.value })} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Price (₹)</label>
                                <input type="number" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} className="w-full p-2 border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select value={planForm.plan_type} onChange={e => setPlanForm({ ...planForm, plan_type: e.target.value })} className="w-full p-2 border rounded">
                                    <option value="FIBER">Fiber</option>
                                    <option value="WIRELESS">Wireless</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Available Areas</label>
                                <div className="flex flex-wrap gap-2">
                                    {areas.map(area => (
                                        <button
                                            key={area.id}
                                            type="button"
                                            onClick={() => toggleArea(area.id)}
                                            className={`px-3 py-1 rounded-full text-sm border ${planForm.area_ids.includes(area.id) ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200'}`}
                                        >
                                            {area.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                                    {isEditing ? "Update Plan" : "Create Plan"}
                                </button>
                                {isEditing && <button type="button" onClick={() => { setIsEditing(false); setEditId(null); setPlanForm({ name: "", speed_mbps: "", price: "", plan_type: "FIBER", area_ids: [] }); }} className="ml-4 text-gray-500 hover:text-gray-700">Cancel</button>}
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-100 rounded mt-1">{plan.plan_type}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-indigo-600">₹{plan.price}</p>
                                        <p className="text-sm text-gray-500">/month</p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-gray-600 mb-2">{plan.speed_mbps} Mbps Speed</p>
                                    <p className="text-sm text-gray-500">Available in {plan.areas.length} zones</p>
                                </div>
                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <button onClick={() => editPlan(plan)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded"><Edit2 size={18} /></button>
                                    <button onClick={() => deletePlan(plan.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* HARDWARE TAB */}
            {activeTab === "hardware" && (
                <>
                    <div className="bg-white p-6 rounded-lg shadow mb-8">
                        <form onSubmit={handleHardwareSubmit} className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Device Name</label>
                                <input value={hwForm.name} onChange={e => setHwForm({ ...hwForm, name: e.target.value })} className="w-full p-2 border rounded" placeholder="e.g. Pro Gaming Router" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (One-Time)</label>
                                    <input type="number" value={hwForm.price} onChange={e => setHwForm({ ...hwForm, price: e.target.value })} className="w-full p-2 border rounded" placeholder="2500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Image {isEditing && "(Leave blank to keep current)"}</label>
                                    <input type="file" onChange={e => setHwForm({ ...hwForm, image: e.target.files[0] })} className="w-full p-2 border rounded text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description / Features</label>
                                <textarea value={hwForm.description} onChange={e => setHwForm({ ...hwForm, description: e.target.value })} className="w-full p-2 border rounded" rows="3" placeholder="Bullet points about the router..."></textarea>
                            </div>
                            <div className="flex items-center gap-4">
                                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 w-full md:w-auto">
                                    {isEditing ? "Update Device" : "Add Device"}
                                </button>
                                {isEditing && <button type="button" onClick={() => { setIsEditing(false); setEditId(null); setHwForm({ name: "", price: "", description: "", image: null }); }} className="text-gray-500 hover:text-gray-700">Cancel</button>}
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {hardware.map(hw => (
                            <div key={hw.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                                <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                                    {hw.image ? <img src={hw.image} alt={hw.name} className="h-full w-full object-cover" /> : <span className="text-gray-400">No Image</span>}
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{hw.name}</h3>
                                        <span className="font-bold text-green-600">₹{hw.price}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-2 whitespace-pre-wrap">{hw.description}</p>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button onClick={() => editHardware(hw)} className="border border-indigo-200 text-indigo-600 py-1 rounded text-sm hover:bg-indigo-50">Edit</button>
                                        <button onClick={() => deleteHardware(hw.id)} className="border border-red-200 text-red-600 py-1 rounded text-sm hover:bg-red-50">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
