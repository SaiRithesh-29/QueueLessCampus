const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const serviceRoutes = require('./routes/serviceRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const errorHandler = require('./middleware/errorHandler');
const seed = require('./seed');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/services', serviceRoutes);
app.use('/api/tokens', tokenRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join:service', (serviceId) => {
    socket.join(`service:${serviceId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seed();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
