import { useState, useEffect } from "react";
import api from "../../config/api";
import { Download, CreditCard, CheckCircle, AlertTriangle, Loader } from "lucide-react";
import SimulatedPaymentModal from "../../components/SimulatedPaymentModal";

export default function BillHistory() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices/');
            // Filter only for current user if backend doesn't automatically filter (Assuming it returns all for admin but filtered for user)
            // But usually API filters by request.user
            setInvoices(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDownloadPDF = async (id) => {
        try {
            const response = await api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `NextGen_Invoice_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (err) { alert("Failed to download PDF"); }
    };

    const handlePayNow = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async (method) => {
        try {
            setPayingId(selectedInvoice.id);
            // Fire request to the simple local simulated backend endpoint
            const res = await api.post('/payments/simulate/', {
                invoice_id: selectedInvoice.id,
                method: method
            });

            if (res.data.status === 'success') {
                setShowPaymentModal(false);
                setSelectedInvoice(null);
                fetchInvoices(); // Refresh the table
            } else {
                alert("Payment Simulation Failed: " + res.data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Error communicating with Simulated Server.");
        } finally {
            setPayingId(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Billing History</h1>
                    <p className="text-gray-500 mt-2">Track payments and download invoices.</p>
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Invoice ID</th>
                            <th className="px-6 py-4">Issue Date</th>
                            <th className="px-6 py-4">Plan</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-400">Loading invoices...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-400">No invoices generated yet.</td></tr>
                        ) : (
                            invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm text-gray-500">#{inv.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.issue_date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{inv.plan_name}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">₹{inv.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                            inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {inv.status === 'PAID' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {inv.status !== 'PAID' && (
                                            <button
                                                onClick={() => handlePayNow(inv)}
                                                disabled={payingId === inv.id}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {payingId === inv.id ? <Loader size={14} className="animate-spin" /> : <CreditCard size={14} />}
                                                PAY NOW
                                            </button>
                                        )}
                                        {inv.status === 'PAID' && (
                                            <button
                                                onClick={() => handleDownloadPDF(inv.id)}
                                                className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                                            >
                                                <Download size={14} /> Receipt
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mount Simulated Gateway */}
            {showPaymentModal && selectedInvoice && (
                <SimulatedPaymentModal
                    invoice={selectedInvoice}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}
