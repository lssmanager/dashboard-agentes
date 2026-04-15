/**
 * OpenClaw Dashboard - Express Server
 * Main entry point for the dashboard backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const DEFAULT_PORT = 3000;
const envPort = parseInt(process.env.PORT || '', 10);
const gatewayPort = (() => {
  try {
    const gatewayUrl = process.env.GATEWAY_URL || 'ws://openclaw:18789';
    return new URL(gatewayUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')).port || '80';
  } catch {
    return '18789';
  }
})();

const PORT = Number.isInteger(envPort) && envPort > 0 && String(envPort) !== String(gatewayPort)
  ? envPort
  : DEFAULT_PORT;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));

// Trust proxy for X-Forwarded headers (for Coolify/Railway)
app.set('trust proxy', 1);

// Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API routes
app.use('/api', apiRoutes);

// Serve index.html for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[SERVER] Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    code: 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║  OpenClaw Dashboard Server             ║
║  Running on http://0.0.0.0:${PORT}       ║
║  Environment: ${NODE_ENV.toUpperCase().padEnd(24)}║
╚════════════════════════════════════════╝
  `);
  console.log(`Gateway: ${process.env.GATEWAY_URL || 'ws://openclaw:18789'}`);
  console.log(`Data Directory: ${process.env.DATA_FILE || '/app/data/workspaces-topology.json'}`);
  if (process.env.PORT && String(process.env.PORT) === String(gatewayPort)) {
    console.warn(`[SERVER] Ignoring PORT=${process.env.PORT} because it conflicts with the Gateway port. Using ${PORT} instead.`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down gracefully');
  process.exit(0);
});
