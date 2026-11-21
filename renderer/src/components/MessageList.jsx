import { useEffect, useRef } from "react";
import { useChat } from "../store.js";

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageList() {
  const messages = useChat((s) => s.messages);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return <div className="messages empty">No messages yet. Say hi!</div>;
  }

  return (
    <ol className="messages">
      {messages.map((m) => (
        <li key={m.id} className={m.mine ? "message mine" : "message"}>
          <div className="meta">
            <span className="from">[{m.from}]</span> {m.mine ? "you" : m.nickname} ·{" "}
            {formatTime(m.timestamp)}
          </div>
          <div className="text">{m.text}</div>
        </li>
      ))}
      <li ref={endRef} aria-hidden="true" />
    </ol>
  );
}
