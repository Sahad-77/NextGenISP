export const knowledgeBase = [
    // --- 1. GREETINGS ---
    {
        keywords: ["hello", "hi", "hey", "good morning", "start"],
        answer: "👋 Hi there! Welcome to NextGen ISP. I can help you pick a plan, fix speed issues, or check your bill. What's on your mind?"
    },
    {
        keywords: ["who are you", "bot", "human", "real"],
        answer: "🤖 I am the NextGen Virtual Assistant. I'm here to answer your questions instantly! If you need a human, please raise a Ticket."
    },

    // --- 2. PLANS & GAMING ---
    {
        keywords: ["plan", "price", "cost", "gold", "silver", "package"],
        answer: "🚀 **Best Selling Plans:**\n\n1. **Silver:** 50 Mbps @ ₹499\n2. **Gold:** 150 Mbps @ ₹799 (Recommended)\n3. **Platinum:** 300 Mbps @ ₹999\n\nAll plans come with Unlimited Data & Free Installation on Quarterly plans!"
    },
    {
        keywords: ["gaming", "game", "pubg", "ping", "lag", "latency"],
        answer: "🎮 For gaming, low latency is key! We recommend our **Platinum Plan (300 Mbps)** which offers optimized routing (Ping < 20ms). Are you facing lag currently?"
    },
    {
        keywords: ["netflix", "stream", "4k", "buffer", "youtube"],
        answer: "🎬 To stream 4K content without buffering, you need at least 25 Mbps. All our plans handle 4K streaming easily!"
    },
    {
        keywords: ["wfh", "work from home", "zoom", "meet", "teams"],
        answer: "💼 For WFH, you need upload stability. Our **Gold Plan (150 Mbps)** offers symmetrical speeds, perfect for crystal clear video calls."
    },

    // --- 3. TROUBLESHOOTING ---
    {
        keywords: ["slow", "speed", "fast", "internet is down"],
        answer: "⚠️ **Troubleshooting:**\n1. Restart your router (unplug for 10s).\n2. Ensure you are connected to the 5GHz WiFi band.\n3. If speed is still low, please raise a ticket in your Dashboard."
    },
    {
        keywords: ["red light", "los", "blink", "no internet"],
        answer: "🚨 A blinking Red/LOS light typically means a fiber cut in your area. Please click 'Support' -> 'Report Issue' in your dashboard immediately so we can dispatch a team."
    },

    // --- 4. EXAMINER / TECH QUESTIONS (Hidden) ---
    {
        keywords: ["tech stack", "technology", "react", "django", "project"],
        answer: "💻 **Project Tech Stack:**\n• Frontend: React.js (Vite)\n• Backend: Django REST Framework\n• DB: SQLite (Dev) / PostgreSQL (Prod)\n• Auth: JWT Token System"
    },
    {
        keywords: ["developer", "creator", "made this", "author"],
        answer: "👨‍💻 **Developer Info:**\nThis NextGen ISP ERP was designed and developed by [Your Name] as a Final Year Project."
    }
];
