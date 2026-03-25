const nodemailer = require("nodemailer")
const Mail = require("nodemailer/lib/mailer")

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASS
    }
})

async function sendEmail(to,subject,message) {
    try {
        const mailOption = {
            from:`"Seller Verification" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html:`<div style="font-family:sans-serif;">
              <h2>Seller OTP Verification</h2>
              <p>Your OTP is:</p>
              <h1 style="color:#2f54eb;">${message}</h1>
              <p>This OTP will expire in <b>5 minutes</b>.</p>
            </div>`
        }
        await transporter.sendMail(mailOption)
        console.log("Email send  to:", to);
    } catch (error) {
        console.error("❌ Email send error:", error);
        throw new Error("Email not sent");
    }
}

async function sendEmailToApproved(to, sellerName) {
  try {
    const mailOption = {
      from: `"Seller Verification" <${process.env.EMAIL_USER}>`,
      to,
      subject: "✅ Your Seller Account Has Been Approved!",
      text: `Hi ${sellerName},

Congratulations! 🎉 Your seller account on Mojija Marketplace has been successfully approved.

You can now start listing your products and selling to customers across India.

If you have any questions, feel free to reach out to our support team at support@mojija.com.

Best regards,
The Mojija Marketplace Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fafafa;">
          <div style="max-width: 600px; margin: auto; background: #fff; padding: 25px; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #2f54eb;">🎉 Congratulations, ${sellerName}!</h2>
            <p style="font-size: 15px; color: #333;">
              Your seller account on <strong>Mojija Marketplace</strong> has been successfully approved.
            </p>
            <p style="font-size: 15px; color: #333;">
              You can now start listing your products and grow your business online.
            </p>
            <p style="text-align: center; margin: 25px 0;">
              <a href="https://mojija.com/seller/dashboard" 
                style="background-color: #2f54eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">
                Go to Seller Dashboard
              </a>
            </p>
            <p style="font-size: 14px; color: #555;">
              For help or questions, email us at 
              <a href="mailto:support@mojija.com" style="color: #2f54eb;">support@mojija.com</a>.
            </p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
            <p style="font-size: 12px; color: #888; text-align: center;">
              © ${new Date().getFullYear()} Mojija Marketplace. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOption);
    console.log(`📩 Approval email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send approval email:", error);
    throw new Error("Email not sent");
  }
}

async function sendEmailToRejected(to, sellerName) {
  try {
    const mailOption = {
      from: `"Seller Verification" <${process.env.EMAIL_USER}>`,
      to,
      subject: "❌ Seller Account Rejected",
      text: `Hi ${sellerName}, your seller account request was not approved. You can review your details and reapply. For help, contact support@mojija.com.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3 style="color:#ff4d4f;">Hi ${sellerName},</h3>
          <p>Your seller account request on <b>Mojija Marketplace</b> was not approved.</p>
          <p>You can review your details and reapply if needed.</p>
          <a href="https://mojija.com/seller/reapply" 
             style="display:inline-block;margin-top:10px;background:#ff4d4f;color:#fff;padding:8px 15px;border-radius:5px;text-decoration:none;">
             Reapply Now
          </a>
          <p style="margin-top:20px;font-size:13px;">Need help? Contact <a href="mailto:support@mojija.com">support@mojija.com</a></p>
        </div>
      `
    };

    await transporter.sendMail(mailOption);
    console.log(`📩 Rejection email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send rejection email:", error);
    throw new Error("Email not sent");
  }
}




module.exports = {sendEmail,sendEmailToApproved,sendEmailToRejected}
