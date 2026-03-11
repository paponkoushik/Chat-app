import { useCallback, useEffect, useState } from "react";
import api from "../../../api";

export default function useChatUsers() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);
        setUsersError(null);
        const res = await api.get("/users");
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to load users:", error);
        setUsersError("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  const incrementUnreadCount = useCallback((userId) => {
    setUsers((prev) =>
      prev.map((listUser) =>
        listUser.id === userId
          ? {
              ...listUser,
              unread_count: Number(listUser.unread_count ?? 0) + 1,
            }
          : listUser
      )
    );
  }, []);

  const clearUnreadCount = useCallback((userId) => {
    setUsers((prev) =>
      prev.map((listUser) =>
        listUser.id === userId
          ? {
              ...listUser,
              unread_count: 0,
            }
          : listUser
      )
    );
  }, []);

  return {
    users,
    loadingUsers,
    usersError,
    incrementUnreadCount,
    clearUnreadCount,
  };
}
