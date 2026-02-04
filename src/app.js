const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Sample API endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from AWS CodeBuild!',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Sample POST endpoint
app.post('/api/echo', (req, res) => {
  res.json({
    echoed: req.body,
    receivedAt: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AWS CodeBuild Sample Application',
    endpoints: [
      'GET /health',
      'GET /api/hello',
      'POST /api/echo'
    ]
  });
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
