import { useState, useEffect, useRef } from 'react';
import { Terminal, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function DiagnosticTerminal({ onClose, onTicketCreated }) {
    const { user } = useAuth();
    const [lines, setLines] = useState([]);
    const [status, setStatus] = useState('running'); // running, success, warning, failed
    const [progress, setProgress] = useState(0);
    const bottomRef = useRef(null);

    // The sequence of simulated events
    const sequence = [
        { text: "> Initializing NextGen AI Diagnostic Core...", delay: 800 },
        { text: "> Establishing secure connection to Customer Edge Router...", delay: 1500 },
        { text: "> [AUTH_SUCCESS] MAC Address verified on optical node.", delay: 800 },
        { text: "> Checking Optical Power Levels (Tx/Rx)...", delay: 2000 },
        { text: "> [WARNING] Tx Power -24dBm (Acceptable but high attenuation).", delay: 1000, type: 'warning' },
        { text: "> Pinging Primary DNS (8.8.8.8)...", delay: 1200 },
        { text: "> [LATENCY] 14ms average... OK.", delay: 500 },
        { text: "> Checking IP Leases & DHCP binding...", delay: 1500 },
        { text: "> Binding found. Verifying PPPoE tunnel state...", delay: 1000 },
        { text: "> [ERROR] Detected stale PPPoE session holding port open.", delay: 1000, type: 'error' },
        { text: "> Executing automated remote port wipe on OLT...", delay: 3000 },
        { text: "> Sending soft-reboot command to Customer Router...", delay: 2500 },
        { text: "> Waiting for device to come back online...", delay: 4000 },
        { text: "> [SUCCESS] Router online. PPPoE Session re-established.", delay: 800, type: 'success' },
        { text: "> Running final speed threshold verification...", delay: 2000 },
        { text: "> [PASS] Connection is stable and operating within optimal parameters.", delay: 1000, type: 'success' },
    ];

    useEffect(() => {
        let currentStep = 0;
        let isCancelled = false;

        const runSequence = async () => {
            for (const step of sequence) {
                if (isCancelled) break;

                await new Promise(resolve => setTimeout(resolve, step.delay));
                if (isCancelled) break;

                setLines(prev => [...prev, { text: step.text, type: step.type || 'normal', id: Date.now() }]);
                currentStep++;
                setProgress((currentStep / sequence.length) * 100);

                // Auto-scroll logic
                if (bottomRef.current) {
                    bottomRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }

            if (!isCancelled) {
                // Determine final outcome
                // 80% chance of auto-healing success, 20% chance of requiring a ticket
                const autoHealSuccess = Math.random() > 0.2;
                if (autoHealSuccess) {
                    setStatus('success');
                } else {
                    setLines(prev => [...prev,
                    { text: "> [CRITICAL] Remote auto-heal protocol failed.", type: 'error', id: Date.now() },
                    { text: "> Manual technician intervention required.", type: 'error', id: Date.now() + 1 }
                    ]);
                    setStatus('failed');
                }
            }
        };

        runSequence();

        return () => { isCancelled = true; };
    }, []);

    const handleCreateTicket = async () => {
        try {
            setStatus('creating_ticket');
            await api.post('/tickets/', {
                subject: "[AUTO-DIAGNOSTIC] Repeated Connection Drops",
                description: "Auto-diagnostic tool detected stale PPPoE sessions and high optical attenuation. Remote port wipe failed. Requesting physical line check.",
                type: 'LOGICAL' // Or PHYSICAL based on your setup
            });
            alert("Diagnostic Support Ticket automatically created! Our team has been notified.");
            onTicketCreated();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to auto-generate ticket. Please create one manually.");
            setStatus('failed');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-gray-900 w-full max-w-3xl rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col font-mono text-sm max-h-[85vh]">

                {/* Terminal Header */}
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center text-gray-400">
                    <div className="flex items-center gap-2">
                        <Terminal size={16} />
                        <span className="font-bold tracking-widest text-xs">NEXTGEN_AI_DIAGNOSTICS_v2.4.1</span>
                    </div>
                    {(status !== 'running' && status !== 'creating_ticket') && (
                        <button onClick={onClose} className="hover:text-white transition-colors bg-gray-700 hover:bg-red-500 rounded-full p-1">
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-gray-800">
                    <div
                        className={`h-full transition-all duration-500 ${status === 'failed' ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Terminal Body */}
                <div className="p-6 flex-1 overflow-y-auto space-y-2 text-green-500 min-h-[300px] shadow-inner">
                    {lines.map((line, idx) => (
                        <div key={line.id} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                            <span className={`
                                ${line.type === 'error' ? 'text-red-400 font-bold' : ''}
                                ${line.type === 'warning' ? 'text-yellow-400' : ''}
                                ${line.type === 'success' ? 'text-blue-400 font-bold' : ''}
                            `}>
                                {line.text}
                            </span>
                        </div>
                    ))}

                    {status === 'running' && (
                        <div className="flex items-center gap-2 text-green-700 mt-4 animate-pulse">
                            <RefreshCw size={14} className="animate-spin" /> Processing...
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Terminal Footer / Actions */}
                {status !== 'running' && (
                    <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-between items-center animate-in slide-in-from-bottom-4">
                        {status === 'success' ? (
                            <>
                                <div className="flex items-center gap-2 text-green-400 font-bold">
                                    <CheckCircle size={20} /> DIAGNOSTICS COMPLETE. NETWORK HEALED.
                                </div>
                                <button onClick={onClose} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                                    CLOSE TERMINAL
                                </button>
                            </>
                        ) : status === 'failed' ? (
                            <>
                                <div className="flex items-center gap-2 text-red-400 font-bold">
                                    <AlertTriangle size={20} /> AUTO-HEAL FAILED. ACTION REQUIRED.
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={onClose} className="border border-gray-600 text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-lg font-bold transition-colors">
                                        IGNORE
                                    </button>
                                    <button onClick={handleCreateTicket} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-red-900/50">
                                        GENERATE SUPPORT TICKET
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-400 flex items-center gap-2">
                                <RefreshCw size={16} className="animate-spin" /> Creating Ticket...
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
