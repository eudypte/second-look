"use client";

import { FormEvent, useRef, useState } from "react";
import type { Verdict } from "@/lib/types";
import { ResultCard } from "./result-card";

const MAX_LENGTH = 1_000;

interface MessageCheckerProps {
  initialVerdict?: Verdict;
}

export function MessageChecker({ initialVerdict }: MessageCheckerProps) {
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(
    initialVerdict ?? null,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  async function handlePaste() {
    setMessage("");

    try {
      if (!navigator.clipboard?.readText) {
        throw new Error("Clipboard reading is unavailable");
      }

      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText.slice(0, MAX_LENGTH));

      if (clipboardText.length > MAX_LENGTH) {
        setMessage("We pasted the first 1,000 characters.");
      } else if (!clipboardText.trim()) {
        setMessage("There wasn't any text to paste.");
      }
    } catch {
      textAreaRef.current?.focus();
      setMessage("Press and hold here, then tap Paste");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!text.trim()) {
      textAreaRef.current?.focus();
      setMessage("Paste or type a message first.");
      return;
    }

    setIsChecking(true);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("The check could not be completed");
      }

      const nextVerdict = (await response.json()) as Verdict;
      setVerdict(nextVerdict);
    } catch {
      setMessage(
        "We couldn't check that message right now. Please try again in a moment.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  function handleReset() {
    setText("");
    setMessage("");
    setVerdict(null);
    requestAnimationFrame(() => textAreaRef.current?.focus());
  }

  if (verdict) {
    return <ResultCard verdict={verdict} onReset={handleReset} />;
  }

  return (
    <section className="checker-card" aria-labelledby="checker-title">
      <h2 id="checker-title">Paste the message here</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="message-text">
          Message to check
        </label>
        <textarea
          ref={textAreaRef}
          id="message-text"
          name="message"
          value={text}
          maxLength={MAX_LENGTH}
          rows={7}
          onChange={(event) => {
            setText(event.target.value);
            setMessage("");
          }}
          placeholder="Paste the whole text message, including any web addresses."
          disabled={isChecking}
        />

        <div className="field-details">
          <p className="form-message" role="status" aria-live="polite">
            {message}
          </p>
          <p
            className="character-count"
            aria-label={`${text.length} of 1,000 characters`}
          >
            {text.length.toLocaleString()} / 1,000
          </p>
        </div>

        <div className="form-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={handlePaste}
            disabled={isChecking}
          >
            <span aria-hidden="true">▣</span>
            Paste
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={isChecking}
          >
            {isChecking ? "Taking a second look..." : "Check this message"}
          </button>
        </div>
      </form>

      <div className="privacy-note">
        <span aria-hidden="true">●</span>
        <p>
          Second Look doesn&apos;t save your message. To check it, we send the text
          to Anthropic&apos;s AI, which deletes it within 30 days, and the web
          addresses to Google Safe Browsing and domain registries. Second Look
          never opens the link. You can cross out names or account numbers before
          pasting.
        </p>
      </div>
    </section>
  );
}
