// components/Chat/ChatBox.jsx
import { useEffect, useRef } from 'react';

export default function ChatBox({
  activeChat,
  chatType,
  messages,
  currentUserId,
  text,
  setText,
  onSendMessage,
  bottomRef,
  loading,
  hasMoreMessages,
  loadingOlderMessages,
  onLoadOlderMessages,
}) {
  const localBottomRef = useRef(null);
  const normalizedCurrentUserId = Number(currentUserId);

  useEffect(() => {
    (bottomRef || localBottomRef).current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, bottomRef]);

  if (!activeChat) {
    return (
      <div className="flex-1 h-full flex items-center justify-center text-gray-500 bg-white p-6 text-5xl">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-bold mb-4">
          {chatType === "group" ? `Group: ${activeChat.name}` : `Chat with ${activeChat.name}`}
        </h2>

        <div className="flex-1 bg-white border rounded-2xl p-4 overflow-y-auto">
          {hasMoreMessages && !loading && (
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={onLoadOlderMessages}
                disabled={loadingOlderMessages}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingOlderMessages ? "Loading..." : "Load older messages"}
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((m) => {
              const isOwnMessage = Number(m.sender_id) === normalizedCurrentUserId;

              return (
              <div
                key={m.id}
                className={`mb-2 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] ${
                    isOwnMessage ? "bg-blue-500 text-white rounded-br-none" 
                    : "bg-gray-100 rounded-bl-none"
                  }`}
                >
                  {chatType === "group" && !isOwnMessage && (
                    <p className="mb-1 text-xs font-semibold text-gray-600">
                      {m.sender?.name ?? "Unknown"}
                    </p>
                  )}
                  <p>{m.message}</p>
                  <div className={`mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
                    <p className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(m.created_at || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {chatType !== "group" && isOwnMessage && (
                      <p className="text-xs text-blue-200">
                        {m.seen_at ? 'Seen' : 'Sent'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )})
          )}
          <div ref={bottomRef || localBottomRef} />
        </div>

        <form onSubmit={onSendMessage} className="mt-4 flex gap-2">
          <input
            className="flex-1 border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-black text-white px-6 rounded-xl hover:bg-gray-800 disabled:bg-gray-400"
            disabled={!text.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
