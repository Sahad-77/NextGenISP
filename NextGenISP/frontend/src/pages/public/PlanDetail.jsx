import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../config/api";
import { ArrowLeft, CheckCircle, Wifi, Activity, ArrowRight, Server, Shield } from "lucide-react";

export default function PlanDetail() {
    const { id } = useParams();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchPlan = async () => {
            try {
                const res = await api.get(`/plans/${id}/`);
                setPlan(res.data);
            } catch (err) {
                console.error("Failed to fetch plan details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!plan) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
            <h2 className="text-2xl font-bold mb-4">Plan Not Found</h2>
            <Link to="/" className="text-indigo-600 hover:underline">Go back home</Link>
        </div>
    );

    const features = plan.features ? plan.features.split(',') : [];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/#plans" className="flex items-center text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Plans
                    </Link>
                    <div className="font-bold text-xl text-slate-900">{plan.name}</div>
                    <Link to="/register" className="hidden sm:inline-flex bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 shadow-sm transition-transform hover:scale-105">
                        Subscribe Now
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-indigo-900 text-white py-24 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10 animate-in slide-in-from-bottom duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-800/50 border border-indigo-700 text-indigo-200 text-sm font-bold tracking-wide mb-8">
                        <Activity size={16} /> {plan.plan_type} CONNECTION
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                        {plan.speed_mbps} <span className="text-3xl md:text-5xl text-indigo-300 font-medium">Mbps</span>
                    </h1>
                    <p className="text-2xl md:text-3xl text-indigo-100 font-light max-w-3xl mx-auto mb-10">
                        {plan.hero_tagline || "Experience ultra-fast internet designed for your needs."}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="text-5xl font-black text-white">
                            ₹{Number(plan.price).toLocaleString()} <span className="text-xl text-indigo-300 font-medium">/ month</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Features Grip */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-24 relative z-20">
                    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                            <Activity className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Uncapped Data</h3>
                        <p className="text-slate-500 text-sm">Enjoy {plan.data_limit_gb}GB of high-speed data without overage fees.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                            <Server className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Symmetric Speeds</h3>
                        <p className="text-slate-500 text-sm">Equal {plan.speed_mbps} Mbps upload and download speeds.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Connection</h3>
                        <p className="text-slate-500 text-sm">Enterprise-grade security and DDoS protection included.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                            <CheckCircle className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">24/7 Support</h3>
                        <p className="text-slate-500 text-sm">Priority access to our technical support team.</p>
                    </div>
                </div>
            </div>

            {/* Plan Highlights & Features */}
            {features.length > 0 && (
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-10">Premium Plan Benefits</h2>
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm">
                        <ul className="space-y-6">
                            {features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-4">
                                    <div className="mt-1 bg-green-100 text-green-600 rounded-full p-1 shrink-0">
                                        <CheckCircle size={20} />
                                    </div>
                                    <span className="text-lg text-slate-700 font-medium">{feature.trim()}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Recommended Hardware Section */}
            {plan.recommended_hardware && plan.recommended_hardware.length > 0 && (
                <div className="bg-slate-100 border-t border-slate-200 py-20 px-4 mt-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">Optimized Gear</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Recommended Routers</h2>
                            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">To get the absolute best performance from the {plan.name} plan, we highly recommend pairing it with one of these devices.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {plan.recommended_hardware.map(hw => (
                                <Link to={`/hardware/${hw.id}`} key={hw.id} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-400 transition-all flex flex-col group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl z-10">Best Match</div>

                                    <div className="w-full h-48 bg-slate-50 rounded-2xl mb-6 flex items-center justify-center overflow-hidden border border-slate-100">
                                        {hw.image ? (
                                            <img src={hw.image} alt={hw.name} className="max-h-full object-contain mix-blend-multiply" />
                                        ) : (
                                            <Wifi size={48} className="text-slate-300" />
                                        )}
                                    </div>

                                    <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{hw.name}</h3>
                                    <p className="text-slate-500 mb-6 flex-1">{hw.hero_tagline || hw.description}</p>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                                        <div className="text-xl font-bold text-slate-900">₹{Number(hw.price).toLocaleString()}</div>
                                        <div className="text-indigo-600 font-semibold group-hover:translate-x-2 transition-transform flex items-center gap-1">
                                            View Specs <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom CTA */}
            <div className="bg-slate-900 py-20 px-4 text-center">
                <h2 className="text-4xl font-bold text-white mb-6">Ready to get started?</h2>
                <p className="text-slate-400 max-w-2xl mx-auto mb-10 text-lg">Join thousands of happy customers experiencing true high-speed internet.</p>
                <Link to="/register" className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-indigo-500 shadow-xl shadow-indigo-900/50 transition-transform hover:scale-105">
                    Select {plan.name} at Checkout
                </Link>
            </div>
        </div>
    );
}
