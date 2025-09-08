require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const statsRoutes = require('./routes/stats');
const dashboardRoutes = require('./routes/dashboard');
const violationsRoutes = require('./routes/violations');
const alertsRoutes = require('./routes/alerts');
const vehicleRoutes = require('./routes/vehicleRoutes');
const parkingRoutes = require('./routes/parking');
const exportRoutes = require('./routes/export');
const parkingLogsRoutes = require('./routes/parkingLogs');

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Routes
app.use('/api/auth', authRoutes);
app.use('/health', healthRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/violations', violationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/parking-logs', parkingLogsRoutes);

const PORT = process.env.APP_PORT || process.env.PORT || 3000;

// Create HTTP server and attach Express app
const server = http.createServer(app);

// Create WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.on('message', (message) => {
    try {
      // Buffer → 문자열 변환
      const text = message.toString();

      // 문자열을 JSON으로 파싱
      const data = JSON.parse(text);

      // 다시 문자열로 만들어서 클라이언트에 전달
      const jsonString = JSON.stringify(data);

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(jsonString); // ✅ 항상 JSON 문자열로 보냄
        }
      });
    } catch (err) {
      console.error("메시지 처리 오류:", err);
    }
  });


  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`API and WebSocket server started at http://localhost:${PORT}`);
});

module.exports = app;

