function validateSellerRegistration(body) {
    const errors = {};

    if (body.email) body.email = body.email.toLowerCase();

    if (!body.fullname || body.fullname.trim().length < 3) {
        errors.fullname = "Full name must be at least 3 characters";
    }

    if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
        errors.email = "Invalid email format";
    }

    if (!body.password || body.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
    }

    if (!body.company_name || body.company_name.trim() === "") {
        errors.company_name = "Company name is required";
    }

    if (Number(body.declaration) !== 1) {
        errors.declaration = "Please accept declaration";
    }

    return errors;
}

module.exports = validateSellerRegistration;
