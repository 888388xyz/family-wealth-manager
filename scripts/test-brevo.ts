/**
 * Test script for Brevo email integration.
 * Run with: npx tsx scripts/test-brevo.ts
 */

import { sendEmail } from "../src/lib/brevo-utils";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
    console.log("Starting Brevo test (Database-driven)...");


    const result = await sendEmail({
        to: process.argv[2] || "recipient@example.com",
        subject: "Brevo API Test - Family Wealth Manager",
        textContent: "If you receive this, the Brevo API integration is working correctly!",
    });

    if (result.success) {
        console.log("SUCCESS: Email sent! Message ID:", result.messageId);
        console.log("Check the inbox of the recipient specified.");
    } else {
        console.error("FAILURE:", result.error);
        console.log("\nTIP: You can specify a recipient: npx tsx scripts/test-brevo.ts your-email@domain.com");
    }
}

test();
