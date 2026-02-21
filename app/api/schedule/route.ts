// app/api/schedule/route.ts
//
// This endpoint is called by the VAPI webhook handler when
// Aria decides to create a calendar event.
//
// POST /api/schedule
// Body: { name, date, time, title?, timezone? }

import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-calendar";
import { buildISODateTime, addMinutes } from "@/lib/date-helpers";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, date, time, title, timezone } = body;

        // ── Validate required fields ──────────────────────────────
        if (!name || !date || !time) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: name, date, time" },
                { status: 400 }
            );
        }

        // ── Build ISO date strings ────────────────────────────────
        let startDateTime: string;
        try {
            startDateTime = buildISODateTime(date, time);
        } catch {
            return NextResponse.json(
                { success: false, error: `Could not parse date/time: "${date}" "${time}"` },
                { status: 400 }
            );
        }

        const endDateTime = addMinutes(startDateTime, 60); // 1 hour meeting

        // ── Create the calendar event ─────────────────────────────
        const result = await createCalendarEvent({
            summary: title || "Meeting",
            attendeeName: name,
            startDateTime,
            endDateTime,
            timeZone: timezone || "UTC",
        });

        if (!result.success) {
            console.error("[/api/schedule] Calendar error:", result.error);
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        console.log(`[/api/schedule] ✅ Event created for ${name}:`, result.eventLink);

        return NextResponse.json({
            success: true,
            message: `Meeting "${title || "Meeting"}" has been scheduled for ${name} on ${date} at ${time}.`,
            eventId: result.eventId,
            eventLink: result.eventLink,
        });
    } catch (err) {
        console.error("[/api/schedule] Unexpected error:", err);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}