import { useState } from "react";
import { useChat } from "../store.js";

export default function Composer() {
  const send = useChat((s) => s.send);
  const ready = useChat((s) => s.status === "ready");
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    send(value);
    setText("");
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ready ? "Type a message…" : "Connecting…"}
        disabled={!ready}
      />
      <button type="submit" disabled={!ready || !text.trim()}>
        Send
      </button>
    </form>
  );
}
