require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const statsRoutes = require('./routes/stats');
const dashboardRoutes = require('./routes/dashboard');
const violationsRoutes = require('./routes/violations');
const alertsRoutes = require('./routes/alerts');
const vehicleRoutes = require('./routes/vehicleRoutes');


const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/health', healthRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/violations', violationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use("/api/vehicles", vehicleRoutes);


const PORT = process.env.APP_PORT || process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API 서버 시작: http://localhost:${PORT}`));

module.exports = app;

