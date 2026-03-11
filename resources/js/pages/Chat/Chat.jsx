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
  const echoRef = useRef(null);
  const selectedUserRef = useRef(null);
  const activeRequestRef = useRef(0);
  const { user, token, loading } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    if (!token || !user?.id) return;

    const echo = makeEcho(token);
    echoRef.current = echo;

    echo.private(`chat.${user.id}`).listen("MessageSent", (e) => {
      const m = e.message;
      const activeChatUser = selectedUserRef.current;

      if (!activeChatUser) return;

      const isThisChat =
        (m.sender_id === activeChatUser.id && m.receiver_id === user.id) ||
        (m.sender_id === user.id && m.receiver_id === activeChatUser.id);

      if (isThisChat) {
        setMessages((prev) => {
          if (prev.some((message) => message.id === m.id)) {
            return prev;
          }

          return [...prev, m];
        });
      }
    });

    return () => {
      echo.leave(`chat.${user.id}`);
      echo.disconnect();
      echoRef.current = null;
    };
  }, [token, user?.id]);

  async function loadMessages(uid, options = {}) {
    const { beforeId = null, appendOlder = false } = options;
    const requestId = ++activeRequestRef.current;

    if (appendOlder) {
      setLoadingOlderMessages(true);
    } else {
      setLoadingMessages(true);
    }

    try {
      const params = { limit: 20 };

      if (beforeId) {
        params.before_id = beforeId;
      }

      const res = await api.get(`/messages/${uid}`, { params });

      if (requestId !== activeRequestRef.current) {
        return;
      }

      const fetchedMessages = res.data.data ?? [];
      setHasMoreMessages(Boolean(res.data.meta?.has_more));

      if (appendOlder) {
        setMessages((prev) => [...fetchedMessages, ...prev]);
      } else {
        setMessages(fetchedMessages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      if (appendOlder) {
        setLoadingOlderMessages(false);
      } else if (requestId === activeRequestRef.current) {
        setLoadingMessages(false);
      }
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
    activeRequestRef.current += 1;
    setHasMoreMessages(false);
    setMessages([]);
    setSelectedUser(user);
    await loadMessages(user.id);
  };

  async function handleLoadOlderMessages() {
    if (!selectedUser || loadingOlderMessages || messages.length === 0 || !hasMoreMessages) {
      return;
    }

    await loadMessages(selectedUser.id, {
      beforeId: messages[0].id,
      appendOlder: true,
    });
  }

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
          hasMoreMessages={hasMoreMessages}
          loadingOlderMessages={loadingOlderMessages}
          onLoadOlderMessages={handleLoadOlderMessages}
        />
      </div>
    </div>
  );
}
