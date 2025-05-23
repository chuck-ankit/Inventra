import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { userRoutes } from './routes/userRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import { transactionRoutes } from './routes/transactionRoutes.js';
import { alertRoutes } from './routes/alertRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { 
  apiLimiter, 
  errorHandler, 
  securityHeaders, 
  corsOptions 
} from './config/security.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'] as const;
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI!;

// Security middleware
app.use(helmet(securityHeaders));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(apiLimiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB
mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('\x1b[32m%s\x1b[0m', '✓ MongoDB Connection Established');
    console.log('\x1b[36m%s\x1b[0m', `Database: ${MONGODB_URI.split('/').pop()}`);
  })
  .catch((error) => {
    console.error('\x1b[31m%s\x1b[0m', '✗ MongoDB Connection Error:');
    console.error('\x1b[31m%s\x1b[0m', error.message);
  });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('\x1b[33m%s\x1b[0m', 'MongoDB disconnected. Attempting to reconnect...');
});

// Error handling middleware
app.use(errorHandler);

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', `✓ Server is running on port ${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `API URL: http://localhost:${PORT}`);
  });
}

// Export the Express app for Vercel
export default app; 