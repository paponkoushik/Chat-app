// components/Chat/UserList.jsx
export default function UserList({ 
  users, 
  currentUserId, 
  selectedUser, 
  onSelectUser,
  loading 
}) {
  const filteredUsers = users.filter((u) => u.id !== currentUserId);

  return (
    <div className="w-72 bg-white border-r p-4 h-full">
      <h4 className="mt-6 font-semibold">Users</h4>
      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No users found</div>
        ) : (
          filteredUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelectUser(u)}
              className={`w-full text-left p-3 rounded-xl border transition ${
                selectedUser?.id === u.id 
                  ? "bg-gray-100 border-gray-300" 
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}