import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { SessionSerializer } from './serializers/passport.serializer';
import { OnboardingService } from '../services/onboarding.service';
import { OnboardingUserDataSchema } from '../schemas/onboarding-user-data.schema';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'OnboardingUserData', schema: OnboardingUserDataSchema },
    ]),
    PassportModule.register({ session: true }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    SessionSerializer,
    OnboardingService,
  ],
})
export class AuthModule {}
