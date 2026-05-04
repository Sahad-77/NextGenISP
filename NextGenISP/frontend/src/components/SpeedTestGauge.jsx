import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Activity, ArrowDown, ArrowUp, Zap } from "lucide-react";

export default function SpeedTestGauge({ planLimit = 100 }) {
    // states: 'IDLE', 'PING', 'DOWNLOAD', 'UPLOAD', 'COMPLETE'
    const [testState, setTestState] = useState('IDLE');

    // Display Values
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [ping, setPing] = useState('-');
    const [download, setDownload] = useState('-');
    const [upload, setUpload] = useState('-');

    // Animation refs
    const animationRef = useRef(null);

    // Simulated Target Speeds (Deterministic based on plan)
    const targetPing = Math.floor(Math.random() * 15) + 8; // 8 - 23 ms
    const targetDown = planLimit * 0.94 + (Math.random() * (planLimit * 0.05)); // ~94-99% of plan
    const targetUp = (planLimit / 2) * 0.90 + (Math.random() * (planLimit * 0.10)); // ~45-50% of plan

    // Circle SVG Math for Gauge
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    // Map speed to stroke-dashoffset (0 to planLimit * 1.2 for headroom)
    const maxSpeedScale = planLimit * 1.1;
    const dashOffset = circumference - (currentSpeed / maxSpeedScale) * circumference;

    // Restrain bounds visually
    const safeDashOffset = Math.max(0, Math.min(circumference, dashOffset));

    const startTest = () => {
        // Reset
        setPing('-');
        setDownload('-');
        setUpload('-');
        setCurrentSpeed(0);

        // 1. Ping Test (0s - 2s)
        setTestState('PING');
        setTimeout(() => {
            setPing(targetPing);

            // 2. Download Test (2s - 8s)
            setTestState('DOWNLOAD');
            animateSpeed(0, targetDown, 6000, () => {
                setDownload(targetDown.toFixed(1));
                setCurrentSpeed(0); // Reset needle for upload

                // 3. Upload Test (8s - 13s)
                setTestState('UPLOAD');
                setTimeout(() => { // slight pause before upload
                    animateSpeed(0, targetUp, 5000, () => {
                        setUpload(targetUp.toFixed(1));

                        // 4. Complete
                        setTestState('COMPLETE');
                        animateSpeed(targetUp, 0, 800, () => setCurrentSpeed(0));
                    });
                }, 400);
            });

        }, 2000);
    };

    const animateSpeed = (start, end, duration, onComplete) => {
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutQuad) for sudden jump, slow settle
            const easeProgress = 1 - (1 - progress) * (1 - progress);

            // Add some jitter/fluctuation
            const jitter = progress < 1 ? (Math.random() - 0.5) * (end * 0.1) : 0;

            let val = start + (end - start) * easeProgress + jitter;
            val = Math.max(0, val); // Never drop below 0

            setCurrentSpeed(val);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(update);
            } else {
                // Ensure exact final value at end
                setCurrentSpeed(end);
                if (onComplete) onComplete();
            }
        };

        cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        return () => cancelAnimationFrame(animationRef.current); // cleanup
    }, []);

    const getStatusText = () => {
        switch (testState) {
            case 'IDLE': return "Ready to Test";
            case 'PING': return "Testing Ping...";
            case 'DOWNLOAD': return "Testing Download...";
            case 'UPLOAD': return "Testing Upload...";
            case 'COMPLETE': return "Test Complete";
            default: return "";
        }
    };

    const getStatusColor = () => {
        switch (testState) {
            case 'PING': return "text-blue-500";
            case 'DOWNLOAD': return "text-indigo-500";
            case 'UPLOAD': return "text-purple-500";
            case 'COMPLETE': return "text-green-500";
            default: return "text-gray-500";
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-between p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 self-start w-full">
                <Activity size={20} className="text-indigo-600" /> Network Speed
            </h3>

            {/* The Gauge Container */}
            <div className="relative w-48 h-48 my-4 flex items-center justify-center">
                {/* Background Track */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                    <circle
                        cx="100" cy="100" r="80"
                        stroke="#f3f4f6" strokeWidth="16" fill="transparent"
                        strokeDasharray={circumference}
                        // Cut out the bottom 25% to make it look like a real car gauge
                        strokeDashoffset={circumference * 0.25}
                        style={{ transformOrigin: 'center', transform: 'rotate(45deg)' }}
                    />

                    {/* Dynamic Progress Track */}
                    <circle
                        cx="100" cy="100" r="80"
                        stroke={testState === 'UPLOAD' ? '#a855f7' : '#6366f1'}
                        strokeWidth="16" fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={safeDashOffset + (circumference * 0.25)}
                        className="transition-all duration-75"
                        style={{ transformOrigin: 'center', transform: 'rotate(45deg)' }}
                    />
                </svg>

                {/* Center Value */}
                <div className="flex flex-col items-center justify-center z-10 w-32 h-32 rounded-full bg-white shadow-inner border border-gray-50">
                    <span className="text-4xl font-black text-gray-900 tabular-nums tracking-tighter">
                        {Math.floor(currentSpeed)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest -mt-1">
                        Mbps
                    </span>

                    {testState === 'IDLE' && (
                        <button
                            onClick={startTest}
                            className="mt-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white p-2 rounded-full transition-colors shadow-sm"
                            title="Start Test"
                        >
                            <Play size={16} className="ml-0.5" />
                        </button>
                    )}
                    {testState === 'COMPLETE' && (
                        <button
                            onClick={startTest}
                            className="mt-3 text-gray-400 hover:text-indigo-600 p-2 transition-colors"
                            title="Test Again"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className={`text-xs font-bold uppercase tracking-wider mb-6 animate-pulse ${getStatusColor()}`}>
                {getStatusText()}
            </div>

            {/* Results Row */}
            <div className="grid grid-cols-3 gap-2 w-full">
                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center border border-gray-100">
                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <Zap size={14} /> <span className="text-[10px] font-bold uppercase">Ping</span>
                    </div>
                    <span className={`font-bold font-mono ${testState === 'PING' ? 'text-blue-600 animate-pulse' : 'text-gray-900'}`}>
                        {ping} <span className="text-[10px] text-gray-400 font-sans">ms</span>
                    </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center border border-gray-100">
                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <ArrowDown size={14} className="text-indigo-400" /> <span className="text-[10px] font-bold uppercase">Down</span>
                    </div>
                    <span className={`font-bold font-mono ${testState === 'DOWNLOAD' ? 'text-indigo-600 animate-pulse' : 'text-gray-900'}`}>
                        {download} <span className="text-[10px] text-gray-400 font-sans">Mb</span>
                    </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center border border-gray-100">
                    <div className="flex items-center gap-1 text-gray-400 mb-1">
                        <ArrowUp size={14} className="text-purple-400" /> <span className="text-[10px] font-bold uppercase">Up</span>
                    </div>
                    <span className={`font-bold font-mono ${testState === 'UPLOAD' ? 'text-purple-600 animate-pulse' : 'text-gray-900'}`}>
                        {upload} <span className="text-[10px] text-gray-400 font-sans">Mb</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
