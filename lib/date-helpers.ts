// ─────────────────────────────────────────────────────────────
// Date & Time Helpers
// Used by the VAPI tool handler to parse what the AI extracts
// from the conversation and convert it into ISO 8601 format.
// ─────────────────────────────────────────────────────────────

/**
 * Takes a natural-language-ish date string like "February 21 2025"
 * or "2025-02-21" and a time like "2:00 PM" or "14:00"
 * and returns an ISO 8601 datetime string: "2025-02-21T14:00:00"
 */
export function buildISODateTime(date: string, time: string): string {
    // Normalise the time string to 24h
    const time24 = convertTo24Hour(time.trim());

    // Parse date — try native Date first
    const rawDate = new Date(`${date} ${time24}`);

    if (isNaN(rawDate.getTime())) {
        throw new Error(`Cannot parse date/time: "${date}" "${time}"`);
    }

    // Return local ISO without the trailing Z (calendar API wants local time + timeZone field)
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = rawDate.getFullYear();
    const mm = pad(rawDate.getMonth() + 1);
    const dd = pad(rawDate.getDate());
    const hh = pad(rawDate.getHours());
    const min = pad(rawDate.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

/**
 * Adds `durationMinutes` to an ISO datetime string.
 * Default meeting length: 60 minutes.
 */
export function addMinutes(isoDateTime: string, durationMinutes = 60): string {
    const date = new Date(isoDateTime);
    date.setMinutes(date.getMinutes() + durationMinutes);

    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

/**
 * Converts "2:30 PM" → "14:30" and "9:00 AM" → "09:00".
 * If already in 24h format, returns as-is.
 */
function convertTo24Hour(time: string): string {
    const amPmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!amPmMatch) {
        // Assume it's already 24h or just "HH:MM"
        return time;
    }

    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3].toUpperCase();

    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
}