// app/api/vapi-webhook/route.ts
//
// VAPI calls THIS endpoint when Aria invokes the schedule_meeting tool.
// VAPI sends a webhook with the tool call arguments, we create the
// calendar event and return the result back to VAPI so Aria can
// speak the confirmation to the user.
//
// POST /api/vapi-webhook

import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-calendar";
import { buildISODateTime, addMinutes } from "@/lib/date-helpers";

// ── Types for VAPI webhook payload ────────────────────────────
interface VapiToolCallFunction {
    name: string;
    arguments: string; // JSON string
}

interface VapiToolCall {
    id: string;
    type: "function";
    function: VapiToolCallFunction;
}

interface VapiMessage {
    type: string;
    toolCallList?: VapiToolCall[];
    toolCalls?: VapiToolCall[];
}

interface VapiWebhookBody {
    message: VapiMessage;
}

// ── Main handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body: VapiWebhookBody = await req.json();
        const message = body.message;

        console.log("[vapi-webhook] Received message type:", message?.type);

        // VAPI sends different message types — we only care about tool-calls
        if (message?.type !== "tool-calls") {
            return NextResponse.json({ received: true });
        }

        // Get the tool call list (VAPI uses either key)
        const toolCalls = message.toolCallList || message.toolCalls || [];

        // Find the schedule_meeting tool call
        const scheduleTool = toolCalls.find(
            (tc) => tc.function?.name === "schedule_meeting"
        );

        if (!scheduleTool) {
            console.log("[vapi-webhook] No schedule_meeting tool call found");
            return NextResponse.json({ received: true });
        }

        // ── Parse arguments ───────────────────────────────────────
        let args: {
            name: string;
            date: string;
            time: string;
            title?: string;
            timezone?: string;
        };

        try {
            args =
                typeof scheduleTool.function.arguments === "string"
                    ? JSON.parse(scheduleTool.function.arguments)
                    : scheduleTool.function.arguments;
        } catch {
            return buildToolResult(scheduleTool.id, false, "Failed to parse meeting details.");
        }

        console.log("[vapi-webhook] Scheduling meeting:", args);

        // ── Build date/time ───────────────────────────────────────
        let startDateTime: string;
        try {
            startDateTime = buildISODateTime(args.date, args.time);
        } catch {
            return buildToolResult(
                scheduleTool.id,
                false,
                `I couldn't understand the date "${args.date}" and time "${args.time}". Could you try again?`
            );
        }

        const endDateTime = addMinutes(startDateTime, 60);

        // ── Create calendar event ─────────────────────────────────
        const result = await createCalendarEvent({
            summary: args.title || "Meeting",
            attendeeName: args.name,
            startDateTime,
            endDateTime,
            timeZone: args.timezone || "UTC",
        });

        if (!result.success) {
            console.error("[vapi-webhook] Calendar error:", result.error);
            return buildToolResult(
                scheduleTool.id,
                false,
                "I'm sorry, there was a problem creating the calendar event. Please try again."
            );
        }

        console.log("[vapi-webhook] ✅ Event created:", result.eventLink);

        return buildToolResult(
            scheduleTool.id,
            true,
            `Your meeting "${args.title || "Meeting"}" has been successfully scheduled for ${args.date} at ${args.time}. You'll find it in your Google Calendar!`
        );
    } catch (err) {
        console.error("[vapi-webhook] Unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── Helper: format the response VAPI expects ─────────────────
function buildToolResult(toolCallId: string, success: boolean, message: string) {
    return NextResponse.json({
        results: [
            {
                toolCallId,
                result: JSON.stringify({ success, message }),
            },
        ],
    });
}