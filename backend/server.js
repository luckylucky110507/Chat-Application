require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URL || "";
const DB_NAME = process.env.DB_NAME || "chatapp";

let db = null;


if (MONGO_URI) {
  const client = new MongoClient(MONGO_URI);
  client.connect()
    .then(() => {
      db = client.db(DB_NAME);
      console.log('✅ Connected to MongoDB');
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
    });
} else {
  console.warn('⚠️ MONGO_URI is empty. No database connection established.');
}

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const users = new Map();         
const roomUsers = new Map();    


function formatMsg(sender, text) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    sender,
    text,
    ts: new Date().toISOString()
  };
}


async function saveMessageToDB(message) {
  if (!db) return;
  try {
    await db.collection('messages').insertOne(message);
  } catch (e) {
    console.error('❌ Failed to save message', e);
  }
}

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  
  socket.on('join', async ({ name, room }, cb) => {
    if (!name || !room) {
      if (cb) cb({ error: 'Name and room are required' });
      return;
    }

    users.set(socket.id, { name, room });

    if (!roomUsers.has(room)) roomUsers.set(room, new Set());
    roomUsers.get(room).add(name);

    socket.join(room);

    socket.to(room).emit('message', formatMsg('System', `${name} joined the room`));
    io.to(room).emit('user-list', Array.from(roomUsers.get(room)));

    
    if (db) {
      try {
        const rows = await db.collection('messages')
          .find({ room })
          .sort({ ts: -1 })
          .limit(50)
          .toArray();

        const history = rows.reverse().map(r => ({
          id: r.id,
          sender: r.sender,
          text: r.text,
          ts: (r.ts instanceof Date) ? r.ts.toISOString() : r.ts
        }));
        socket.emit('history', history);
      } catch (e) {
        console.error('❌ Failed to load history', e);
        socket.emit('history', []);
      }
    } else {
      socket.emit('history', []);
    }

    if (cb) cb({ ok: true });
  });

  
  socket.on('message', async (text) => {
    const u = users.get(socket.id);
    if (!u) return;

    const msg = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      room: u.room,
      sender: u.name,
      text: String(text || ''),
      ts: new Date().toISOString()
    };

    io.to(u.room).emit('message', {
      id: msg.id,
      sender: msg.sender,
      text: msg.text,
      ts: msg.ts
    });

    await saveMessageToDB(msg);
  });

  
  socket.on('typing', () => {
    const u = users.get(socket.id);
    if (u) {
      socket.to(u.room).emit('typing', { sender: u.name });
    }
  });


  socket.on('disconnect', () => {
    const u = users.get(socket.id);
    if (u) {
      users.delete(socket.id);
      const roomSet = roomUsers.get(u.room);
      if (roomSet) {
        roomSet.delete(u.name);
        if (roomSet.size === 0) {
          roomUsers.delete(u.room);
        }
      }
      io.to(u.room).emit('user-list', Array.from(roomSet || []));
      socket.to(u.room).emit('message', formatMsg('System', `${u.name} left the room`));
    }
    console.log('❌ Socket disconnected:', socket.id);
  });
});


httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
