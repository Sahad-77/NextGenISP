import { useState, useEffect } from "react";
import api from "../../config/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, CheckCircle, AlertTriangle } from "lucide-react";

export default function WorkloadMonitor() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/reports/workload/")
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getLoadColor = (count) => {
        if (count > 5) return "text-red-600 bg-red-50";
        if (count > 2) return "text-orange-600 bg-orange-50";
        return "text-green-600 bg-green-50";
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Workload Monitor</h1>
            <p className="text-gray-500 mb-8">Real-time tracking of active installations and support tickets per staff member.</p>

            {loading ? <div className="text-center py-20">Loading Workload Data...</div> : (
                <div className="space-y-8">

                    {/* CHART SECTION */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-4">Current Load Distribution</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="username" />
                                    <YAxis />
                                    <Tooltip cursor={{ fill: '#F3F4F6' }} />
                                    <Legend />
                                    <Bar dataKey="installations" name="Active Installs" fill="#4F46E5" stackId="a" />
                                    <Bar dataKey="tickets" name="Open Tickets" fill="#F97316" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* DETAILED TABLE */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Staff Performance Metrics</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Sorted by Total Load</span>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Staff Member</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3 text-center">Installations</th>
                                    <th className="px-6 py-3 text-center">Tickets</th>
                                    <th className="px-6 py-3 text-center">Total Load</th>
                                    <th className="px-6 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map(staff => (
                                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {staff.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            {staff.username}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{staff.role}</td>
                                        <td className="px-6 py-4 text-center font-bold text-indigo-600">{staff.installations}</td>
                                        <td className="px-6 py-4 text-center font-bold text-orange-500">{staff.tickets}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getLoadColor(staff.total)}`}>
                                                {staff.total}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {staff.total === 0 ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={14} /> Available</span>
                                            ) : staff.total > 5 ? (
                                                <span className="inline-flex items-center gap-1 text-red-600 text-xs"><AlertTriangle size={14} /> Overloaded</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Active</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
