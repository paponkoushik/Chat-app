import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/authSlice";
import ChatBox from "./ChatBox";
import ProfileBar from "./ProfileBar";
import UserList from "./UserList";
import useChatConversation from "./hooks/useChatConversation";
import useChatGroups from "./hooks/useChatGroups";
import useGroupConversation from "./hooks/useGroupConversation";
import useChatUsers from "./hooks/useChatUsers";

export default function Chat() {
  const { user, token, loading } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const {
    users,
    loadingUsers,
    usersError,
    incrementUnreadCount,
    clearUnreadCount,
  } = useChatUsers();
  const {
    groups,
    loadingGroups,
    groupsError,
    createGroup,
    incrementGroupUnreadCount,
    clearGroupUnreadCount,
  } = useChatGroups({
    token,
    userId: user?.id,
  });
  const {
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
  } = useChatConversation({
    user,
    token,
    incrementUnreadCount,
    clearUnreadCount,
  });
  const groupConversation = useGroupConversation({
    token,
    currentUserId: user?.id,
    groups,
    selectedGroup,
    incrementGroupUnreadCount,
    clearGroupUnreadCount,
  });

  async function handleLogout() {
    await dispatch(logoutUser());
  }

  async function handleSelectUser(nextUser) {
    setSelectedGroup(null);
    await selectUser(nextUser);
  }

  function handleSelectGroup(group) {
    setSelectedGroup(group);
  }

  async function handleCreateGroup(payload) {
    try {
      const group = await createGroup(payload);

      setSelectedGroup(group);
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Group create failed");
    }
  }

  const isGroupChat = Boolean(selectedGroup);
  const activeChat = selectedGroup ?? selectedUser;
  const activeMessages = isGroupChat ? groupConversation.messages : messages;
  const activeText = isGroupChat ? groupConversation.text : text;
  const activeSetText = isGroupChat ? groupConversation.setText : setText;
  const activeLoadingMessages = isGroupChat ? groupConversation.loadingMessages : loadingMessages;
  const activeLoadingOlderMessages = isGroupChat
    ? groupConversation.loadingOlderMessages
    : loadingOlderMessages;
  const activeHasMoreMessages = isGroupChat ? groupConversation.hasMoreMessages : hasMoreMessages;
  const activeSendMessage = isGroupChat ? groupConversation.sendMessage : sendMessage;
  const activeBottomRef = isGroupChat ? groupConversation.bottomRef : bottomRef;
  const activeLoadOlderMessages = isGroupChat
    ? groupConversation.loadOlderMessages
    : loadOlderMessages;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <ProfileBar onLogout={handleLogout} loggingOut={loading} /> 

      <div className="flex flex-1 overflow-hidden">
        <UserList
          users={users}
          groups={groups}
          loading={loadingUsers}
          error={usersError}
          loadingGroups={loadingGroups}
          groupsError={groupsError}
          selectedUser={selectedUser}
          selectedGroup={selectedGroup}
          onSelectUser={handleSelectUser}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={handleCreateGroup}
        />

        <ChatBox
          activeChat={activeChat}
          chatType={isGroupChat ? "group" : "direct"}
          messages={activeMessages}
          currentUserId={user?.id} // ChatBox-এ দরকার message alignment-এর জন্য
          text={activeText}
          setText={activeSetText}
          onSendMessage={activeSendMessage}
          bottomRef={activeBottomRef}
          loading={activeLoadingMessages}
          hasMoreMessages={activeHasMoreMessages}
          loadingOlderMessages={activeLoadingOlderMessages}
          onLoadOlderMessages={activeLoadOlderMessages}
        />
      </div>
    </div>
  );
}
