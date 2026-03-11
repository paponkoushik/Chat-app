import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../store/authSlice";
import ChatBox from "./ChatBox";
import ProfileBar from "./ProfileBar";
import UserList from "./UserList";
import useChatConversation from "./hooks/useChatConversation";
import useChatUsers from "./hooks/useChatUsers";

export default function Chat() {
  const { user, token, loading } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const {
    users,
    loadingUsers,
    usersError,
    incrementUnreadCount,
    clearUnreadCount,
  } = useChatUsers();
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

  async function handleLogout() {
    await dispatch(logoutUser());
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <ProfileBar onLogout={handleLogout} loggingOut={loading} /> 

      <div className="flex flex-1 overflow-hidden">
        <UserList
          users={users}
          loading={loadingUsers}
          error={usersError}
          selectedUser={selectedUser}
          onSelectUser={selectUser}
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
          onLoadOlderMessages={loadOlderMessages}
        />
      </div>
    </div>
  );
}
