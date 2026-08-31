const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./config/config');
const captionRoutes = require('./routes/captionRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'VisionCaption',
    provider: config.ai.provider,
    timestamp: new Date().toISOString()
  });
});

app.use('/api', captionRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found.'
  });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

const PORT = process.env.PORT || config.port || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✨ VisionCaption Server Running on port ${PORT}`);
  console.log(`🤖 AI Provider: ${config.ai.provider.toUpperCase()}`);
  console.log(`📁 Serving frontend from: ../frontend`);
});