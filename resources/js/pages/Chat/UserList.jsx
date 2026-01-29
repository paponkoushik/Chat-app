import { useEffect, useState } from "react";
import api from "../../api";

export default function UserList({ 
  selectedUser, 
  onSelectUser 
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load users on component mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const res = await api.get("/users");
        // Backend already excludes auth user, so no filtering needed
        setUsers(res.data);
      } catch (error) {
        console.error("Failed to load users:", error);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []); // No dependencies needed

  return (
    <div className="w-72 bg-white border-r p-4 h-full overflow-y-auto">
      <h4 className="mt-6 font-semibold text-gray-700">Users</h4>
      
      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading users...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No other users available</div>
        ) : (
          users.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelectUser(u)}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                selectedUser?.id === u.id 
                  ? "bg-blue-50 border-blue-200" 
                  : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Optional: Add user avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {u.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}