import { useEffect } from "react";
import { useChat } from "./store.js";
import JoinScreen from "./components/JoinScreen.jsx";
import Header from "./components/Header.jsx";
import MessageList from "./components/MessageList.jsx";
import Composer from "./components/Composer.jsx";

export default function App() {
  const status = useChat((s) => s.status);

  useEffect(() => {
    // window.chat only exists inside Electron (exposed by the preload)
    if (!window.chat) return;
    // listen first, then ask the worker for its current state (it may have started before this page)
    const off = window.chat.onEvent(useChat.getState().handleEvent);
    window.chat.send({ type: "sync" });
    // removes the ipcRenderer listener; StrictMode's double mount checks this
    return off;
  }, []);

  if (!window.chat) {
    return (
      <p className="notice">
        Open this page inside the Electron app: window.chat only exists there.
      </p>
    );
  }

  if (status === "idle") return <JoinScreen />;

  return (
    <div className="chat">
      <Header />
      <MessageList />
      <Composer />
    </div>
  );
}
