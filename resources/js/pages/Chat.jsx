import { useEffect, useRef, useState } from "react";
import api from "../api";

import { useDispatch, useSelector } from "react-redux";
import { makeEcho } from "../echo";
import { logout } from "../store/authSlice";

export default function Chat() {
  const bottomRef = useRef(null);
  const { user, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");


  useEffect(() => {
    if (!token || !user?.id) return;

    const echo = makeEcho(token);

    echo.private(`chat.${user.id}`).listen("MessageSent", (e) => {
      const m = e.message;
      if (!selectedUser) return;

      const isThisChat =
        (m.sender_id === selectedUser.id && m.receiver_id === user.id) ||
        (m.sender_id === user.id && m.receiver_id === selectedUser.id);

      if (isThisChat) {
        setMessages((prev) => [...prev, m]);
      }
    });

    return () => {
      echo.leave(`chat.${user.id}`);
      echo.disconnect();
    };
  }, [token, user?.id, selectedUser?.id]);


  async function loadUsers() {
    const res = await api.get("/users");
    setUsers(res.data);
  }

  async function loadMessages(uid) {
    const res = await api.get(`/messages/${uid}`);
    setMessages(res.data);
  }

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;

    const temp = {
        id: "temp-" + Date.now(),
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message: text,
    };

    setMessages((prev) => [...prev, temp]);
    setText("");

    try {
        const res = await api.post("/messages/send", {
        receiver_id: selectedUser.id,
        message: temp.message,
        });

        setMessages((prev) =>
        prev.map((m) => (m.id === temp.id ? res.data : m))
        );
    } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== temp.id));
        alert("Message send failed");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen flex bg-gray-100">
      <div className="w-72 bg-white border-r p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Logged in</p>
            <p className="font-bold">{user?.name}</p>
          </div>
          <button className="text-red-600 text-sm" onClick={async () => {
              try {
                await api.post("/logout"); // ✅ backend token delete
              } catch (e) {
                // ignore (token already invalid or server error)
              }
              dispatch(logout()); // ✅ frontend clear
            }}>
            Logout
          </button>
        </div>

        <h4 className="mt-6 font-semibold">Users</h4>
        <div className="mt-3 space-y-2">
          {users.filter((u) => u.id !== user?.id).map((u) => (
            <button
              key={u.id}
              onClick={() => {
                setMessages([]);
                setSelectedUser(u);
                loadMessages(u.id);
              }}
              className={`w-full text-left p-3 rounded-xl border ${
                selectedUser?.id === u.id ? "bg-gray-100" : ""
              }`}
            >
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-gray-500">{u.email}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        {!selectedUser ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a user to chat
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4">Chat with {selectedUser.name}</h2>

            <div className="flex-1 bg-white border rounded-2xl p-4 overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-2 flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[70%] ${
                      m.sender_id === user.id ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="mt-4 flex gap-2">
              <input
                className="flex-1 border p-3 rounded-xl"
                placeholder="Type message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button className="bg-black text-white px-6 rounded-xl">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
