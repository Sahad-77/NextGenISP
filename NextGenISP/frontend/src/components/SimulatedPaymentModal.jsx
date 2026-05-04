import { useState } from "react";
import { CreditCard, QrCode, X, Loader, CheckCircle, ShieldCheck } from "lucide-react";

export default function SimulatedPaymentModal({ invoice, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState('card');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form states
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");

    // Simulate formatting
    const handleCardChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        let formatted = '';
        for (let i = 0; i < val.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += val[i];
        }
        setCardNumber(formatted.slice(0, 19));
    };

    const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            val = val.slice(0, 2) + '/' + val.slice(2, 4);
        }
        setExpiry(val);
    };

    const handleSimulatePayment = () => {
        if (activeTab === 'card') {
            if (cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3) {
                alert("Please enter valid mock card details.");
                return;
            }
        }

        setProcessing(true);

        // Simulate network / bank delay (3 seconds)
        setTimeout(() => {
            setProcessing(false);
            setSuccess(true);

            // Wait 1.5s then fire success callback to close & refresh
            setTimeout(() => {
                onSuccess(activeTab === 'card' ? 'CREDIT_CARD' : 'UPI');
            }, 1500);

        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="bg-gray-900 text-white p-6 relative">
                    <button onClick={onClose} disabled={processing || success} className="absolute top-4 right-4 text-gray-400 hover:text-white px-2 rounded disabled:opacity-50">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-2 text-indigo-400 font-bold mb-4 text-sm">
                        <ShieldCheck size={18} /> NEXTGEN SECURE PAY
                    </div>
                    <div className="text-gray-400 text-sm">Amount Due</div>
                    <div className="text-4xl font-bold">₹{invoice?.amount || "0.00"}</div>
                    <div className="text-gray-400 text-xs mt-1 font-mono">INV-{invoice?.id || "0000"}</div>
                </div>

                {/* Success State Overlay */}
                {success ? (
                    <div className="p-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h3>
                        <p className="text-gray-500">Redirecting to dashboard...</p>
                    </div>
                ) : (
                    <div className="p-6">
                        {/* Tabs */}
                        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                            <button
                                onClick={() => setActiveTab('card')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'card' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <CreditCard size={16} /> Credit Card
                            </button>
                            <button
                                onClick={() => setActiveTab('upi')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'upi' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <QrCode size={16} /> UPI QR
                            </button>
                        </div>

                        {/* Card Form */}
                        {activeTab === 'card' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Card Number</label>
                                    <div className="relative">
                                        <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="4242 4242 4242 4242"
                                            value={cardNumber}
                                            onChange={handleCardChange}
                                            disabled={processing}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-mono text-gray-900 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Expiry</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={expiry}
                                            onChange={handleExpiryChange}
                                            disabled={processing}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-mono text-gray-900 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">CVV</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            maxLength="3"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                            disabled={processing}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-mono text-gray-900 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* UPI QR Form */}
                        {activeTab === 'upi' && (
                            <div className="flex flex-col items-center justify-center py-4 animate-in fade-in slide-in-from-right-4 duration-300 border-2 border-dashed border-gray-200 rounded-xl">
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4">
                                    {/* Using Lucide QrCode as a massive placeholder, or an img if generated. This is highly effective for simulation. */}
                                    <QrCode size={160} className="text-gray-800" strokeWidth={1} />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-gray-900 text-lg">Scan to Pay</p>
                                    <p className="text-sm text-gray-500 mt-1 max-w-[250px]">Open Google Pay, PhonePe, or Paytm and scan the QR code above.</p>
                                </div>
                            </div>
                        )}

                        {/* Pay Button */}
                        <div className="mt-8">
                            <button
                                onClick={handleSimulatePayment}
                                disabled={processing}
                                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 disabled:bg-indigo-400 disabled:cursor-wait"
                            >
                                {processing ? (
                                    <>
                                        <Loader size={20} className="animate-spin" />
                                        Authenticating Bank...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={20} />
                                        Pay ₹{invoice?.amount || "0.00"} Securely
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4 flex justify-center items-center gap-1">
                                <CreditCard size={12} /> Test Mode Environment
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
