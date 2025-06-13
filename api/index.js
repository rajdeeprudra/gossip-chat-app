const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Message = require('./models/message');
const ws = require('ws');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: "http://localhost:5173",
}));

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// JWT token auth helper
function getUserDataFromToken(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (!token) return reject('No token');

    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) return reject('Invalid token');
      resolve(userData);
    });
  });
}

// ROUTES

app.get('/test', (req, res) => {
  res.json('Test ok');
});

app.get('/profile', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No token' });

  jwt.verify(token, jwtSecret, {}, (err, userData) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    res.json(userData);
  });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const userExists = await User.findOne({ username });
  if (userExists) return res.status(400).json({ error: 'Username already exists' });

  const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
  const userDoc = await User.create({ username, password: hashedPassword });

  jwt.sign({ userId: userDoc._id, username }, jwtSecret, {}, (err, token) => {
    if (err) throw err;
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' }).status(201).json({ id: userDoc._id });
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const userDoc = await User.findOne({ username });
  if (!userDoc) return res.status(401).json({ error: 'User not found' });

  const isPassValid = bcrypt.compareSync(password, userDoc.password);
  if (!isPassValid) return res.status(401).json({ error: 'Invalid password' });

  jwt.sign({ userId: userDoc._id, username }, jwtSecret, {}, (err, token) => {
    if (err) throw err;
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' }).json({ id: userDoc._id });
  });
});

// FIXED: Load all messages between two users
app.get('/messages/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
});

// SERVER + WS
const server = app.listen(4040, () => console.log('🚀 Server running on 4040'));

const wss = new ws.WebSocketServer({ server });

const clients = new Map(); // Store socket -> user info

wss.on('connection', (connection, req) => {
  const token = req.headers.cookie?.split('; ').find(str => str.startsWith('token='))?.split('=')[1];

  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) return connection.close();

      connection.userId = userData.userId;
      connection.username = userData.username;
      clients.set(connection, userData);

      sendOnlineUsers();
    });
  }

  connection.on('message', async (msg) => {
    try {
      const messageData = JSON.parse(msg);
      const { recipient, text } = messageData;

      if (recipient && text) {
        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
        });

        [...wss.clients].forEach(client => {
          if (client.readyState === ws.OPEN && client.userId === recipient) {
            client.send(JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              id: messageDoc._id,
              createdAt: messageDoc.createdAt
            }));
          }
        });
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  connection.on('close', () => {
    clients.delete(connection);
    sendOnlineUsers();
  });

  function sendOnlineUsers() {
    const online = [...clients.values()]
      .filter(user => user.userId !== connection.userId) // ✅ Exclude self
      .map(user => ({ userId: user.userId, username: user.username }));

    [...wss.clients].forEach(client => {
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify({ online }));
      }
    });
  }
});
