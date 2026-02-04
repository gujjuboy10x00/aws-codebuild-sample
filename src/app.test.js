const request = require('supertest');
const app = require('./app');

describe('Sample Application Tests', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/hello', () => {
    it('should return hello message', async () => {
      const response = await request(app).get('/api/hello');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('CodeBuild');
    });
  });

  describe('POST /api/echo', () => {
    it('should echo back the request body', async () => {
      const testData = { test: 'data', value: 123 };
      const response = await request(app)
        .post('/api/echo')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.echoed).toEqual(testData);
      expect(response.body).toHaveProperty('receivedAt');
    });
  });

  describe('GET /', () => {
    it('should return application info', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
    });
  });
});
