const express = require('express');
const http = require('http');
const path = require('path');
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
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/services', serviceRoutes);
app.use('/api/tokens', tokenRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static dist build if available
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));

app.use(errorHandler);

// SPA fallback for client-side routing
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send('Frontend build not found. Please run npm run dev or npm run build.');
      }
    });
  } else {
    res.status(404).json({ message: 'API Route Not Found' });
  }
});

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
  try {
    await connectDB();
    await seed();
  } catch (err) {
    console.warn('DB connection or seed warning:', err.message);
  }

  server.listen(PORT, () => {
    console.log(`QueueLess Campus Server running on port ${PORT}`);
  });
};

start();
