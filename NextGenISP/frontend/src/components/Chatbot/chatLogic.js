export const getBotResponse = async (input, contextData = {}) => {
    // Artificial slight delay to feel like "typing"
    await new Promise(resolve => setTimeout(resolve, 600));

    const text = input.toLowerCase();
    const { areas = [], plans = [] } = contextData;

    // 1. GREETINGS
    if (text.match(/\b(hi|hello|hey|greetings|morning|afternoon)\b/)) {
        return "Hello! 😊 I can help you with checking internet plans, seeing if we cover your area, or guiding you to technical support. What do you need today?";
    }

    // 2. PLANS & PRICING
    if (text.match(/\b(plan|plans|price|cost|internet|broadband|speed|mbps|fiber|wifi)\b/)) {
        let reply = "We offer lightning-fast internet plans tailored to your needs!\n\n";
        if (plans.length > 0) {
            reply += "**Here are some popular options:**\n";
            plans.slice(0, 3).forEach(p => {
                reply += `• **${p.name}** - ${p.speed_mbps} Mbps | ₹${p.price}/month\n`;
            });
            reply += "\n*Click 'View All Plans' below to see the full list and subscribe.*";
        } else {
            reply += "Please click 'View All Plans' below to see our latest offerings and subscribe!";
        }
        return reply;
    }

    // 3. HARDWARE & ROUTERS
    if (text.match(/\b(router|routers|modem|hardware|mesh|tplink|device|devices|equipment)\b/)) {
        return "Choosing the right gear is essential! 📡\n\nWe offer a range of premium hardware from standard Gigabit Routers to advanced Mesh systems and Gaming gear.\n\nWhen you select a plan, you will automatically be recommended the best hardware to match your connection speed!";
    }

    // 4. COVERAGE & AREAS
    if (text.match(/\b(area|location|city|cover|coverage|available|where|map)\b/)) {
        let reply = "We are constantly expanding our lightning-fast fiber network! 🌍\n\n";
        if (areas.length > 0) {
            reply += "We currently cover areas including: ";
            reply += areas.slice(0, 4).map(a => `**${a.name}**`).join(", ");
            if (areas.length > 4) reply += ", and many more!";
            reply += "\n\n*Click 'Check Availability' below to search by map or view the full list.*";
        } else {
            reply += "Click 'Check Availability' below to see if your address falls within our service zones.";
        }
        return reply;
    }

    // 5. SUPPORT & TICKETS
    if (text.match(/\b(support|help|issue|break|broken|disconnect|slow|ticket|complain|complaint|repair)\b/)) {
        return "I'm sorry to hear you're experiencing an issue! 🛠️\n\nOur technical team is ready to help. The fastest way to get a resolution is to open a Support Ticket directly from your Customer Dashboard.\n\n*Click 'Open Support Ticket' below to get started.*";
    }

    // 6. INSTALLATION & SETUP
    if (text.match(/\b(install|installation|setup|time|days|when)\b/)) {
        return "Getting connected is super easy! 👷‍♂️\n\nOnce you register and choose a plan, our administrative team quickly verifies your details. Afterwards, a field technician is assigned and usually completes the installation within **24 to 48 hours**.";
    }

    // 7. BILLING & INVOICES
    if (text.match(/\b(bill|billing|invoice|pay|payment|due|money)\b/)) {
        return "Need help with billing? 💳\n\nYou can view all your current invoices, past payments, and download payment receipts directly from the 'Invoices' tab in your Customer Dashboard. If you believe there is an error on your bill, please open a Support Ticket.";
    }

    // DEFAULT FALLBACK
    return "I'm still learning! 🤖\n\nI didn't quite catch that. Could you try asking about:\n• Our **Plans** & Prices\n• Network **Coverage**\n• Technical **Support**\n• **Hardware** / Routers";
};
