import axios from "axios";
import { useEffect, useState, useRef } from "react";
import Avatar from "./Avatar";
import uniqBy from "lodash/uniqBy";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [allUsers, setAllUsers] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);

  function connectToWebSocket() {
    const websocket = new WebSocket("wss://gossip-backend-wv5l.onrender.com");

    websocket.addEventListener("open", () => {
      console.log("🌐 WebSocket connected");
      setWs(websocket);
    });

    websocket.addEventListener("message", handleMessage);

    websocket.addEventListener("close", () => {
      console.log("⚠️ WebSocket disconnected, retrying...");
      setTimeout(() => connectToWebSocket(), 1000);
    });
  }

  useEffect(() => {
    axios.get('/profile', { withCredentials: true })
      .then(res => {
        setUserId(res.data.userId);

        const savedSelectedId = localStorage.getItem("selectedUserId");
        if (savedSelectedId) {
          setSelectedUserId(savedSelectedId);
        }
        connectToWebSocket();
      })
      .catch(err => console.error("❌ Error loading profile:", err));
  }, []);

  useEffect(() => {
    axios.get('/users', { withCredentials: true }).then(res => {
      const usersMap = {};
      res.data.forEach(user => {
        usersMap[user._id] = user.username;
      });
      setAllUsers(usersMap);
    });
  }, []);

  useEffect(() => {
    if (userId && selectedUserId) {
      axios.get(`/messages/${userId}/${selectedUserId}`, { withCredentials: true })
        .then(res => {
          setMessages(res.data.map(msg => ({
            id: msg._id,
            text: msg.text,
            sender: msg.sender
          })));
        })
        .catch(err => console.error("❌ Message fetch failed:", err));
    }
  }, [userId, selectedUserId]);

  function handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      if (data.online) {
        const people = {};
        data.online.forEach(({ userId, username }) => {
          people[userId] = username;
        });
        setOnlinePeople(people);
      } else if ('text' in data) {
        setMessages(prev => uniqBy([...prev, {
          id: data.id || data._id || Date.now(),
          text: data.text,
          sender: data.sender
        }], 'id'));
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
    }
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!ws || !selectedUserId || !newMessageText) return;

    const messageData = {
      recipient: selectedUserId,
      text: newMessageText
    };

    ws.send(JSON.stringify(messageData));

    const tempMessage = {
      id: Date.now(),
      text: newMessageText,
      sender: userId
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessageText('');
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen">
      <div className="bg-purple-100 w-1/5 p-4">
        <div className="text-purple-600 font-bold text-3xl mb-4"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
</svg>
 GOSSIP</div>
        <h2 className="font-bold">Friends</h2>
        {Object.entries(allUsers).map(([id, username]) => {
          if (id === userId) return null;
          const isOnline = onlinePeople[id];
          return (
            <div
              key={id}
              onClick={() => {
                setSelectedUserId(id);
                localStorage.setItem("selectedUserId", id);
              }}
              className={`border-b border-gray-100 py-2 pl-4 flex items-center gap-2 cursor-pointer ${id === selectedUserId ? "bg-purple-200" : ""}`}
            >
              <Avatar username={username} userId={id} />
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`}></div>
                <span>{username}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col bg-purple-300 w-4/5 p-4">
        <div className="flex-grow flex flex-col overflow-auto p-4">
          {!selectedUserId && <p className="text-lg text-purple-100">← Select a friend to start Gossiping!!</p>}
          {!!selectedUserId && (
            <div className="flex flex-col space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 m-2 rounded-md text-sm max-w-xs ${msg.sender === userId ? 'bg-purple-500 text-white' : 'bg-white text-gray-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2 mt-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              placeholder="Gossip here..."
              className="bg-white border flex-grow p-2 rounded-sm"
            />
            <button type="submit" className="bg-purple-700 p-2 text-white rounded-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
</svg>

            </button>
          </form>
        )}
      </div>
    </div>
  );
}


