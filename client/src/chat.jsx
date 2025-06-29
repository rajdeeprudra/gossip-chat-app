import axios from "axios";
import { useEffect, useState } from "react";
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

  // ✅ Fetch userId and selectedUserId on load
  useEffect(() => {
    axios.get('/profile', { withCredentials: true })
      .then(res => {
        console.log("🟢 Loaded userId:", res.data.userId);
        setUserId(res.data.userId);

        const savedSelectedId = localStorage.getItem("selectedUserId");
        if (savedSelectedId) {
          console.log("🟢 Loaded selectedUserId from localStorage:", savedSelectedId);
          setSelectedUserId(savedSelectedId);
        }
      })
      .catch(err => console.error("❌ Error loading profile:", err));
  }, []);

  // ✅ Load all registered users
  useEffect(() => {
    axios.get('/users', { withCredentials: true }).then(res => {
      const usersMap = {};
      res.data.forEach(user => {
        usersMap[user._id] = user.username;
      });
      setAllUsers(usersMap);
    });
  }, []);

  // ✅ Fetch messages only when both userId and selectedUserId are available
  useEffect(() => {
    console.log("🟡 userId:", userId);
    console.log("🟡 selectedUserId:", selectedUserId);

    if (userId && selectedUserId) {
      console.log("📥 Fetching messages for:", userId, selectedUserId);
      axios.get(`/messages/${userId}/${selectedUserId}`, { withCredentials: true })
        .then(res => {
          console.log("✅ Got messages:", res.data);
          setMessages(res.data);
        })
        .catch(err => console.error("❌ Message fetch failed:", err));
    }
  }, [userId, selectedUserId]);

  // ✅ WebSocket connection
  useEffect(() => {
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
          if (data.sender === selectedUserId || data.recipient === selectedUserId) {
            setMessages(prev => [...prev, {
              id: data._id || Date.now(),
              text: data.text,
              sender: data.sender
            }]);
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    }

    return () => websocket.close();
  }, [selectedUserId]);

  function sendMessage(e) {
    e.preventDefault();
    if (!ws || !selectedUserId || !newMessageText) return;

    const messageData = {
      recipient: selectedUserId,
      text: newMessageText
    };

    ws.send(JSON.stringify(messageData));
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: newMessageText,
      sender: userId
    }]);
    setNewMessageText('');
  }

  const messagesWithoutDupes = uniqBy(messages, 'id');

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
              {messagesWithoutDupes.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 m-2 rounded-md text-sm max-w-xs ${msg.sender === userId ? 'bg-purple-500 text-white' : 'bg-white text-gray-700'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
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


