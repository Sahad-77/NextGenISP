import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../config/api";
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, Wifi } from "lucide-react";

export default function RouterDetail() {
    const { id } = useParams();
    const [hardware, setHardware] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchHardware = async () => {
            try {
                const res = await api.get(`/hardware/${id}/`);
                setHardware(res.data);
            } catch (err) {
                console.error("Failed to fetch hardware details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHardware();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!hardware) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
            <h2 className="text-2xl font-bold mb-4">Router Not Found</h2>
            <Link to="/" className="text-indigo-600 hover:underline">Go back home</Link>
        </div>
    );

    // Safely parse JSON features and specifications
    const features = hardware.features ? hardware.features.split(',') : [];
    let specifications = {};
    try {
        specifications = hardware.specifications ? JSON.parse(hardware.specifications) : {};
    } catch (e) {
        console.error("Failed to parse specifications JSON");
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Catalog
                    </Link>
                    <div className="font-bold text-xl text-slate-900 line-clamp-1">{hardware.name}</div>
                    <Link to="/register" className="hidden sm:inline-flex bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 shadow-sm transition-transform hover:scale-105">
                        Get Connected
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="text-center lg:text-left animate-in slide-in-from-left duration-700 space-y-6">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold tracking-wide">
                            ENTERPRISE GRADE HARDWARE
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
                            {hardware.name}
                        </h1>
                        <p className="text-2xl text-slate-300 font-light max-w-2xl mx-auto lg:mx-0">
                            {hardware.hero_tagline || hardware.description.split('.')[0]}
                        </p>
                        <div className="text-4xl font-black text-indigo-400 pt-4">
                            ₹{Number(hardware.price).toLocaleString()} <span className="text-lg text-slate-500 font-medium font-sans">one-time</span>
                        </div>
                    </div>

                    <div className="flex justify-center lg:justify-end animate-in fade-in duration-1000 zoom-in-95">
                        {hardware.image ? (
                            <img src={hardware.image} alt={hardware.name} className="w-full max-w-lg object-contain drop-shadow-2xl" />
                        ) : (
                            <div className="w-64 h-64 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
                                <Wifi className="w-24 h-24 text-slate-600" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Features Grid */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">Why choose the {hardware.name}?</h2>
                    <p className="text-lg text-slate-500 mt-2">Engineered for performance, built for reliability.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.length > 0 ? features.map((feature, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-xl transition-shadow group">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                {idx % 4 === 0 ? <Zap className="w-7 h-7" /> : idx % 4 === 1 ? <ShieldCheck className="w-7 h-7" /> : idx % 4 === 2 ? <Wifi className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{feature.trim()}</h3>
                        </div>
                    )) : (
                        <div className="col-span-full text-center text-slate-500">Full detailed features coming soon.</div>
                    )}
                </div>
            </div>

            {/* Full Description & Specs Section */}
            <div className="bg-white border-t border-slate-200 py-20 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Left: Description */}
                    <div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-6">Product Overview</h3>
                        <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {hardware.description}
                        </p>
                    </div>

                    {/* Right: Spec Table */}
                    <div>
                        <h3 className="text-3xl font-bold text-slate-900 mb-6">Technical Specifications</h3>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-200">
                                    {Object.entries(specifications).map(([key, value], idx) => (
                                        <tr key={idx} className="hover:bg-slate-100 transition-colors">
                                            <th className="px-6 py-4 text-sm font-semibold text-slate-700 bg-slate-100/50 w-1/3">{key}</th>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">{value}</td>
                                        </tr>
                                    ))}
                                    {Object.keys(specifications).length === 0 && (
                                        <tr>
                                            <td className="px-6 py-8 text-center text-slate-500" colSpan="2">
                                                Technical specifications will be updated shortly.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="bg-indigo-600 py-16 px-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-6">Ready to upgrade your home network?</h2>
                <Link to="/register" className="inline-block bg-white text-indigo-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-100 shadow-xl transition-transform hover:scale-105">
                    Select this Router at Checkout
                </Link>
            </div>
        </div>
    );
}
