import { config } from 'dotenv';

config(); // Load environment variables from .env file

export const AppConfig = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || '',
  SESSION_SECRET: process.env.SESSION_SECRET || '',
  MONGO_URL: process.env.MONGO_URL || '',
};
