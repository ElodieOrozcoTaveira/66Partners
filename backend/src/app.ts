import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
//Socket
import { createServer } from 'http';
import { initSocket } from './socket/index.ts';

//Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import activityRoutes from './routes/activity.routes.js';
import sportRoutes from './routes/sport.routes.js';
import participationRoutes from './routes/participation.routes.js';
import { activityConversationRouter, conversationRouter } from './routes/conversation.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { helmetOptions, verifyOrigin } from './middlewares/security.middleware.js';

//Docs Swagger
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../docs/openApi.ts';


dotenv.config();

const app = express();
export const httpServer = createServer(app); // socket se met sur le serveur http pas sur app

// Middleware de sécurité
app.use(helmet(helmetOptions));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(verifyOrigin);

//Initalisier socket.io
const io = initSocket(httpServer);
//rendre accessible dans les controllers
app.set('io', io);

// Parser JSON et URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send('Hello 66Partners!'));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/activities', activityConversationRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Routes non trouvées + gestion d'erreurs globale (doivent rester en dernier)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;