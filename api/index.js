const { OAuth2Client } = require('google-auth-library');
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

/* ================= CORS ================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://gossip-chat-app-five.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true
}));

/* ================= CONFIG ================= */

const jwtSecret = process.env.JWT_SECRET;

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const bcryptSalt = bcrypt.genSaltSync(10);

/* ================= MONGODB ================= */

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* ================= HELPERS ================= */

function getUserDataFromToken(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;

    if (!token) return reject("No token");

    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) return reject("Invalid token");
      resolve(userData);
    });
  });
}

/* ================= ROUTES ================= */

app.get('/test', (req, res) => {
  res.json("Test OK");
});

/* ================= GOOGLE LOGIN ================= */

app.post('/google-login', async (req, res) => {
  try {

    const { token } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const email = payload.email;

    let userDoc = await User.findOne({ username: email });

    if (!userDoc) {
      userDoc = await User.create({
        username: email,
        password: bcrypt.hashSync(
          Math.random().toString(),
          bcryptSalt
        ),
      });
    }

    jwt.sign(
      {
        userId: userDoc._id,
        username: userDoc.username
      },
      jwtSecret,
      {},
      (err, token) => {

        res.cookie("token", token, {
          httpOnly: true,
          sameSite: "None",
          secure: true
        }).json({
          id: userDoc._id,
          username: userDoc.username
        });

      });

  } catch (error) {
    console.error("Google login error", error);
    res.status(400).json("Google login failed");
  }
});

/* ================= PROFILE ================= */

app.get('/profile', async (req, res) => {

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json("No token");
  }

  jwt.verify(token, jwtSecret, {}, (err, userData) => {

    if (err) {
      return res.status(403).json("Invalid token");
    }

    res.json(userData);

  });

});

/* ================= USERS ================= */

app.get('/users', async (req, res) => {

  try {

    const users = await User.find({}, '_id username');

    res.json(users);

  } catch (error) {

    res.status(500).json("Failed to fetch users");

  }

});

/* ================= REGISTER ================= */

app.post('/register', async (req, res) => {

  try {

    const { username, password } = req.body;

    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json("Username exists");
    }

    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);

    const userDoc = await User.create({
      username,
      password: hashedPassword
    });

    jwt.sign(
      {
        userId: userDoc._id,
        username
      },
      jwtSecret,
      {},
      (err, token) => {

        res.cookie("token", token, {
          httpOnly: true,
          sameSite: "None",
          secure: true
        }).json({
          id: userDoc._id
        });

      }
    );

  } catch (error) {

    console.error(error);
    res.status(500).json("Registration failed");

  }

});

/* ================= LOGIN ================= */

app.post('/login', async (req, res) => {

  try {

    const { username, password } = req.body;

    const userDoc = await User.findOne({ username });

    if (!userDoc) {
      return res.status(401).json("User not found");
    }

    const passOk = bcrypt.compareSync(
      password,
      userDoc.password
    );

    if (!passOk) {
      return res.status(401).json("Wrong password");
    }

    jwt.sign(
      {
        userId: userDoc._id,
        username
      },
      jwtSecret,
      {},
      (err, token) => {

        res.cookie("token", token, {
          httpOnly: true,
          sameSite: "None",
          secure: true
        }).json({
          id: userDoc._id
        });

      }
    );

  } catch (error) {

    console.error(error);
    res.status(500).json("Login failed");

  }

});

/* ================= LOGOUT ================= */

app.post('/logout', (req, res) => {

  res.cookie('token', '', {
    httpOnly: true,
    sameSite: 'None',
    secure: true
  }).json("Logged out");

});

/* ================= MESSAGES ================= */

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

/* ================= WEBSOCKET ================= */

const server = app.listen(4040, () => {
  console.log("🚀 Server running on 4040");
});

const wss = new ws.WebSocketServer({ server });

const clients = new Map();

wss.on("connection", (connection, req) => {

  const cookie = req.headers.cookie;

  if (!cookie) return connection.close();

  const token = cookie
    .split(";")
    .find(c => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) return connection.close();

  jwt.verify(token, jwtSecret, {}, (err, userData) => {

    if (err) return connection.close();

    connection.userId = userData.userId;
    connection.username = userData.username;

    clients.set(connection, userData);

    sendOnlineUsers();

  });

  connection.on("message", async (message) => {

    try {

      const { recipient, text } = JSON.parse(message);

      if (recipient && text) {

        const messageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text
        });

        [...wss.clients].forEach(client => {

          if (
            client.readyState === ws.OPEN &&
            client.userId === recipient
          ) {

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

    } catch (error) {

      console.error("Message error", error);

    }

  });

  connection.on("close", () => {

    clients.delete(connection);

    sendOnlineUsers();

  });

  function sendOnlineUsers() {

    const online = [...clients.values()].map(user => ({
      userId: user.userId,
      username: user.username
    }));

    [...wss.clients].forEach(client => {

      if (client.readyState === ws.OPEN) {

        client.send(JSON.stringify({
          type: "online-users",
          online,
          currentUserId: client.userId
        }));

      }

    });

  }

});