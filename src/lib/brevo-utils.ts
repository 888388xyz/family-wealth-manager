import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendEmailParams {
    to: string;
    subject: string;
    textContent?: string;
    htmlContent?: string;
}

/**
 * Sends an email using the Brevo REST API.
 */
export async function sendEmail({ to, subject, textContent, htmlContent }: SendEmailParams) {
    // Fetch settings from database instead of process.env
    const settings = await db.query.systemSettings.findMany();
    const config = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);

    const BREVO_API_KEY = config.BREVO_API_KEY;
    const EMAIL_FROM = config.EMAIL_FROM || "wealth-manager@oheng.com";

    if (!BREVO_API_KEY) {
        console.warn("BREVO_API_KEY is not configured in database settings.");
        return { success: false, error: "Email service not configured" };
    }

    try {
        const response = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: { email: EMAIL_FROM, name: "Family Wealth Manager" },
                to: [{ email: to }],
                subject,
                textContent: textContent || subject,
                htmlContent: htmlContent || (textContent ? `<p>${textContent.replace(/\n/g, '<br>')}</p>` : `<p>${subject}</p>`),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Brevo API Error:", data);
            return { success: false, error: data.message || "Failed to send email" };
        }

        return { success: true, messageId: data.messageId };
    } catch (error) {
        console.error("Error sending email via Brevo:", error);
        return { success: false, error: "Internal server error during email sending" };
    }
}
