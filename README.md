# Aria — Voice Scheduling Assistant

A real-time AI voice assistant that schedules meetings through natural conversation and creates real Google Calendar events instantly.

---

## 🔗 Live Demo

**Deployed URL:** https://aria-voice-scheduler-ih5v.vercel.app

---

## 🧪 How to Test the Agent

1. Open the deployed URL: https://aria-voice-scheduler-ih5v.vercel.app
2. Click the **microphone button** in the center of the screen
3. Allow microphone access when the browser prompts
4. Have a natural conversation with Aria:
   - She will ask for your **name**
   - Then your preferred **date & time**
   - Then an optional **meeting title**
   - She will **confirm all details** and ask for your approval
5. Say **"Yes"** to confirm — the event is created in Google Calendar immediately
6. The conversation transcript appears on screen in real time

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Voice & AI Orchestration | [VAPI](https://vapi.ai) |
| LLM | Claude Haiku (Anthropic) via VAPI |
| Text-to-Speech | ElevenLabs (via VAPI) |
| Calendar Integration | Google Calendar API |
| Frontend | Next.js 15 + TypeScript |
| Deployment | Vercel |

---

## 📅 Calendar Integration

Aria uses the **Google Calendar API** with a **Service Account** for server-to-server authentication — no OAuth flow required.

### How it works:

1. A Google Cloud Service Account (`aria-calendar-bot`) is created with Calendar API access
2. The service account is shared with the target Google Calendar with **"Make changes to events"** permission
3. When Aria collects all meeting details, VAPI triggers a webhook call to `/api/vapi-webhook`
4. The webhook parses the tool call arguments (name, date, time, title, timezone)
5. The backend calls `google.calendar.events.insert()` to create the event
6. The result is returned to VAPI, and Aria speaks the confirmation to the user

### API Flow:
```
User speaks → VAPI (voice layer) → Claude Haiku (LLM)
                                         ↓
                              schedule_meeting tool call
                                         ↓
                          POST /api/vapi-webhook (Next.js)
                                         ↓
                          Google Calendar API → Event Created
                                         ↓
                          Confirmation spoken back to user
```

---

## 💻 How to Run Locally

### Prerequisites
- Node.js 18+
- A [VAPI](https://vapi.ai) account
- A Google Cloud project with Calendar API enabled
- A Google Service Account with Calendar access

### 1. Clone the repository
```bash
git clone https://github.com/imcalledgautam/aria-voice-scheduler.git
cd aria-voice-scheduler
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local` with your credentials:
```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=your_vapi_private_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-gmail@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Create the VAPI assistant
```bash
node scripts/create-vapi-assistant.js
```
Copy the printed Assistant ID into `NEXT_PUBLIC_VAPI_ASSISTANT_ID` in `.env.local`

### 5. Expose localhost for VAPI webhooks
```bash
npx localtunnel --port 3000
```
Copy the tunnel URL and update the VAPI assistant's server URL:
```bash
# Replace with your tunnel URL and keys
Invoke-RestMethod -Method PATCH -Uri "https://api.vapi.ai/assistant/YOUR_ASSISTANT_ID" \
  -Headers @{"Authorization" = "Bearer YOUR_VAPI_PRIVATE_KEY"} \
  -Body '{"serverUrl": "https://your-tunnel-url.loca.lt/api/vapi-webhook"}'
```

### 6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
aria-voice-scheduler/
├── app/
│   ├── api/
│   │   ├── schedule/
│   │   │   └── route.ts        # Direct calendar booking endpoint
│   │   └── vapi-webhook/
│   │       └── route.ts        # VAPI tool call webhook handler
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.module.css
│   └── page.tsx                # Main UI with voice interface
├── lib/
│   ├── date-helpers.ts         # Date/time parsing utilities
│   ├── google-calendar.ts      # Google Calendar API integration
│   └── vapi-config.ts          # VAPI assistant configuration
├── scripts/
│   └── create-vapi-assistant.js # One-time assistant setup script
├── .env.example
└── README.md
```

---

## 🔑 Key Features

- **Real-time voice conversation** — natural back-and-forth dialogue
- **Live transcript** — conversation appears on screen as you speak
- **Voice visualizer** — mic button pulses with audio levels
- **Real calendar events** — events appear instantly in Google Calendar
- **Timezone aware** — correctly handles local time conversion
- **Deployed & accessible** — no setup required to test the live URL

---

## 📸 Demo

> Talk to Aria at: https://aria-voice-scheduler-ih5v.vercel.app

Example conversation:
```
Aria: Hi! I'm Aria. Could you tell me your name?
User: John
Aria: Great, John! What date would you like to schedule the meeting?
User: February 25th
Aria: Perfect. What time works for you?
User: 2 PM
Aria: Got it. What's the meeting title?
User: Product Review
Aria: To confirm — John, February 25th at 2 PM, Product Review. Shall I book this?
User: Yes
Aria: Your meeting is booked! You'll see Product Review in your Google Calendar. Have a great meeting!
```
