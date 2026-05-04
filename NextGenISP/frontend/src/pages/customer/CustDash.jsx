import { useState, useEffect } from "react";
import api from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { Wifi, Home, Bell, CreditCard, Activity, Wrench, ChevronRight, ArrowRight, FileText, CheckCircle, AlertTriangle, WifiOff, MapPin, Zap, X, ShieldAlert, HelpCircle, Smartphone, Clock, Upload, Shield, Radio } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Link } from "react-router-dom";
import DiagnosticTerminal from '../../components/DiagnosticTerminal';
import SpeedTestGauge from '../../components/SpeedTestGauge';

export default function CustomerDashboard() {
    const { user, login } = useAuth();
    const [usage, setUsage] = useState(0); // GB Used
    const [trafficStats, setTrafficStats] = useState([]); // DPI Data
    const [showTerminal, setShowTerminal] = useState(false); // Controls Diagnostics Terminal
    const [maintenanceAlert, setMaintenanceAlert] = useState(null); // Maintenance Banner
    const [planLimit, setPlanLimit] = useState(1000); // GB Limit (Mock)
    const [dueAmount, setDueAmount] = useState(0);
    const [pendingInvoices, setPendingInvoices] = useState([]); // Full invoice list
    const [nextBillingDate, setNextBillingDate] = useState(null); // Upcoming invoice date
    const [activePlan, setActivePlan] = useState(null); // Customer's active plan details
    const [billingLoaded, setBillingLoaded] = useState(false); // Track if billing was checked
    const [plans, setPlans] = useState([]);
    const [hardware, setHardware] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Plan Upgrade State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeProcessing, setUpgradeProcessing] = useState(false);

    // New State for Plan Selection Flow
    const [showRouterModal, setShowRouterModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedRouter, setSelectedRouter] = useState(null);
    const [selectedHardwareId, setSelectedHardwareId] = useState(null); // Track hardware ID explicitly
    const [ownRouterDetails, setOwnRouterDetails] = useState({ model: '', mac: '', file: null });
    const [installationDetails, setInstallationDetails] = useState(null);

    useEffect(() => {
        if (!user) return;

        // Silent sync with backend for latest status
        const syncStatus = async () => {
            try {
                const res = await api.get(`/users/${user.id}/`);
                if (res.data.status !== user.status && login) {
                    // Retain the existing token when merging user data (the GET /users/id doesn't return the token)
                    login({ ...user, ...res.data, token: user.token });
                }
            } catch (err) {
                console.error("Silent sync failed", err);
            }
        };
        syncStatus();

        if (user.status === 'ACTIVE') {
            fetchActiveData();
            fetchOnboardingData(); // Fetch plans for the Upgrade Modal
        } else if (['LEAD', 'VERIFIED'].includes(user.status)) {
            fetchOnboardingData();
        } else if (['READY_TO_INSTALL', 'INSTALLATION_PENDING'].includes(user.status)) {
            fetchInstallationDetails();
        }
    }, [user?.status]);

    const fetchActiveData = async () => {
        try {
            const pendingRes = await api.get(`/invoices/pending/${user?.id}/`);
            // The new backend returns { invoices: [...], next_billing_date: "..." }
            const invoiceList = pendingRes.data.invoices !== undefined ? pendingRes.data.invoices : pendingRes.data;
            const nextDate = pendingRes.data.next_billing_date;

            const totalDue = invoiceList.reduce((acc, inv) => acc + parseFloat(inv.amount), 0);
            setDueAmount(totalDue);
            setPendingInvoices(invoiceList);
            setNextBillingDate(nextDate || null);
            if (pendingRes.data.active_plan_name) {
                setActivePlan({
                    name: pendingRes.data.active_plan_name,
                    speed: pendingRes.data.active_plan_speed
                });
            }
            setBillingLoaded(true);

            // Fetch Traffic Stats from Backend API
            const trafficRes = await api.get(`/users/${user?.id}/traffic_stats/`);
            setTrafficStats(trafficRes.data);

            // Calculate total usage from the DPI data
            const total = trafficRes.data.reduce((acc, stat) => acc + stat.value, 0);
            setUsage(total);

            // Fetch Area Maintenance Status
            if (user?.area) {
                const areaRes = await api.get(`/areas/${user.area}/`);
                if (areaRes.data.is_under_maintenance) {
                    setMaintenanceAlert(areaRes.data.maintenance_message || "Emergency Network Maintenance in your zone. You may experience downtime.");
                }
            }
        } catch (err) { console.error(err); }
    };

    const fetchOnboardingData = async () => {
        try {
            setLoadingPlans(true);
            const res = await api.get('/plans/');
            setPlans(res.data);
            const hwRes = await api.get('/hardware/');
            setHardware(hwRes.data);
        } catch (err) {
            console.error("Failed to fetch plans");
        } finally {
            setLoadingPlans(false);
        }
    };

    const fetchInstallationDetails = async () => {
        try {
            // Find the active installation task for this user
            const res = await api.get('/tasks/');
            // Filter client-side or use a specific endpoint if available
            // Assuming /installations/ returns all for admin but filtered for user in backend
            // In a real app we might need a specific endpoint like /users/me/installation
            // But let's assume the list returns relevant tasks
            const task = res.data.find(t => t.customer === user.id && t.status !== 'CLOSED') || res.data[0];
            if (task) setInstallationDetails(task);
        } catch (err) { console.error("Failed to fetch installation details", err); }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setShowRouterModal(true);
        setSelectedRouter(null); // Reset router selection
    };

    const confirmSelection = async () => {
        if (!selectedPlan || !selectedRouter) return;

        // Basic validation for own device
        if (selectedRouter === 'Own Device') {
            if (!ownRouterDetails.model) {
                alert("Please enter your Router Model.");
                return;
            }
        }

        try {
            const formData = new FormData();
            formData.append('plan_id', selectedPlan.id);
            formData.append('router_selection', selectedRouter);
            if (selectedHardwareId) formData.append('hardware_id', selectedHardwareId);

            if (selectedRouter === 'Own Device') {
                formData.append('own_router_model', ownRouterDetails.model);
                if (ownRouterDetails.mac) formData.append('own_router_mac', ownRouterDetails.mac);
                if (ownRouterDetails.file) formData.append('own_router_image', ownRouterDetails.file);
            }

            await api.post(`/users/${user.id}/select_plan/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setShowRouterModal(false);
            alert(`Great choice! We have recorded your selection.\nPlan: ${selectedPlan.name}\nRouter: ${selectedRouter}`);

            // Instantly update local state so UI shifts to READY_TO_INSTALL
            if (login) {
                const updatedUser = { ...user, status: 'READY_TO_INSTALL' };
                login(updatedUser);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit selection. Please try again.");
        }
    };

    const handlePlanInterest = async (plan) => {
        // Deprecated - replaced by confirmSelection
    };

    // Derived Status Color
    const getStatusColor = () => {
        if (user?.status === 'ACTIVE') return 'bg-green-500';
        if (user?.status === 'SUSPENDED') return 'bg-red-500';
        if (user?.status === 'INSTALLATION_PENDING') return 'bg-orange-500';
        if (user?.status === 'LEAD') return 'bg-blue-500';
        return 'bg-gray-400';
    };

    const getStatusText = () => {
        if (user?.status === 'ACTIVE') return 'Online';
        if (user?.status === 'SUSPENDED') return 'Suspended (Due)';
        if (user?.status === 'INSTALLATION_PENDING') return 'Installation Scheduled';
        if (user?.status === 'LEAD') return 'Verification Pending';
        return 'Offline';
    };

    // --- RENDER ONBOARDING VIEW (For LEAD / VERIFIED / READY_TO_INSTALL / INSTALLATION_PENDING) ---
    if (['LEAD', 'VERIFIED', 'READY_TO_INSTALL', 'INSTALLATION_PENDING'].includes(user?.status)) {
        return (
            <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
                {/* Header Section */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.username}</h2>
                        {activePlan ? (
                            <p className="text-gray-500 font-medium text-sm lg:text-base">
                                Current Plan: <span className="text-indigo-600 font-bold">{activePlan.name}</span>
                                {activePlan.speed && ` • ${activePlan.speed} Mbps`}
                            </p>
                        ) : (
                            <p className="text-gray-500">Manage your network, view usage, and pay bills.</p>
                        )}
                    </div>
                </div> {/* Status Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12 max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center shrink-0 ${['LEAD', 'READY_TO_INSTALL'].includes(user.status) ? 'bg-blue-100 text-blue-600' : (user.status === 'VERIFIED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600')}`}>
                            {user.status === 'VERIFIED' ? <CheckCircle size={40} /> : (user.status === 'INSTALLATION_PENDING' ? <Clock size={40} /> : <FileText size={40} />)}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                {user.status === 'LEAD' && 'Application Under Review'}
                                {user.status === 'VERIFIED' && 'Identity Verified - Select Plan'}
                                {user.status === 'READY_TO_INSTALL' && 'Great! Plan Selected'}
                                {user.status === 'INSTALLATION_PENDING' && 'Installation In Progress'}
                            </h2>
                            <p className="text-gray-500 leading-relaxed">
                                {user.status === 'LEAD' && "We have received your registration details and ID proof. Our admin team is currently verifying your documents."}
                                {user.status === 'VERIFIED' && "Your identity has been verified! Please select a plan below to proceed with the installation."}
                                {user.status === 'READY_TO_INSTALL' && (
                                    <span>
                                        You have successfully selected your plan. Our team has been notified.<br />
                                        <strong>Wait for our call to schedule the installation.</strong>
                                    </span>
                                )}
                                {user.status === 'INSTALLATION_PENDING' && "Great news! Our technical team has been assigned and is working on your installation."}
                            </p>

                            {/* PREVIEW OF SELECTION */}
                            {['READY_TO_INSTALL', 'INSTALLATION_PENDING'].includes(user.status) && installationDetails && (
                                <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-left max-w-md">
                                    <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Your Selection</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div className="whitespace-pre-line font-medium text-indigo-700">{installationDetails.notes}</div>
                                        <div>Router Required: <strong>{installationDetails.is_router_required ? 'Yes' : 'No (Own Device)'}</strong></div>

                                        {!installationDetails.is_router_required && installationDetails.own_router_model && (
                                            <div className="mt-2 bg-white rounded p-2 text-xs border border-gray-200">
                                                <div className="font-semibold text-gray-800">Your Device: {installationDetails.own_router_model}</div>
                                                {installationDetails.own_router_mac && <div className="text-gray-500 font-mono">MAC: {installationDetails.own_router_mac}</div>}
                                                {installationDetails.own_router_image && (
                                                    <a href={installationDetails.own_router_image} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline mt-1 inline-block">View Uploaded Image</a>
                                                )}
                                            </div>
                                        )}

                                        <div className="text-xs text-gray-400 mt-3">Submitted on {new Date(installationDetails.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                                <span className={`w-3 h-3 rounded-full ${getStatusColor()}`}></span>
                                Status: <span className="uppercase">{user.status.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Selection Section (Only for VERIFIED) */}
                {user.status === 'VERIFIED' && (
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-gray-900">Select Your Preferred Plan</h3>
                            <p className="text-gray-500 text-sm">Choose a plan to initiate the installation process.</p>
                        </div>

                        {loadingPlans ? (
                            <div className="text-center py-10">Loading Plans...</div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map(plan => (
                                    <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all p-6 flex flex-col">
                                        <div className="mb-4">
                                            <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                                                <span className="text-sm text-gray-500">/mo</span>
                                            </div>
                                        </div>
                                        <ul className="mb-6 space-y-3 flex-1">
                                            <li className="flex items-center gap-2 text-sm text-gray-600"><Wifi size={16} className="text-indigo-600" /> {plan.speed_mbps} Mbps Speed</li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600"><Activity size={16} className="text-indigo-600" /> Unlimited Data</li>
                                            <li className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle size={16} className="text-indigo-600" /> Free Standard Router</li>
                                        </ul>
                                        <button
                                            onClick={() => handlePlanSelect(plan)}
                                            className="w-full py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-bold hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            Select Plan <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ROUTER SELECTION MODAL */}
                {showRouterModal && selectedPlan && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">Choose Your Device</h3>
                                <p className="text-gray-500">Pair your <strong>{selectedPlan.name}</strong> with the perfect router.</p>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {/* Dynamic Hardware Options from DB */}
                                {hardware.length > 0 ? hardware.map(hw => (
                                    <div
                                        key={hw.id}
                                        onClick={() => { setSelectedRouter(`${hw.name} (+₹${hw.price})`); setSelectedHardwareId(hw.id); }}
                                        className={`p-4 rounded-xl border-2 cursor-pointer flex items-start gap-4 transition-all ${selectedRouter === `${hw.name} (+₹${hw.price})` ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                                            {hw.image ? <img src={hw.image} alt={hw.name} className="w-full h-full object-cover" /> : <Wifi size={40} className="text-gray-400" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{hw.name}</h4>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{hw.hero_tagline || hw.description}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="inline-block text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">+ ₹{hw.price} (One-time)</span>
                                                <Link
                                                    to={`/hardware/${hw.id}`}
                                                    target="_blank"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                                                >
                                                    View Specs <ArrowRight size={12} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-sm text-gray-500 italic p-2">Loading hardware options...</div>
                                )}

                                {/* Option 3: Own Device */}
                                <div
                                    onClick={() => { setSelectedRouter('Own Device'); setSelectedHardwareId(null); }}
                                    className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col transition-all overflow-hidden ${selectedRouter === 'Own Device' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                                            <Smartphone size={36} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">I have my own Router</h4>
                                            <p className="text-sm text-gray-500 mt-1">Our technician will configure your existing compatible device during installation.</p>
                                        </div>
                                    </div>

                                    {/* Expanded Own Device Form */}
                                    {selectedRouter === 'Own Device' && (
                                        <div className="mt-6 border-t border-indigo-100 pt-5 animate-in slide-in-from-top-4 fade-in duration-300">
                                            <h5 className="font-bold text-sm text-indigo-900 mb-3">Provide Details (Helps our techs prepare)</h5>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Device Make & Model *</label>
                                                    <input
                                                        type="text"
                                                        value={ownRouterDetails.model}
                                                        onChange={(e) => setOwnRouterDetails({ ...ownRouterDetails, model: e.target.value })}
                                                        placeholder="e.g. Netgear Nighthawk AX4"
                                                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">MAC Address (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={ownRouterDetails.mac}
                                                        onChange={(e) => setOwnRouterDetails({ ...ownRouterDetails, mac: e.target.value })}
                                                        placeholder="AA:BB:CC:DD:EE:FF"
                                                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Device Image (Optional)</label>
                                                    <div className="flex items-center gap-3">
                                                        <label className="flex items-center justify-center gap-2 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-semibold shadow-sm overflow-hidden flex-1 relative">
                                                            <Upload size={16} />
                                                            <span className="truncate">{ownRouterDetails.file ? ownRouterDetails.file.name : 'Upload Router Photo'}</span>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => setOwnRouterDetails({ ...ownRouterDetails, file: e.target.files[0] })}
                                                            />
                                                        </label>
                                                        {ownRouterDetails.file && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setOwnRouterDetails({ ...ownRouterDetails, file: null }); }}
                                                                className="text-xs text-red-500 hover:underline font-medium"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-2 italic">A photo of the back sticker helps us verify compatibility ahead of time.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4 pt-6 border-t border-gray-100">
                                <button onClick={() => setShowRouterModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                                <button
                                    onClick={confirmSelection}
                                    disabled={!selectedRouter}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Selection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER ACTIVE DASHBOARD (Existing Logic) ---
    const data = [
        { name: "Used", value: usage },
        { name: "Remaining", value: planLimit - usage }
    ];
    const COLORS = ["#4f46e5", "#e5e7eb"];

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 flex flex-col gap-8">
            {/* Maintenance Banner */}
            {maintenanceAlert && (
                <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-start gap-4 animate-in slide-in-from-top-4">
                    <ShieldAlert size={24} className="mt-0.5 shrink-0 animate-pulse" />
                    <div>
                        <h4 className="font-bold text-lg">NETWORK ALERT: Zonal Maintenance Active</h4>
                        <p className="text-red-100">{maintenanceAlert}</p>
                    </div>
                </div>
            )}

            {/* Header / Traffic Light */}
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
                    {activePlan ? (
                        <p className="text-gray-500 mt-1 font-medium">
                            Welcome back, {user?.username} • <span className="text-indigo-600 font-bold">{activePlan.name}</span>
                            {activePlan.speed && ` (${activePlan.speed} Mbps)`}
                        </p>
                    ) : (
                        <p className="text-gray-500 mt-1">Welcome back, {user?.username}</p>
                    )}
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-200">
                    <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Connection Status</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full ${maintenanceAlert ? 'bg-red-500' : getStatusColor()} animate-pulse shadow-lg`}></span>
                        <span className="font-bold text-gray-800">{maintenanceAlert ? 'MAINTENANCE' : getStatusText()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. DPI Usage Meter */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-700 w-full flex items-center gap-2 mb-2">
                        <Activity size={20} className="text-indigo-600" /> DPI Traffic Analysis
                    </h3>

                    {trafficStats.length > 0 ? (
                        <div className="flex flex-col w-full h-full justify-between mt-2">
                            <div className="w-full h-64 relative mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={trafficStats}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={90}
                                            outerRadius={115}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {trafficStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-gray-900">{usage}<span className="text-sm text-gray-400">GB</span></span>
                                    <span className="text-[10px] text-gray-400 font-bold tracking-wider mt-1">TOTAL USED</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                {trafficStats.map((stat, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg text-xs hover:bg-indigo-50 transition-colors">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: stat.color }}></span>
                                            <span className="text-gray-600 font-medium truncate max-w-[80px]" title={stat.name}>{stat.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{stat.value}G</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading analytics...</div>
                    )}
                </div>

                {/* NEW: 1b. Speed Test Gauge Option */}
                <div className="bg-white p-0 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden mt-6 lg:mt-0 lg:row-start-2 lg:col-start-1">
                    {/* Pass in planLimit. Defaulting to 150 Mbps if plan is not loaded for visual testing */}
                    <SpeedTestGauge planLimit={planLimit > 0 ? planLimit : 150} />
                </div>

                {/* 2. Quick Actions / Billing */}
                <div className="lg:col-span-2 lg:row-span-2 space-y-6">
                    {/* Bill / Invoice Section */}
                    {dueAmount > 0 ? (
                        <div className="bg-red-50 border border-red-100 rounded-3xl overflow-hidden">
                            <div className="p-5 flex justify-between items-center border-b border-red-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-100 p-2.5 rounded-full text-red-600">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-red-800">Payment Due</h4>
                                        <p className="text-xs text-red-500">{pendingInvoices.length} invoice{pendingInvoices.length > 1 ? 's' : ''} pending</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-2xl font-bold text-gray-900">₹{dueAmount.toFixed(2)}</span>
                                    <Link to="/customer/pay" className="text-xs font-bold text-red-600 hover:underline">PAY NOW →</Link>
                                </div>
                            </div>
                            {/* Invoice breakdown */}
                            <div className="divide-y divide-red-100">
                                {pendingInvoices.map(inv => (
                                    <div key={inv.id} className="px-5 py-3 flex justify-between items-center bg-white">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{inv.description || 'Monthly Subscription'}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Due: <span className="font-bold text-red-600">{new Date(inv.due_date).toLocaleDateString()}</span> · #{inv.id}</p>
                                        </div>
                                        <span className="font-bold text-gray-900">₹{parseFloat(inv.amount).toFixed(2)}</span>
                                    </div>
                                ))}
                                {nextBillingDate && (
                                    <div className="px-5 py-3 bg-red-50 flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-700">Next Upcoming Cycle</span>
                                        <span className="text-sm font-bold text-gray-900">{new Date(nextBillingDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : billingLoaded ? (
                        <div className="bg-green-50 border border-green-100 p-5 rounded-3xl flex items-center gap-4">
                            <CheckCircle size={28} className="text-green-600 shrink-0" />
                            <div>
                                <h4 className="text-base font-bold text-green-800">No Pending Dues</h4>
                                <p className="text-green-600 text-sm">All invoices are cleared. Enjoy uninterrupted service.</p>
                                {nextBillingDate && (
                                    <p className="text-sm font-semibold text-green-900 mt-1">
                                        Next cycle begins: <span className="font-bold">{new Date(nextBillingDate).toLocaleDateString()}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 p-5 rounded-3xl flex items-center gap-4">
                            <Clock size={24} className="text-gray-400 animate-pulse" />
                            <p className="text-sm text-gray-500">Checking billing status...</p>
                        </div>
                    )}

                    {/* Network Health / Auto-Diagnostics */}
                    <div className="bg-gray-900 text-white p-6 rounded-3xl flex justify-between items-center shadow-lg relative overflow-hidden group border border-gray-800">
                        <div className="relative z-10">
                            <h4 className="text-lg font-bold flex items-center gap-2 mb-1">
                                <Activity size={20} className="text-green-400" /> Network Health
                            </h4>
                            <p className="text-gray-400 text-sm max-w-[250px]">Experiencing drops or slow speeds? Let our AI core scan your connection.</p>
                        </div>
                        <button
                            onClick={() => setShowTerminal(true)}
                            className="relative z-10 bg-green-500 hover:bg-green-400 text-gray-900 font-bold px-6 py-3 rounded-xl shadow-lg transition-colors flex items-center gap-2"
                        >
                            Run Diagnostics
                        </button>
                        <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
                    </div>

                    {/* Quick Links Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/customer/pay" className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                            <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <CreditCard size={24} />
                            </div>
                            <h4 className="font-bold text-gray-900">Billing History</h4>
                            <p className="text-xs text-gray-500 mt-1">Download receipts & manage payments.</p>
                        </Link>

                        <Link to="/customer/support" className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                            <div className="bg-orange-50 w-12 h-12 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                <HelpCircle size={24} />
                            </div>
                            <h4 className="font-bold text-gray-900">Support Center</h4>
                            <p className="text-xs text-gray-500 mt-1">Raise tickets or chat with us.</p>
                        </Link>
                    </div>

                    {/* Promo Banner */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-xl font-bold mb-2">Want faster speeds?</h4>
                            <p className="opacity-90 text-sm mb-4 max-w-md">Upgrade your plan instantly to enjoy unmatched speeds over fiber.</p>
                            <button onClick={() => setShowUpgradeModal(true)} className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold text-sm hover:bg-opacity-90 transition-transform hover:scale-105 active:scale-95 shadow-lg">View Plans</button>
                        </div>
                        <Wifi size={150} className="absolute -right-6 -bottom-6 opacity-10 rotate-12" />
                    </div>
                </div>
            </div>

            {showTerminal && (
                <DiagnosticTerminal
                    onClose={() => setShowTerminal(false)}
                    onTicketCreated={() => {
                        // Optional callback action
                    }}
                />
            )}

            {/* UPGRADE PLAN MODAL */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white">
                        <button onClick={() => setShowUpgradeModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-10">
                            <X size={24} />
                        </button>
                        <div className="text-center mb-10">
                            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Choose Your Next Plan</h2>
                            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Selected plans will instantly calculate changes. The price difference will be generated as a pending invoice. Downgrades are free.</p>
                        </div>

                        {loadingPlans ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {plans.map((plan) => (
                                    <div key={plan.id} className="relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col group overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                            {plan.plan_type === 'FIBER' ? <Wifi size={64}/> : <Radio size={64}/>}
                                        </div>
                                        <div className="mb-6 z-10">
                                            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                                            <p className="text-sm font-medium text-indigo-600 mt-2">{plan.hero_tagline || 'Superfast Reliable Internet'}</p>
                                        </div>
                                        
                                        <div className="mb-8 z-10 flex items-baseline">
                                            <span className="text-5xl font-extrabold tracking-tight text-gray-900">₹{parseFloat(plan.price)}</span>
                                            <span className="text-gray-500 ml-2 font-medium">/month</span>
                                        </div>

                                        <ul className="mb-8 space-y-4 z-10 flex-1">
                                            <li className="flex items-center gap-3 text-gray-600 font-medium">
                                                <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600"><Zap size={18} /></div>
                                                {plan.speed_mbps} Mbps Speeds
                                            </li>
                                            <li className="flex items-center gap-3 text-gray-600 font-medium">
                                                <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600"><CheckCircle size={18} /></div>
                                                {plan.data_limit_gb >= 9999 ? 'Unlimited Data' : `${plan.data_limit_gb} GB Data Limit`}
                                            </li>
                                            <li className="flex items-center gap-3 text-gray-600 font-medium">
                                                <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600"><Shield size={18} /></div>
                                                Secure {plan.plan_type} Network
                                            </li>
                                        </ul>
                                        <button 
                                            onClick={async () => {
                                                if(!confirm(`Are you sure you want to request an upgrade to ${plan.name}?`)) return;
                                                try {
                                                    setUpgradeProcessing(true);
                                                    const res = await api.post(`/users/${user.id}/upgrade_plan/`, { plan_id: plan.id });
                                                    alert(res.data.message);
                                                    window.location.reload();
                                                } catch (err) {
                                                    alert(err.response?.data?.error || "Upgrade failed.");
                                                } finally {
                                                    setUpgradeProcessing(false);
                                                }
                                            }}
                                            disabled={upgradeProcessing || (activePlan && activePlan.id === plan.id)}
                                            className={`w-full py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 z-10 ${
                                                activePlan && activePlan.id === plan.id 
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                                : 'bg-gray-900 text-white hover:bg-indigo-600 hover:shadow-indigo-200'
                                            }`}
                                        >
                                            {upgradeProcessing ? 'Processing...' : (activePlan && activePlan.id === plan.id ? 'Current Plan' : 'Select Plan & Calculate')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
