import axios from "axios";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import uniqBy from "lodash/uniqBy";

axios.defaults.baseURL = "https://gossip-backend-wv5l.onrender.com";
axios.defaults.withCredentials = true;

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    connectToWebSocket();
  }, []);

  function connectToWebSocket() {
    
    const websocket = new WebSocket("wss://gossip-backend-wv5l.onrender.com");


    websocket.addEventListener("open", () => {
      console.log("Connected to WebSocket Server");
      setWs(websocket);
    });

    websocket.addEventListener("message", handleMessage);

    websocket.addEventListener("close", () => {
      console.log("WebSocket Disconnected. Reconnecting...");
      setTimeout(connectToWebSocket, 1000);
    });
  }

  function handleMessage(event) {
    try {
      const messageData = JSON.parse(event.data);
      console.log("Received Message:", messageData);
      if (messageData.online) {
        showOnlinePeople(messageData.online, messageData.userId);
      } else if ('text' in messageData) {
        setMessages(prev => [...prev, {
          id: messageData.id,
          text: messageData.text,
          sender: messageData.sender
        }]);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  function showOnlinePeople(peopleArray, currentUserId) {
    setUserId(currentUserId);
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      if (userId !== currentUserId) {
        people[userId] = username;
      }
    });
    setOnlinePeople(people);
  }

  function sendMessage(ev) {
    ev.preventDefault();
    if (!ws || !selectedUserId || !newMessageText) return;

    const messageData = {
      recipient: selectedUserId,
      text: newMessageText,
    };

    ws.send(JSON.stringify(messageData));
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: newMessageText,
      sender: userId
    }]);
    setNewMessageText('');
  }

  useEffect(() => {
    if (selectedUserId && userId) {
      axios.get(`/messages/${userId}/${selectedUserId}`)
        .then(res => {
          setMessages(res.data);
        })
        .catch(err => {
          console.error("Failed to fetch messages:", err);
        });
    }
  }, [selectedUserId, userId]);

  const messagesWithOutDupes = uniqBy(messages, 'id');

  return (
    <div className="flex h-screen">
      <div className="bg-purple-100 w-1/5 p-4">
        <div className="text-purple-600 font-bold flex gap-2 mb-4">💬 GOSSIP</div>
        <h2 className="font-bold">Online Friends</h2>
        {Object.keys(onlinePeople).map((id) => (
          <div
            key={id}
            onClick={() => setSelectedUserId(id)}
            className={`border-b border-gray-100 py-2 pl-4 flex items-center gap-2 cursor-pointer ${id === selectedUserId ? "bg-purple-200" : ""}`}
          >
            <Avatar username={onlinePeople[id]} userId={id} />
            {onlinePeople[id]}
          </div>
        ))}
      </div>

      <div className="flex flex-col bg-purple-300 w-4/5 p-4">
        <div className="flex-grow flex flex-col overflow-auto p-4">
          {!selectedUserId && <p className="text-lg text-purple-100">&larr; Select a friend to start Gossiping!!</p>}
          {!!selectedUserId && (
            <div className="flex flex-col space-y-2">
              {messagesWithOutDupes.map((message) => (
                <div key={message.id} className={`flex ${message.sender === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 m-2 rounded-md text-sm max-w-xs ${message.sender === userId ? 'bg-purple-500 text-white' : 'bg-white text-gray-700'}`}>
                    {message.text}
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
              onChange={ev => setNewMessageText(ev.target.value)}
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
