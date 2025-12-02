import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import reportRoutes from './routes/report.routes.js';
import veterinaryRoutes from './routes/veterinary.routes.js';
import shelterRoutes from './routes/shelter.routes.js';
import adminRoutes from './routes/admin.routes.js';
import matchRoutes from './routes/match.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import geocodingRoutes from './routes/geocoding.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares - CORS configurado para desarrollo móvil
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://animal-rescue-7se2.onrender.com'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 Origin:', origin); // Debug

    // Permitir requests sin origin (mobile apps, curl, Postman, etc)
    if (!origin) {
      console.log('✅ No origin - permitido');
      return callback(null, true);
    }

    // Permitir origins en la lista de permitidos
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin en lista permitida');
      return callback(null, true);
    }

    // Permitir cualquier IP local para desarrollo (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);

    if (isLocalNetwork) {
      console.log('✅ Red local detectada - permitido');
      return callback(null, true);
    }

    // Permitir ngrok y otros túneles (terminan en .ngrok-free.app, .ngrok.io, etc)
    const isTunnel = /\.(ngrok-free\.app|ngrok\.io|loca\.lt|localhost\.run)$/.test(origin);
    if (isTunnel) {
      console.log('✅ Túnel detectado - permitido');
      return callback(null, true);
    }

    // En producción, rechazar otros origins
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ Origin no permitido en producción');
      return callback(new Error('Not allowed by CORS'));
    }

    // En desarrollo, permitir todos
    console.log('✅ Desarrollo - permitir todo');
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas públicas
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/veterinaries', veterinaryRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/geocoding', geocodingRoutes);

// Rutas admin (protegidas)
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Animal Rescue API running' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Accessible at:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://192.168.x.x:${PORT} (desde tu móvil en WiFi)`);
});

export default app