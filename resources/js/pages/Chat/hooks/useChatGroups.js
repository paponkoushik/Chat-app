import { useCallback, useEffect, useState } from "react";
import api from "../../../api";
import { makeEcho } from "../../../echo";

export default function useChatGroups({ token, userId }) {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState(null);

  const loadGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      setGroupsError(null);
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (error) {
      console.error("Failed to load groups:", error);
      setGroupsError("Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const addGroup = useCallback((group) => {
    setGroups((prev) => {
      if (prev.some((item) => item.id === group.id)) {
        return prev;
      }

      return [...prev, group].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const createGroup = useCallback(async (payload) => {
    const res = await api.post("/groups", payload);

    addGroup(res.data);

    return res.data;
  }, [addGroup]);

  const incrementGroupUnreadCount = useCallback((groupId) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              unread_count: Number(group.unread_count ?? 0) + 1,
            }
          : group
      )
    );
  }, []);

  const clearGroupUnreadCount = useCallback((groupId) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              unread_count: 0,
            }
          : group
      )
    );
  }, []);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    const echo = makeEcho(token);

    echo.private(`chat.${userId}`).listen("GroupCreated", (e) => {
      addGroup({
        ...e.group,
        unread_count: e.group.unread_count ?? 0,
      });
    });

    return () => {
      echo.leave(`chat.${userId}`);
      echo.disconnect();
    };
  }, [token, userId, addGroup]);

  return {
    groups,
    loadingGroups,
    groupsError,
    createGroup,
    addGroup,
    incrementGroupUnreadCount,
    clearGroupUnreadCount,
    reloadGroups: loadGroups,
  };
}
