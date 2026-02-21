import { google } from "googleapis";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface CalendarEventInput {
    summary: string;       // Meeting title
    attendeeName: string;  // Person's name (goes in description)
    startDateTime: string; // ISO 8601 e.g. "2025-02-21T14:00:00"
    endDateTime: string;   // ISO 8601 e.g. "2025-02-21T15:00:00"
    timeZone?: string;     // e.g. "America/New_York" — defaults to UTC
}

export interface CalendarEventResult {
    success: boolean;
    eventId?: string;
    eventLink?: string;
    error?: string;
}

// ─────────────────────────────────────────────────────────────
// Auth — Service Account
// ─────────────────────────────────────────────────────────────
function getGoogleAuthClient() {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!process.env.GOOGLE_CLIENT_EMAIL || !privateKey) {
        throw new Error(
            "Missing Google credentials. Check GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local"
        );
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    return auth;
}

// ─────────────────────────────────────────────────────────────
// Create Calendar Event
// ─────────────────────────────────────────────────────────────
export async function createCalendarEvent(
    input: CalendarEventInput
): Promise<CalendarEventResult> {
    try {
        const auth = getGoogleAuthClient();
        const calendar = google.calendar({ version: "v3", auth });

        const calendarId = process.env.GOOGLE_CALENDAR_ID;
        if (!calendarId) {
            throw new Error("Missing GOOGLE_CALENDAR_ID in .env.local");
        }

        const timeZone = input.timeZone || "UTC";

        const event = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary: input.summary,
                description: `Meeting scheduled by Aria Voice Assistant for ${input.attendeeName}.`,
                start: {
                    dateTime: input.startDateTime,
                    timeZone,
                },
                end: {
                    dateTime: input.endDateTime,
                    timeZone,
                },
                // Colour: Blueberry (cosmetic touch)
                colorId: "9",
            },
        });

        return {
            success: true,
            eventId: event.data.id ?? undefined,
            eventLink: event.data.htmlLink ?? undefined,
        };
    } catch (err: unknown) {
        console.error("[Google Calendar] Error creating event:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        return {
            success: false,
            error: message,
        };
    }
}