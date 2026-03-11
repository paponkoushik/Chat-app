import { useEffect, useRef, useState } from "react";
import api from "../../../api";
import { makeEcho } from "../../../echo";

export default function useChatConversation({
  user,
  token,
  incrementUnreadCount,
  clearUnreadCount,
}) {
  const bottomRef = useRef(null);
  const selectedUserRef = useRef(null);
  const activeRequestRef = useRef(0);

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

    echo.private(`chat.${user.id}`).listen("MessageSent", (e) => {
      const message = e.message;
      const activeChatUser = selectedUserRef.current;

      if (message.receiver_id === user.id) {
        incrementUnreadCount(message.sender_id);
      }

      if (!activeChatUser) return;

      const isThisChat =
        (message.sender_id === activeChatUser.id && message.receiver_id === user.id) ||
        (message.sender_id === user.id && message.receiver_id === activeChatUser.id);

      if (!isThisChat) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev;
        }

        return [...prev, message];
      });
    });

    echo.private(`chat.${user.id}`).listen("MessagesSeen", (e) => {
      setMessages((prev) =>
        prev.map((message) =>
          e.messageIds.includes(message.id)
            ? { ...message, seen_at: e.seenAt }
            : message
        )
      );
    });

    return () => {
      echo.leave(`chat.${user.id}`);
      echo.disconnect();
    };
  }, [token, user?.id, incrementUnreadCount]);

  useEffect(() => {
    if (!selectedUser || !user?.id || loadingMessages) {
      return;
    }

    const hasUnseenIncomingMessages = messages.some(
      (message) =>
        message.sender_id === selectedUser.id &&
        message.receiver_id === user.id &&
        !message.seen_at &&
        !String(message.id).startsWith("temp-")
    );

    if (hasUnseenIncomingMessages) {
      markConversationSeen(selectedUser.id);
    }
  }, [messages, selectedUser, user?.id, loadingMessages]);

  async function loadMessages(userId, options = {}) {
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

      const res = await api.get(`/messages/${userId}`, { params });

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

  async function markConversationSeen(userId) {
    try {
      const res = await api.post(`/messages/${userId}/seen`);

      if (!res.data?.message_ids?.length) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          res.data.message_ids.includes(message.id)
            ? { ...message, seen_at: res.data.seen_at }
            : message
        )
      );
      clearUnreadCount(userId);
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
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
        prev.map((message) => (message.id === temp.id ? res.data : message))
      );
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== temp.id));
      alert("Message send failed");
    }
  }

  async function selectUser(nextUser) {
    activeRequestRef.current += 1;
    setHasMoreMessages(false);
    setMessages([]);
    setSelectedUser(nextUser);
    await loadMessages(nextUser.id);
    await markConversationSeen(nextUser.id);
  }

  async function loadOlderMessages() {
    if (!selectedUser || loadingOlderMessages || messages.length === 0 || !hasMoreMessages) {
      return;
    }

    await loadMessages(selectedUser.id, {
      beforeId: messages[0].id,
      appendOlder: true,
    });
  }

  return {
    bottomRef,
    selectedUser,
    messages,
    text,
    setText,
    loadingMessages,
    loadingOlderMessages,
    hasMoreMessages,
    sendMessage,
    selectUser,
    loadOlderMessages,
  };
}
