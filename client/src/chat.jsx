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
        <div className="text-purple-600 font-bold mb-4">💬 GOSSIP</div>
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
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


