import { memo, useState } from "react";

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
  groups,
  loading,
  error,
  loadingGroups,
  groupsError,
  selectedUser, 
  selectedGroup,
  onSelectUser,
  onSelectGroup,
  onCreateGroup,
}) {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  function toggleMember(userId) {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleSubmitGroup(event) {
    event.preventDefault();

    if (!groupName.trim() || selectedMemberIds.length === 0) {
      return;
    }

    await onCreateGroup({
      name: groupName.trim(),
      member_ids: selectedMemberIds,
    });

    setGroupName("");
    setSelectedMemberIds([]);
    setShowGroupForm(false);
  }

  return (
    <div className="w-72 bg-white border-r p-4 h-full overflow-y-auto">
      <div className="mt-6 flex items-center justify-between">
        <h4 className="font-semibold text-gray-700">Chats</h4>
        <button
          type="button"
          onClick={() => setShowGroupForm((prev) => !prev)}
          className="rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          {showGroupForm ? "Close" : "New Group"}
        </button>
      </div>

      {showGroupForm && (
        <form onSubmit={handleSubmitGroup} className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Group Name
          </label>
          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
            placeholder="Team Chat"
          />

          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Members
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedMemberIds.length === 0 ? (
              <p className="text-xs text-gray-500">Select members for the group.</p>
            ) : (
              selectedMemberIds.map((memberId) => {
                const member = users.find((user) => user.id === memberId);

                if (!member) {
                  return null;
                }

                return (
                  <button
                    key={`chip-${member.id}`}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white"
                  >
                    {member.name} x
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2">
            {users.map((user) => {
              const isSelected = selectedMemberIds.includes(user.id);

              return (
                <button
                  key={`member-${user.id}`}
                  type="button"
                  onClick={() => toggleMember(user.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                    isSelected
                      ? "bg-black text-white"
                      : "bg-gray-50 text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className={`truncate text-xs ${isSelected ? "text-gray-200" : "text-gray-500"}`}>
                      {user.email}
                    </p>
                  </div>
                  <div
                    className={`ml-3 flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                      isSelected
                        ? "border-white bg-white text-black"
                        : "border-gray-300 text-transparent"
                    }`}
                  >
                    ✓
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={!groupName.trim() || selectedMemberIds.length === 0}
            className="mt-3 w-full rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Create Group
          </button>
        </form>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Groups</p>
        <div className="mt-2 space-y-2">
          {loadingGroups ? (
            <div className="text-center py-3 text-gray-500">Loading groups...</div>
          ) : groupsError ? (
            <div className="text-center py-3 text-red-500">{groupsError}</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-3 text-gray-500">No groups yet</div>
          ) : (
            groups.map((group) => (
              <button
                key={`group-${group.id}`}
                onClick={() => onSelectGroup(group)}
                className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                  selectedGroup?.id === group.id
                    ? "bg-green-50 border-green-200"
                    : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                    #
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.members_count} members</p>
                  </div>
                  {group.unread_count > 0 && (
                    <div className="min-w-6 rounded-full bg-red-500 px-2 py-0.5 text-center text-xs font-semibold text-white">
                      {group.unread_count}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Direct Messages</p>
        <div className="mt-2 space-y-2">
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
              isSelected={selectedUser?.id === u.id && !selectedGroup}
              onSelectUser={onSelectUser}
            />
          ))
        )}
        </div>
      </div>
    </div>
  );
}

export default memo(UserList);
