import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import * as session from 'express-session';
const MongoStore = require('connect-mongo');
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000', // Allow requests from your Next.js frontend
    credentials: true,
  });

  // Use cookie-parser middleware
  app.use(cookieParser());

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key', // Use a strong secret
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl:
          process.env.MONGODB_URL || 'mongodb://localhost:27017/onboarding_db',
        collectionName: 'sessions',
        ttl: 15 * 24 * 60 * 60, // Expire after 15 days
      }),
      cookie: {
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
        httpOnly: true,
        sameSite: 'lax', // Prevent CSRF attacks
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  // Session middleware to log session ID
  app.use((req, res, next) => {
    if (!req.session) {
      console.log('No session found');
    } else {
      console.log('Session ID:', req.session.id);
      // if (req.session.user) {
      //   console.log('User in session:', req.session.user);
      // } else {
      //   console.log('No user in session');
      // }
    }
    next();
  });

  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
