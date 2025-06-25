export const ServerConfig = {
  port: process.env.PORT || 9090,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  },
  socket: {
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  },
};
