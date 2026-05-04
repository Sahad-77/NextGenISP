import { useState, useEffect } from "react";
import api from "../../config/api";
import { DollarSign, Search, Users, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function Finance() {
    const [activeTab, setActiveTab] = useState("cash_counter");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchedUser, setSearchedUser] = useState(null);
    const [pendingInvoices, setPendingInvoices] = useState([]);
    const [defaulters, setDefaulters] = useState([]);
    const [selectedDefaulters, setSelectedDefaulters] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (activeTab === "defaulters") fetchDefaulters();
        if (activeTab === "history") fetchTransactions();
    }, [activeTab]);

    // --- Cash Counter Logic ---
    const handleSearchUser = async (e) => {
        e.preventDefault();
        setSearchedUser(null);
        setPendingInvoices([]);
        try {
            // Simple search by exact username for now
            const res = await api.get(`/users/?search=${searchQuery}`);
            const user = res.data.find(u => u.username.toLowerCase() === searchQuery.toLowerCase() || u.email === searchQuery);

            if (user) {
                setSearchedUser(user);
                fetchPendingInvoices(user.id);
            } else {
                alert("User not found (Try exact username)");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchPendingInvoices = async (userId) => {
        try {
            const res = await api.get(`/invoices/pending/${userId}/`);
            setPendingInvoices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePayInvoice = async (invoiceId, amount) => {
        if (!confirm(`Confirm cash payment of ₹${amount}?`)) return;
        try {
            await api.post("/payments/", {
                invoice: invoiceId,
                amount: amount,
                transaction_id: `CASH-${Date.now()}`,
                method: "CASH"
            });
            alert("Payment Recorded & User Activated (if suspended).");
            fetchPendingInvoices(searchedUser.id);
        } catch (err) {
            alert("Payment Failed");
        }
    };

    // --- Defaulters Logic ---
    const fetchDefaulters = async () => {
        try {
            // Mock logic: Get users who are not suspended but have mock overdue status (In real app, filter by invoice due_date)
            // For now, listing all ACTIVE users to demonstrate Bulk Action
            const res = await api.get("/users/");
            // Simulate defaulters randomly for demo purposes if no real invoice logic
            const allUsers = res.data.filter(u => u.role === 'CUSTOMER' && u.status !== 'SUSPENDED');
            setDefaulters(allUsers);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkSuspend = async () => {
        if (!confirm(`Suspend ${selectedDefaulters.length} users?`)) return;
        try {
            await api.post("/users/bulk_suspend/", { user_ids: selectedDefaulters });
            alert("Users Suspended Successfully");
            fetchDefaulters();
            setSelectedDefaulters([]);
        } catch (err) {
            alert("Bulk Suspend Failed");
        }
    };

    const toggleDefaulterSelection = (id) => {
        if (selectedDefaulters.includes(id)) {
            setSelectedDefaulters(selectedDefaulters.filter(d => d !== id));
        } else {
            setSelectedDefaulters([...selectedDefaulters, id]);
        }
    };

    // --- History Logic ---
    const fetchTransactions = async () => {
        try {
            const res = await api.get("/payments/");
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Financial Control</h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-8">
                <button onClick={() => setActiveTab("cash_counter")} className={`pb-3 px-4 text-sm font-semibold transition-colors ${activeTab === 'cash_counter' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    Cash Counter
                </button>
                <button onClick={() => setActiveTab("defaulters")} className={`pb-3 px-4 text-sm font-semibold transition-colors ${activeTab === 'defaulters' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    Defaulters & Bulk Suspend
                </button>
                <button onClick={() => setActiveTab("history")} className={`pb-3 px-4 text-sm font-semibold transition-colors ${activeTab === 'history' ? 'text-gray-600 border-b-2 border-gray-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    Transaction History
                </button>
            </div>

            {/* CASH COUNTER */}
            {activeTab === "cash_counter" && (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Search size={20} /> Find Customer</h3>
                        <form onSubmit={handleSearchUser} className="flex gap-2">
                            <input
                                placeholder="Enter Username or Email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="flex-1 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button type="submit" className="bg-indigo-600 text-white px-6 rounded-lg font-medium hover:bg-indigo-700">Search</button>
                        </form>
                    </div>

                    {searchedUser && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{searchedUser.username}</h2>
                                    <p className="text-gray-500 text-sm">{searchedUser.email}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${searchedUser.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {searchedUser.status}
                                </span>
                            </div>

                            <h4 className="font-bold text-gray-700 mb-4">Pending Invoices</h4>
                            {pendingInvoices.length === 0 ? (
                                <p className="text-gray-400 text-center py-4">No pending invoices found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {pendingInvoices.map(inv => (
                                        <div key={inv.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <p className="font-bold text-gray-800">#{inv.id} - {inv.plan_name}</p>
                                                <p className="text-sm text-gray-500">Due: {inv.due_date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-indigo-600 mb-1">₹ {inv.amount}</p>
                                                <button
                                                    onClick={() => handlePayInvoice(inv.id, inv.amount)}
                                                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 transition"
                                                >
                                                    Pay Cash
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* DEFAULTERS */}
            {activeTab === "defaulters" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-red-800 font-bold">
                            <AlertCircle size={20} />
                            <span>Potential Defaulters (Active Users)</span>
                        </div>
                        {selectedDefaulters.length > 0 && (
                            <button
                                onClick={handleBulkSuspend}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm"
                            >
                                Suspend {selectedDefaulters.length} Users
                            </button>
                        )}
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input type="checkbox" onChange={e => {
                                        if (e.target.checked) setSelectedDefaulters(defaulters.map(d => d.id));
                                        else setSelectedDefaulters([]);
                                    }} />
                                </th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Area</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {defaulters.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedDefaulters.includes(user.id)}
                                            onChange={() => toggleDefaulterSelection(user.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                                    <td className="px-6 py-4 text-gray-500">{user.phone_number || 'N/A'}</td>
                                    <td className="px-6 py-4"><span className="text-green-600 font-bold text-xs">{user.status}</span></td>
                                    <td className="px-6 py-4 text-gray-500">{user.area_details?.name || '-'}</td>
                                </tr>
                            ))}
                            {defaulters.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-400">No active users to suspend.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TRANSACTION HISTORY */}
            {activeTab === "history" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-sm text-gray-500">#{tx.transaction_id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(tx.payment_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium">
                                        {tx.invoice_details?.customer_name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.method === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {tx.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">₹ {Number(tx.amount).toLocaleString()}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-400">No transactions recorded yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
