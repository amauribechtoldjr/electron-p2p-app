import { useState } from "react";
import { useChat } from "../store.js";

export default function JoinScreen() {
  const join = useChat((s) => s.join);
  const [nickname, setNickname] = useState("");
  const [room, setRoom] = useState("lobby");

  function handleSubmit(e) {
    e.preventDefault();
    if (!nickname.trim() || !room.trim()) return;
    join(room.trim(), nickname.trim());
  }

  return (
    <form className="join" onSubmit={handleSubmit}>
      <h1>P2P Messages</h1>
      <label>
        Nickname
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={32}
          autoFocus
          required
        />
      </label>
      <label>
        Room
        <input value={room} onChange={(e) => setRoom(e.target.value)} required />
      </label>
      <button type="submit">Join</button>
      <p className="hint">Anyone who types the same room name joins the same chat.</p>
    </form>
  );
}
