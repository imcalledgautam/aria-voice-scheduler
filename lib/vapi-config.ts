// ─────────────────────────────────────────────────────────────
// VAPI Assistant Configuration
//
// This file defines:
// 1. The assistant's personality & system prompt (what Aria says)
// 2. The "schedule_meeting" tool (what Aria can DO — call our API)
// ─────────────────────────────────────────────────────────────

export const ARIA_SYSTEM_PROMPT = `You are Aria, a warm and efficient voice scheduling assistant. Your job is to help users schedule meetings by collecting their details and creating a real calendar event.

Follow this exact conversation flow:

1. Greet the user warmly and introduce yourself as Aria.
2. Ask for their full name.
3. Ask for the date they'd like to schedule the meeting (e.g., "February 21st").
4. Ask for the preferred time (e.g., "2:00 PM").
5. Ask for a meeting title or purpose (tell them it's optional — they can say "skip" or "general meeting").
6. Confirm all details back to the user clearly:
   - Name, date, time, and title
   - Ask: "Shall I go ahead and book this?"
7. If they confirm, call the schedule_meeting function immediately.
8. Once booked, tell them the meeting is confirmed and wish them well.

Important rules:
- Be concise and friendly — this is a voice conversation, keep sentences short.
- Don't ask multiple questions at once.
- If the user gives you all details at once, confirm them and proceed.
- For the meeting title, if they skip it, use "Meeting" as the default.
- Always confirm before booking.
- If booking fails, apologize and ask them to try again.`;

// ─────────────────────────────────────────────────────────────
// Tool Definition — this is what VAPI sends to our backend
// when Aria decides to create the calendar event
// ─────────────────────────────────────────────────────────────
export const SCHEDULE_MEETING_TOOL = {
    type: "function" as const,
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
                    description:
                        'The date of the meeting in a clear format, e.g. "February 21 2026" or "2026-02-21".',
                },
                time: {
                    type: "string",
                    description:
                        'The time of the meeting, e.g. "2:00 PM" or "14:00".',
                },
                title: {
                    type: "string",
                    description:
                        'The title or purpose of the meeting. Defaults to "Meeting" if not provided.',
                },
                timezone: {
                    type: "string",
                    description:
                        'The IANA timezone string, e.g. "America/New_York". If unknown, use "UTC".',
                },
            },
            required: ["name", "date", "time"],
        },
    },
};

// ─────────────────────────────────────────────────────────────
// Full assistant config object — passed to VAPI when creating
// or updating the assistant via the VAPI dashboard / API
// ─────────────────────────────────────────────────────────────
export const ARIA_ASSISTANT_CONFIG = {
    name: "Aria",
    firstMessage:
        "Hi there! I'm Aria, your scheduling assistant. I'd love to help you book a meeting. Could you start by telling me your name?",
    model: {
        provider: "anthropic",
        model: "claude-haiku-20240307",
        temperature: 0.7,
        systemPrompt: ARIA_SYSTEM_PROMPT,
        tools: [SCHEDULE_MEETING_TOOL],
    },
    voice: {
        provider: "playht",
        voiceId: "jennifer",
    },
    // How long to wait before ending the call due to silence
    silenceTimeoutSeconds: 30,
    // Max call duration — 10 minutes is plenty for scheduling
    maxDurationSeconds: 600,
    // What Aria says if the call ends unexpectedly
    endCallMessage:
        "It was great talking with you! Your meeting details have been saved. Goodbye!",
};