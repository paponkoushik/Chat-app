import { memo } from "react";

const UserListItem = memo(function UserListItem({
  user,
  isSelected,
  onSelectUser,
}) {
  return (
    <button
      onClick={() => onSelectUser(user)}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
        isSelected
          ? "bg-blue-50 border-blue-200"
          : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-medium">
            {user.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800">{user.name}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        {user.unread_count > 0 && (
          <div className="min-w-6 rounded-full bg-red-500 px-2 py-0.5 text-center text-xs font-semibold text-white">
            {user.unread_count}
          </div>
        )}
      </div>
    </button>
  );
});

function UserList({ 
  users,
  loading,
  error,
  selectedUser, 
  onSelectUser,
}) {
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
            <UserListItem
              key={u.id}
              user={u}
              isSelected={selectedUser?.id === u.id}
              onSelectUser={onSelectUser}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(UserList);
