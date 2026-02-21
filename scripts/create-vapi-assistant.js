// ─────────────────────────────────────────────────────────────
// scripts/create-vapi-assistant.js
//
// Run this ONCE after filling in VAPI_PRIVATE_KEY in .env.local
// Command:  node scripts/create-vapi-assistant.js
//
// It will create the Aria assistant on VAPI and print the
// Assistant ID — copy that into your .env.local
// ─────────────────────────────────────────────────────────────

require("dotenv").config({ path: ".env.local" });

const ARIA_SYSTEM_PROMPT = `You are Aria, a warm and efficient voice scheduling assistant. Your job is to help users schedule meetings by collecting their details and creating a real calendar event.

Follow this exact conversation flow:
1. Greet the user warmly and introduce yourself as Aria.
2. Ask for their full name.
3. Ask for the date they'd like to schedule the meeting (e.g., "February 21st").
4. Ask for the preferred time (e.g., "2:00 PM").
5. Ask for a meeting title or purpose (tell them it's optional — they can say "skip").
6. Confirm all details back to the user: name, date, time, and title. Ask "Shall I go ahead and book this?"
7. If they confirm, call the schedule_meeting function immediately.
8. Once booked, tell them the meeting is confirmed and wish them well.

Important rules:
- Be concise and friendly — this is a voice conversation, keep sentences short.
- Don't ask multiple questions at once.
- If the user gives you all details at once, confirm them and proceed.
- For the meeting title, if they skip it, use "Meeting" as the default.
- Always confirm before booking.
- If booking fails, apologize and ask them to try again.`;

const SCHEDULE_MEETING_TOOL = {
    type: "function",
    function: {
        name: "schedule_meeting",
        description:
            "Creates a real Google Calendar event after collecting and confirming all meeting details from the user.",
        parameters: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "The full name of the person scheduling the meeting.",
                },
                date: {
                    type: "string",
                    description: 'The date of the meeting e.g. "February 21 2026".',
                },
                time: {
                    type: "string",
                    description: 'The time of the meeting e.g. "2:00 PM".',
                },
                title: {
                    type: "string",
                    description: 'The meeting title. Defaults to "Meeting" if not provided.',
                },
                timezone: {
                    type: "string",
                    description: 'IANA timezone e.g. "America/New_York". Use "UTC" if unknown.',
                },
            },
            required: ["name", "date", "time"],
        },
    },
};

const ARIA_ASSISTANT_CONFIG = {
    name: "Aria",
    firstMessage:
        "Hi there! I'm Aria, your scheduling assistant. I'd love to help you book a meeting. Could you start by telling me your name?",
    model: {
        provider: "anthropic",
        model: "claude-haiku-4-5-20251001",
        temperature: 0.7,
        systemPrompt: ARIA_SYSTEM_PROMPT,
        tools: [SCHEDULE_MEETING_TOOL],
    },
    voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
    },
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    endCallMessage:
        "It was great talking with you! Your meeting has been booked. Goodbye!",
};

async function createAssistant() {
    const apiKey = process.env.VAPI_PRIVATE_KEY;

    if (!apiKey) {
        console.error("❌  Missing VAPI_PRIVATE_KEY in .env.local");
        process.exit(1);
    }

    console.log("🚀  Creating Aria assistant on VAPI...\n");

    const response = await fetch("https://api.vapi.ai/assistant", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(ARIA_ASSISTANT_CONFIG),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("❌  Failed to create assistant:", error);
        process.exit(1);
    }

    const assistant = await response.json();

    console.log("✅  Aria assistant created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Assistant ID : ${assistant.id}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n👉  Copy the Assistant ID above into your .env.local:");
    console.log("   NEXT_PUBLIC_VAPI_ASSISTANT_ID=<paste here>\n");
}

createAssistant();