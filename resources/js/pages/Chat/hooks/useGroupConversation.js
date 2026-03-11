import { useEffect, useRef, useState } from "react";
import api from "../../../api";
import { makeEcho } from "../../../echo";

export default function useGroupConversation({
  token,
  currentUserId,
  groups,
  selectedGroup,
  incrementGroupUnreadCount,
  clearGroupUnreadCount,
}) {
  const normalizedCurrentUserId = Number(currentUserId);
  const bottomRef = useRef(null);
  const activeRequestRef = useRef(0);
  const selectedGroupRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    if (!token || groups.length === 0) {
      return;
    }

    const echo = makeEcho(token);

    const channels = groups.map((group) => `group.${group.id}`);

    groups.forEach((group) => {
      echo.private(`group.${group.id}`).listen("GroupMessageSent", (e) => {
        const message = e.message;
        const activeGroup = selectedGroupRef.current;
        const senderId = Number(message.sender_id);

        if (activeGroup?.id === group.id) {
          if (senderId === normalizedCurrentUserId) {
            return;
          }

          setMessages((prev) => {
            if (prev.some((item) => item.id === message.id)) {
              return prev;
            }

            return [...prev, message];
          });

          if (senderId !== normalizedCurrentUserId) {
            void markGroupAsRead(group.id);
          }

          return;
        }

        if (senderId !== normalizedCurrentUserId) {
          incrementGroupUnreadCount(group.id);
        }
      });
    });

    return () => {
      channels.forEach((channel) => echo.leave(channel));
      echo.disconnect();
    };
  }, [token, groups, currentUserId, incrementGroupUnreadCount]);

  useEffect(() => {
    if (!selectedGroup) {
      setMessages([]);
      setText("");
      setHasMoreMessages(false);
      return;
    }

    loadMessages(selectedGroup.id);
    markGroupAsRead(selectedGroup.id);
  }, [selectedGroup?.id]);

  async function loadMessages(groupId, options = {}) {
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

      const res = await api.get(`/groups/${groupId}/messages`, { params });

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
      console.error("Failed to load group messages:", error);
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
    if (!text.trim() || !selectedGroup) return;
    const messageText = text.trim();

    const temp = {
      id: "temp-" + Date.now(),
      sender_id: normalizedCurrentUserId,
      message: messageText,
      sender: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, temp]);
    setText("");

    try {
      const res = await api.post(`/groups/${selectedGroup.id}/messages`, {
        message: messageText,
      });

      setMessages((prev) =>
        prev.map((message) => (message.id === temp.id ? res.data : message))
      );
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== temp.id));
      alert("Group message send failed");
    }
  }

  async function markGroupAsRead(groupId) {
    try {
      await api.post(`/groups/${groupId}/read`);
      clearGroupUnreadCount(groupId);
    } catch (error) {
      console.error("Failed to mark group as read:", error);
    }
  }

  async function loadOlderMessages() {
    if (!selectedGroup || loadingOlderMessages || messages.length === 0 || !hasMoreMessages) {
      return;
    }

    await loadMessages(selectedGroup.id, {
      beforeId: messages[0].id,
      appendOlder: true,
    });
  }

  return {
    bottomRef,
    messages,
    text,
    setText,
    loadingMessages,
    loadingOlderMessages,
    hasMoreMessages,
    sendMessage,
    loadOlderMessages,
  };
}
