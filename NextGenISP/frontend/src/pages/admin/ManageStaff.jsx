import { useState, useEffect } from "react";
import api from "../../config/api";
import { Plus, Trash, Edit2, Shield, Wrench, Truck, User, MapPin } from "lucide-react";

export default function ManageStaff() {
    const [stats, setStats] = useState({ total: 0, tech: 0, field: 0 });
    const [staff, setStaff] = useState([]);
    const [areas, setAreas] = useState([]);

    // Form and UI State
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        username: "", email: "", password: "", role: "TECHNICAL_STAFF",
        phone_number: "", address: "", area: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, areaRes] = await Promise.all([
                api.get("/users/"),
                api.get("/areas/")
            ]);

            // Filter only Staff
            const staffMembers = usersRes.data.filter(u =>
                u.role === "TECHNICAL_STAFF" || u.role === "FIELD_STAFF" || u.role === "ADMIN"
            );
            setStaff(staffMembers);
            setAreas(areaRes.data);

            setStats({
                total: staffMembers.length,
                tech: staffMembers.filter(u => u.role === "TECHNICAL_STAFF").length,
                field: staffMembers.filter(u => u.role === "FIELD_STAFF").length
            });

        } catch (err) { console.error(err); }
    };

    const handleEdit = (user) => {
        setIsEditing(true);
        setEditingId(user.id);
        setForm({
            username: user.username,
            email: user.email,
            password: "", // Don't fill password
            role: user.role,
            phone_number: user.phone_number || "",
            address: user.address || "",
            area: user.area || "" // ID
        });
        setShowForm(true);
    };

    const openCreateForm = () => {
        setIsEditing(false);
        setEditingId(null);
        setForm({ username: "", email: "", password: "", role: "TECHNICAL_STAFF", phone_number: "", address: "", area: "" });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Clean payload
            const payload = { ...form };
            if (!payload.area) payload.area = null;
            if (!payload.password && isEditing) delete payload.password; // Don't send empty pass on edit

            if (isEditing) {
                await api.patch(`/users/${editingId}/`, payload);
                alert("Staff Member Updated Successfully");
            } else {
                await api.post("/users/", payload);
                alert("Staff Member Added Successfully");
            }

            setShowForm(false);
            openCreateForm(); // Reset
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Operation Failed: " + (err.response?.data?.detail || "Validation Error"));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to remove this staff member?")) return;
        try {
            await api.delete(`/users/${id}/`);
            fetchData();
        } catch (err) { alert("Error deleting user"); }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff Governance</h1>
                    <p className="text-gray-500 mt-1">Manage workforce, permissions, and assignments.</p>
                </div>
                <button onClick={openCreateForm} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-95">
                    <Plus size={20} /> Register New Staff
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-purple-100 p-4 rounded-xl text-purple-600"><Shield size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Total Workforce</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><Wrench size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Technical Team</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.tech}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-yellow-100 p-4 rounded-xl text-yellow-600"><Truck size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-gray-400">Field Runners</p>
                        <h3 className="text-2xl font-bold text-gray-900">{stats.field}</h3>
                    </div>
                </div>
            </div>

            {/* Staff List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Staff Directory</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4 text-left">Employee</th>
                            <th className="px-6 py-4 text-left">Role</th>
                            <th className="px-6 py-4 text-left">Assigned Area</th>
                            <th className="px-6 py-4 text-left">Contact</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {staff.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{u.username}</div>
                                            <div className="text-xs text-gray-500">ID: #{u.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-xs rounded-full font-semibold flex items-center gap-2 w-fit ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'TECHNICAL_STAFF' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {u.role === 'ADMIN' && <Shield size={12} />}
                                        {u.role === 'TECHNICAL_STAFF' && <Wrench size={12} />}
                                        {u.role === 'FIELD_STAFF' && <Truck size={12} />}
                                        {u.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {u.area_details ? (
                                        <span className="flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> {u.area_details.name}</span>
                                    ) : <span className="text-gray-400 italic">All Areas</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div>{u.email}</div>
                                    <div className="text-xs text-gray-400">{u.phone_number || 'No Phone'}</div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEdit(u)} className="text-gray-400 hover:text-indigo-600 transition-colors"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">{isEditing ? 'Edit Staff Details' : 'Register New Staff'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name / Username</label>
                                <input placeholder="e.g. Technician Arun" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder={isEditing ? "(Leave blank to keep same)" : "Required"}
                                        required={!isEditing}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role Assignment</label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="TECHNICAL_STAFF">Technical Staff (Activations & Tickets)</option>
                                    <option value="FIELD_STAFF">Field Staff (Installations & Repairs)</option>
                                    <option value="ADMIN">Admin (Full Access)</option>
                                </select>
                            </div>

                            {form.role !== 'ADMIN' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Area (Required for Staff)</label>
                                    <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required={form.role !== 'ADMIN'}>
                                        <option value="">Select Service Zone</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name} ({a.city})</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input placeholder="+91 987..." value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">
                                    {isEditing ? 'Update Staff Member' : 'Register Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
