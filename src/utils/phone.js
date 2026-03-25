function normalizeIndianPhone(phone) {
    if (!phone) throw new Error("Phone is required");

    // remove +, space, dash etc
    let cleaned = String(phone).replace(/\D/g, "");

    // handle +91
    if (cleaned.startsWith("91") && cleaned.length === 12) {
        cleaned = cleaned.slice(2);
    }

    // Indian mobile validation
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
        throw new Error("Invalid Indian mobile number");
    }

    return cleaned; // 🔥 ONLY 10 DIGIT
}

module.exports = normalizeIndianPhone;
