import { useState, useEffect } from "react";
import api from "../../config/api";
import { Package, Search, Plus, AlertTriangle, Monitor, Server, Cable } from "lucide-react";

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [hardware, setHardware] = useState([]); // [New] Hardware Catalog
    const [activeTab, setActiveTab] = useState("warehouse"); // [New] Tabs: warehouse | catalog
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: "", sku: "", quantity: 0, unit_price: 0, category: "ROUTER", low_stock_threshold: 5 });

    useEffect(() => {
        fetchInventory();
        fetchHardware();
    }, []);

    const fetchHardware = async () => {
        try {
            const res = await api.get("/hardware/");
            setHardware(res.data);
        } catch (err) { console.error("Error fetching hardware", err); }
    };

    const fetchInventory = async () => {
        try {
            const res = await api.get("/inventory/");
            setItems(res.data);
        } catch (err) {
            console.error("Error fetching inventory", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            await api.post("/inventory/", form);
            alert("Item Added Successfully");
            setShowModal(false);
            setForm({ name: "", sku: "", quantity: 0, unit_price: 0, category: "ROUTER", low_stock_threshold: 5 });
            fetchInventory();
        } catch (err) {
            alert("Failed to add inventory item");
        }
    };

    const getIcon = (cat) => {
        if (cat === 'ROUTER') return <Monitor size={20} className="text-blue-500" />;
        if (cat === 'CABLE') return <Cable size={20} className="text-gray-500" />;
        return <Package size={20} className="text-indigo-500" />;
    };

    const lowStockItems = items.filter(i => i.quantity < i.low_stock_threshold);

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventory & Assets</h1>
                    <p className="text-gray-500 mt-1">Track hardware stock, valuation, and asset assignment.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg transition-all active:scale-95">
                    <Plus size={20} /> Add Stock
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('warehouse')}
                    className={`pb-4 px-2 font-medium transition-colors border-b-2 ${activeTab === 'warehouse' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    Warehouse Stock
                </button>
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`pb-4 px-2 font-medium transition-colors border-b-2 ${activeTab === 'catalog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    Sales Catalog (Routers)
                </button>
            </div>

            {/* CATALOG VIEW */}
            {activeTab === 'catalog' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                    {hardware.map(hw => (
                        <div key={hw.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                            <div className="w-full h-48 bg-gray-50 rounded-xl mb-4 overflow-hidden border border-gray-100 relative group">
                                {hw.image ? (
                                    <img src={hw.image} alt={hw.name} className="w-full h-full object-contain mix-blend-multiply p-4 transition-transform group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Monitor size={48} />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{hw.name}</h3>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{hw.description}</p>
                            <div className="mt-auto">
                                <span className="text-2xl font-bold text-indigo-600">₹ {Number(hw.price).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    {hardware.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            No hardware in catalog.
                        </div>
                    )}
                </div>
            )}

            {/* WAREHOUSE VIEW */}
            {activeTab === 'warehouse' && (
                <>
                    {/* Low Stock Alert */}
                    {lowStockItems.length > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 flex items-center gap-4 animate-pulse">
                            <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-800">Low Stock Warning</h4>
                                <p className="text-sm text-red-600">
                                    {lowStockItems.length} items are below the threshold. Please restock immediately:
                                    <span className="font-semibold"> {lowStockItems.map(i => i.name).join(", ")}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm font-medium text-gray-400">Total Asset Value</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                ₹ {items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm font-medium text-gray-400">Total Items in Stock</p>
                            <h3 className="text-3xl font-bold text-indigo-600 mt-1">
                                {items.reduce((acc, i) => acc + i.quantity, 0)}
                            </h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm font-medium text-gray-400">Low Stock Alerts</p>
                            <h3 className={`text-3xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {lowStockItems.length}
                            </h3>
                        </div>
                    </div>

                    {/* Warehouse Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Server size={18} className="text-gray-500" /> Warehouse Stock
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input placeholder="Search SKU or Name..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Item Name</th>
                                    <th className="px-6 py-4">SKU</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-center">In Stock</th>
                                    <th className="px-6 py-4 text-right">Unit Value</th>
                                    <th className="px-6 py-4 text-right">Total Value</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                            <div className="bg-gray-100 p-2 rounded-lg">{getIcon(item.category)}</div>
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-sm">{item.sku}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">{item.category}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-900">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-600">₹ {Number(item.unit_price).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-medium text-indigo-600">₹ {(item.quantity * item.unit_price).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            {item.quantity < item.low_stock_threshold ? (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold animate-pulse">LOW STOCK</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">OK</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                            <Package size={48} className="mx-auto mb-3 opacity-20" />
                                            No items in warehouse. Add some stock!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Add Stock Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Add Inventory Item</h2>
                        <form onSubmit={handleAddStock} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                <input placeholder="e.g. Gigabit Router Model X" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Code</label>
                                    <input placeholder="RTR-001" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="ROUTER">Router/Modem</option>
                                        <option value="CABLE">Cable/Wiring</option>
                                        <option value="CONNECTOR">Connector/Part</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Value (₹)</label>
                                    <input type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: parseInt(e.target.value) })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                                <input type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">Save to Warehouse</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
