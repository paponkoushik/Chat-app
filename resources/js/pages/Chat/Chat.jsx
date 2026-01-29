import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api";
import { makeEcho } from "../../echo";
import { logoutUser } from "../../store/authSlice";
import ChatBox from "./ChatBox";
import ProfileBar from "./ProfileBar";
import UserList from "./UserList";

export default function Chat() {

  const bottomRef = useRef(null);
  const { user, token, loading } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!token || !user?.id) return;

    const echo = makeEcho(token);

    echo.private(`chat.${user.id}`).listen("MessageSent", (e) => {
      const m = e.message;
      if (!selectedUser) return;

      const isThisChat =
        (m.sender_id === selectedUser.id && m.receiver_id === user.id) ||
        (m.sender_id === user.id && m.receiver_id === selectedUser.id);

      if (isThisChat) {
        setMessages((prev) => [...prev, m]);
      }
    });

    return () => {
      echo.leave(`chat.${user.id}`);
      echo.disconnect();
    };
  }, [token, user?.id, selectedUser?.id]);

  async function loadMessages(uid) {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/${uid}`);
      setMessages(res.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;

    const temp = {
      id: "temp-" + Date.now(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
      message: text,
    };

    setMessages((prev) => [...prev, temp]);
    setText("");

    try {
      const res = await api.post("/messages/send", {
        receiver_id: selectedUser.id,
        message: text,
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === temp.id ? res.data : m))
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      alert("Message send failed");
    }
  }

  const handleSelectUser = async (user) => {
    setMessages([]);
    setSelectedUser(user);
    await loadMessages(user.id);
  };

  async function handleLogout() {
    await dispatch(logoutUser());
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <ProfileBar onLogout={handleLogout} loggingOut={loading} /> 

      <div className="flex flex-1 overflow-hidden">
        <UserList
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
        />

        <ChatBox
          selectedUser={selectedUser}
          messages={messages}
          currentUserId={user?.id} // ChatBox-এ দরকার message alignment-এর জন্য
          text={text}
          setText={setText}
          onSendMessage={sendMessage}
          bottomRef={bottomRef}
          loading={loadingMessages}
        />
      </div>
    </div>
  );
}