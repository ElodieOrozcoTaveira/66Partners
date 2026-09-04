import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
//Socket
import { createServer } from 'http';
import { initSocket } from './socket/index.js';

//Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import activityRoutes from './routes/activity.routes.js';
import sportRoutes from './routes/sport.routes.js';
import participationRoutes from './routes/participation.routes.js';
import contactRoutes from './routes/contact.routes.js';
import { activityConversationRouter, conversationRouter } from './routes/conversation.routes.js';
import { activityPhotoRouter, photoRouter } from './routes/activityPhoto.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import pushRoutes from './routes/push.routes.js';
import territoryRoutes from './routes/territory.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { getAllowedOrigins, helmetOptions, verifyOrigin } from './middlewares/security.middleware.js';
import { FileController } from './controllers/file.controller.js';

//Docs Swagger
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from '../docs/openApi.js';


dotenv.config();

const app = express();
export const httpServer = createServer(app); // socket se met sur le serveur http pas sur app

// Middleware de sécurité
app.use(helmet(helmetOptions));
const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : 'http://localhost:3000',
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

// Ancien express.static remplacé par FileController : les photos d'activité
// exigent désormais un jeton signé (cf. chantier RGPD F-02), avatars et
// couvertures restent servis tels quels (données publiques du profil).
app.get('/uploads/:filename', FileController.serve);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/activities', activityConversationRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/activities', activityPhotoRouter);
app.use('/api/activity-photos', photoRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/admin', adminRoutes);
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