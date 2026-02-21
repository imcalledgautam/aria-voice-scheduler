"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import styles from "./page.module.css";

// ── Types ─────────────────────────────────────────────────────
type CallStatus = "idle" | "connecting" | "active" | "ending";

interface Transcript {
  role: "user" | "assistant";
  text: string;
}

// ── Component ─────────────────────────────────────────────────
export default function Home() {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // ── Init VAPI ────────────────────────────────────────────────
  useEffect(() => {
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setStatus("active"));
    vapi.on("call-end", () => {
      setStatus("idle");
      setVolumeLevel(0);
    });

    vapi.on("speech-start", () => setVolumeLevel(0.6));
    vapi.on("speech-end", () => setVolumeLevel(0));

    vapi.on("volume-level", (vol: number) => {
      setVolumeLevel(vol);
    });

    vapi.on("message", (msg: { type: string; role?: string; transcript?: string; transcriptType?: string }) => {
      if (
        msg.type === "transcript" &&
        msg.transcriptType === "final" &&
        msg.role &&
        msg.transcript
      ) {
        setTranscripts((prev) => [
          ...prev,
          { role: msg.role as "user" | "assistant", text: msg.transcript! },
        ]);
      }
    });

    vapi.on("error", (err: Error) => {
      console.error("[VAPI error]", err);
      setStatus("idle");
    });

    return () => {
      vapi.stop();
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // ── Handlers ─────────────────────────────────────────────────
  const startCall = async () => {
    if (!vapiRef.current) return;
    setStatus("connecting");
    setTranscripts([]);
    try {
      await vapiRef.current.start(
        process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
        {
          server: {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi-webhook`,
          },
        }
      );
    } catch (err) {
      console.error("Failed to start call:", err);
      setStatus("idle");
    }
  };

  const endCall = () => {
    setStatus("ending");
    vapiRef.current?.stop();
  };

  const toggleMute = () => {
    if (!vapiRef.current) return;
    const newMuted = !isMuted;
    vapiRef.current.setMuted(newMuted);
    setIsMuted(newMuted);
  };

  // ── Render ────────────────────────────────────────────────────
  const isActive = status === "active";
  const isConnecting = status === "connecting";
  const isEnding = status === "ending";
  const isBusy = isConnecting || isEnding;

  return (
    <main className={styles.main}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>◈</span>
            <span className={styles.logoText}>ARIA</span>
          </div>
          <p className={styles.tagline}>Voice Scheduling Assistant</p>
        </header>

        <div className={styles.card}>
          <div className={styles.statusRow}>
            <span className={`${styles.statusDot} ${isActive ? styles.dotActive : isBusy ? styles.dotConnecting : styles.dotIdle}`} />
            <span className={styles.statusText}>
              {isConnecting && "Connecting..."}
              {isActive && "Connected — speak now"}
              {isEnding && "Ending call..."}
              {status === "idle" && "Ready to schedule"}
            </span>
          </div>

          <div className={styles.visualizerWrap}>
            <div
              className={`${styles.visualizerRing} ${isActive ? styles.ringActive : ""}`}
              style={isActive ? { transform: `scale(${1 + volumeLevel * 0.4})`, opacity: 0.6 + volumeLevel * 0.4 } : {}}
            />
            <div
              className={`${styles.visualizerRing} ${styles.ringMid} ${isActive ? styles.ringActive : ""}`}
              style={isActive ? { transform: `scale(${1 + volumeLevel * 0.25})` } : {}}
            />
            <button
              className={`${styles.micButton} ${isActive ? styles.micActive : ""} ${isBusy ? styles.micBusy : ""}`}
              onClick={isActive ? endCall : !isBusy ? startCall : undefined}
              disabled={isBusy}
              aria-label={isActive ? "End call" : "Start call"}
            >
              {isActive ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : isConnecting || isEnding ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinner}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          <p className={styles.ctaText}>
            {isActive ? "Aria is listening..." : isBusy ? "Please wait..." : "Tap the mic to start scheduling"}
          </p>

          {isActive && (
            <button className={`${styles.muteBtn} ${isMuted ? styles.mutedActive : ""}`} onClick={toggleMute}>
              {isMuted ? "🔇 Unmute" : "🎙 Mute"}
            </button>
          )}
        </div>

        {transcripts.length > 0 && (
          <div className={styles.transcriptPanel}>
            <h3 className={styles.transcriptTitle}>Conversation</h3>
            <div className={styles.transcriptList}>
              {transcripts.map((t, i) => (
                <div key={i} className={`${styles.transcriptItem} ${t.role === "assistant" ? styles.transcriptAssistant : styles.transcriptUser}`}>
                  <span className={styles.transcriptRole}>{t.role === "assistant" ? "Aria" : "You"}</span>
                  <p className={styles.transcriptText}>{t.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {status === "idle" && transcripts.length === 0 && (
          <div className={styles.steps}>
            {[
              { n: "01", label: "Tap the mic" },
              { n: "02", label: "Tell Aria your details" },
              { n: "03", label: "Event added to Calendar" },
            ].map((s) => (
              <div key={s.n} className={styles.step}>
                <span className={styles.stepNum}>{s.n}</span>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
