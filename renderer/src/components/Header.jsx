import { useChat } from "../store.js";

export default function Header() {
  const room = useChat((s) => s.room);
  const status = useChat((s) => s.status);
  const peers = useChat((s) => s.peers);
  const error = useChat((s) => s.error);

  let info;
  if (status !== "ready") info = "connecting to swarm…";
  else if (peers === 0) info = "no peers yet";
  else info = `${peers} ${peers === 1 ? "peer" : "peers"} online`;

  return (
    <header className="header">
      <strong># {room}</strong>
      <span>{info}</span>
      {error && <span className="error">{error}</span>}
    </header>
  );
}
