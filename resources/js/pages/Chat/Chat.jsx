
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../api";
import { makeEcho } from "../../echo";
import { logout } from "../../store/authSlice";
import ChatBox from "./ChatBox";
import ProfileBar from "./ProfileBar";
import UserList from "./UserList";

export default function Chat() {
  const bottomRef = useRef(null);
  const { user, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Echo setup
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

  // Load users
  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }

  // Load messages
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

  // Send message
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

  // Select user handler
  const handleSelectUser = async (user) => {
    setMessages([]);
    setSelectedUser(user);
    await loadMessages(user.id);
  };

  // Logout handler
  async function signoff() {
    try {
      await api.post("/logout");
    } catch (e) {
      console.log('Logout error:', e);
    }
    dispatch(logout());
  }

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Profile Bar - Top */}
      <ProfileBar onLogout={signoff} />

      <div className="flex flex-1 overflow-hidden">
        {/* User List - Left Sidebar */}
        <UserList
          users={users}
          currentUserId={user?.id}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          loading={loadingUsers}
        />

        {/* Chat Box - Right Main Area */}
        <ChatBox
          selectedUser={selectedUser}
          messages={messages}
          currentUserId={user?.id}
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