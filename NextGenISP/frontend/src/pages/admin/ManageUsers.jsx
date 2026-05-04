import { useState, useEffect } from "react";
import api from "../../config/api";
import { Plus, Trash, Edit2, Shield, Eye, CreditCard, Activity, FileText, X } from "lucide-react";

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [areas, setAreas] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); // For 360 View
    const [showModal, setShowModal] = useState(false);

    // Create/Edit Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [form, setForm] = useState({
        username: "", email: "", password: "", role: "CUSTOMER",
        phone_number: "", address: "", area: ""
    });

    useEffect(() => {
        fetchUsers();
        fetchAreas();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users/");
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAreas = async () => {
        try { const res = await api.get("/areas/"); setAreas(res.data); } catch (err) { }
    };

    const handleEdit = (user) => {
        setForm({
            id: user.id,
            username: user.username,
            email: user.email,
            role: "CUSTOMER", // Locked to customer
            phone_number: user.phone_number,
            address: user.address,
            area: user.area || (user.area_details ? user.area_details.id : "")
        });
        setShowCreateForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;
        try {
            await api.delete(`/users/${id}/`);
            fetchUsers();
            alert("Customer Deleted");
        } catch (err) { alert("Failed to delete"); }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            if (form.id) {
                await api.patch(`/users/${form.id}/`, form);
                alert("Customer Updated Successfully");
            } else {
                await api.post("/users/", form);
                alert("Customer Created Successfully");
            }
            setForm({ id: null, username: "", email: "", password: "", role: "CUSTOMER", phone_number: "", address: "", area: "" });
            setShowCreateForm(false);
            fetchUsers();
        } catch (err) { alert("Failed to save customer"); }
    };

    const [userBilling, setUserBilling] = useState(null);

    const open360View = async (user) => {
        setSelectedUser(user);
        setUserBilling(null);
        setShowModal(true);
        try {
            const res = await api.get(`/users/${user.id}/customer_summary/`);
            setUserBilling(res.data);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customer Repository</h1>
                    <p className="text-gray-500 mt-1">View, edit, and manage all your subscribers.</p>
                </div>
                <button onClick={() => {
                    setForm({ id: null, username: "", email: "", password: "", role: "CUSTOMER", phone_number: "", address: "", area: "" });
                    setShowCreateForm(true);
                }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg flex items-center gap-2 transition-all">
                    <Plus size={20} /> Add New Subscriber
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left">Subscriber</th>
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-left">Plan / Area</th>
                            <th className="px-6 py-4 text-left">Contacts</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.filter(u => u.role === 'CUSTOMER').map(u => (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{u.first_name || u.username}</div>
                                            <div className="text-xs text-gray-500">ID: #{u.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                        u.status === 'SUSPENDED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {u.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-800">{u.area_details?.name || 'Unassigned Area'}</div>
                                    <div className="text-xs text-gray-500">{u.area_details?.city}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1.5">{u.phone_number || 'N/A'}</div>
                                    <div className="text-xs text-gray-400">{u.email}</div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 flex justify-end items-center">
                                    <button onClick={() => open360View(u)} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center gap-1">
                                        <Eye size={14} /> View
                                    </button>
                                    <button onClick={() => handleEdit(u)} className="text-gray-400 hover:text-indigo-600 p-1">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} className="text-gray-400 hover:text-red-600 p-1">
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CUSTOMER 360 MODAL */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold">
                                    {selectedUser.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedUser.username}</h2>
                                    <p className="text-slate-400 flex items-center gap-2 text-sm">
                                        <span className={`w-2 h-2 rounded-full ${selectedUser.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                                        {selectedUser.status} Customer  •  {selectedUser.area_details?.name}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* 1. Personal Details */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-indigo-600" /> Account Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-gray-50 pb-2">
                                            <span className="text-gray-500">Email</span>
                                            <span className="font-medium">{selectedUser.email}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-2">
                                            <span className="text-gray-500">Phone</span>
                                            <span className="font-medium">{selectedUser.phone_number}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-2">
                                            <span className="text-gray-500">Joined</span>
                                            <span className="font-medium">{selectedUser.date_joined ? new Date(selectedUser.date_joined).toLocaleDateString() : 'Just Joined'}</span>
                                        </div>
                                        <div className="pt-2">
                                            <span className="block text-gray-500 mb-1">Installation Address</span>
                                            <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedUser.address || "No Address Provided"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Subscription Status */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Activity size={18} className={selectedUser.status === 'ACTIVE' ? "text-green-600" : "text-gray-400"} />
                                        Live Usage
                                    </h3>

                                    {selectedUser.status === 'ACTIVE' ? (
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-lg">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-gray-500">Current Plan</span>
                                                    <span className="font-bold text-indigo-600">{userBilling?.active_plan_name || 'No Active Plan'}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-400 mt-2">
                                                    <span>450 GB Used</span>
                                                    <span>Unlimited</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-green-600">24ms</div>
                                                    <div className="text-xs text-green-800 font-bold uppercase">Latency</div>
                                                </div>
                                                <div className="bg-blue-50 p-3 rounded-lg text-center">
                                                    <div className="text-2xl font-bold text-blue-600">99.9%</div>
                                                    <div className="text-xs text-blue-800 font-bold uppercase">Uptime</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-center">
                                            <div className="bg-gray-100 p-3 rounded-full mb-3">
                                                <Activity size={24} />
                                            </div>
                                            <p className="font-medium text-gray-500">Service Not Active</p>
                                            <p className="text-xs mt-1 max-w-[200px]">Usage statistics will be available once the connection is installed and activated.</p>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Billing History */}
                                {selectedUser.status === 'ACTIVE' && (
                                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={18} className="text-orange-600" /> Recent Invoices</h3>
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-2">Invoice #</th>
                                                    <th className="px-4 py-2">Date</th>
                                                    <th className="px-4 py-2">Amount</th>
                                                    <th className="px-4 py-2">Status</th>
                                                    <th className="px-4 py-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userBilling?.invoices?.length > 0 ? (
                                                    userBilling.invoices.map(inv => (
                                                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-mono text-gray-600">INV-2026-{inv.id.toString().padStart(4, '0')}</td>
                                                            <td className="px-4 py-3">{new Date(inv.issue_date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 font-bold">₹{inv.amount}</td>
                                                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span></td>
                                                            <td className="px-4 py-3 text-right">
                                                                <a href={`${api.defaults.baseURL}invoices/${inv.id}/pdf/`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Download</a>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="5" className="text-center py-4 text-gray-400 text-xs">No billing history found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
                            <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold border border-transparent hover:border-red-100 transition-colors">Suspend Account</button>
                            <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors">Close Profile</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE FORM OVERLAY */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
                        {/* Re-using previous simple form logic or expanding it similarly */}
                        <h2 className="text-xl font-bold mb-4">Add New User</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full p-3 border rounded-lg" required />
                            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-3 border rounded-lg" required />
                            <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full p-3 border rounded-lg" required />

                            <div className="grid grid-cols-2 gap-4">
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full p-3 border rounded-lg">
                                    <option value="CUSTOMER">Customer</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="TECHNICAL_STAFF">Technical Staff</option>
                                    <option value="FIELD_STAFF">Field Staff</option>
                                </select>
                                <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full p-3 border rounded-lg">
                                    <option value="">Select Area</option>
                                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <input placeholder="Phone" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full p-3 border rounded-lg" />

                            <div className="flex gap-4 mt-4">
                                <button type="button" onClick={() => setShowCreateForm(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-lg font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
