import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ChevronRight, Sparkles, User, Bot, Loader } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import api from "../config/api";
import { getBotResponse } from "./Chatbot/chatLogic"; // Import Logic

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: "bot",
            text: "Hi there! 👋 I'm your NextGen AI Assistant. How can I help you today?",
            suggestions: ["View Plans", "Check Area", "Need Support"]
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [plans, setPlans] = useState([]);
    const [areas, setAreas] = useState([]);

    const navigate = useNavigate();
    const location = useLocation(); // Get current route
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // HIDE on Admin/Staff routes
    const hideBotRoutes = ['/admin', '/staff', '/field'];
    const shouldHideBot = hideBotRoutes.some(route => location.pathname.startsWith(route));

    useEffect(() => {
        if (isOpen) {
            if (plans.length === 0) fetchPlans();
            if (areas.length === 0) fetchAreas();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
        if (isOpen) inputRef.current?.focus();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchPlans = async () => {
        try {
            const res = await api.get('/plans/');
            setPlans(res.data);
        } catch (err) { console.error("Failed to fetch plans"); }
    };

    const fetchAreas = async () => {
        try {
            const res = await api.get('/areas/');
            setAreas(res.data);
        } catch (err) { console.error("Failed to fetch areas"); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userText = input.trim();
        setMessages(prev => [...prev, { type: "user", text: userText }]);
        setInput("");
        setIsTyping(true);

        // Fetch AI Response
        const botReplyText = await getBotResponse(userText, { areas, plans });

        // Construct the message object
        const botResponse = {
            type: "bot",
            text: botReplyText
        };

        // Check if we need to attach an action based on the response text (Simple heuristic)
        if (botReplyText.includes("Register") || botReplyText.includes("plan")) botResponse.action = "VIEW_PLANS";
        if (botReplyText.includes("ticket") || botReplyText.includes("Support")) botResponse.action = "SUPPORT";

        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
    };

    const handleAction = (action) => {
        if (action === "VIEW_PLANS" || action === "View Plans") navigate("/register");
        if (action === "SUPPORT" || action === "Need Support") navigate("/customer/support");
        if (action === "CHECK_AREA" || action === "Check Area") navigate("/register");
    };

    const handleSuggestionClick = (suggestion) => {
        setMessages(prev => {
            const next = [...prev];
            if (next.length > 0) {
                delete next[0].suggestions; // Remove from welcome
            }
            return next;
        });
        setInput(suggestion);
        setTimeout(() => {
            const fakeEvent = { preventDefault: () => { } };
            // A bit hacky but we'll submit the form implicitly by changing the state and running logic directly
            handleSuggestionSubmit(suggestion);
        }, 50);
    };

    const handleSuggestionSubmit = async (userText) => {
        setMessages(prev => [...prev, { type: "user", text: userText }]);
        setInput("");
        setIsTyping(true);
        const botReplyText = await getBotResponse(userText, { areas, plans });
        const botResponse = { type: "bot", text: botReplyText };
        if (botReplyText.includes("Register") || botReplyText.includes("plan")) botResponse.action = "VIEW_PLANS";
        if (botReplyText.includes("ticket") || botReplyText.includes("Support")) botResponse.action = "SUPPORT";
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
    };

    if (shouldHideBot) return null; // Don't render on admin pages

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-50 animate-bounce-slow"
                >
                    <MessageSquare size={28} />
                    {/* Notification Dot */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-4 sm:right-6 w-[350px] sm:w-[380px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 font-sans">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-wide">NextGen Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></span>
                                    <span className="text-[10px] font-medium opacity-90">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-5 overflow-y-auto bg-slate-50 space-y-5 custom-scrollbar" style={{ maxHeight: '60vh', minHeight: '350px' }}>
                        <div className="text-center text-xs text-gray-400 my-2 pt-2">Today</div>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm leading-relaxed ${msg.type === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                    }`}>
                                    {msg.type === 'bot' && <Sparkles size={14} className="text-indigo-500 mb-1 inline mr-2" />}
                                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} className="whitespace-pre-wrap" />

                                    {/* Action Buttons */}
                                    {msg.action && (
                                        <button
                                            onClick={() => handleAction(msg.action)}
                                            className="mt-3 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 border border-indigo-100"
                                        >
                                            {msg.action === 'VIEW_PLANS' && 'View All Plans'}
                                            {msg.action === 'SUPPORT' && 'Open Support Ticket'}
                                            {msg.action === 'CHECK_AREA' && 'Check Availability'}
                                            <ChevronRight size={14} />
                                        </button>
                                    )}
                                </div>
                                {/* Suggestions (Chips) */}
                                {msg.suggestions && msg.suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 pl-1">
                                        {msg.suggestions.map((suggestion, sIdx) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 text-xs font-medium py-1.5 px-3 rounded-full transition-colors shadow-sm"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-3 shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex items-center gap-2 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.05)] z-10 relative">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a question..."
                            className="flex-1 bg-slate-100/80 border-0 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-gray-700 placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                        >
                            <Send size={18} className="translate-x-[1px]" />
                        </button>
                    </form>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .animate-bounce-slow {
                    animation: bounce 3s infinite;
                }
            `}</style>
        </>
    );
}
