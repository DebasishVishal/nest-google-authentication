import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { AppConfig } from 'src/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: AppConfig.GOOGLE_CLIENT_ID,
      clientSecret: AppConfig.GOOGLE_CLIENT_SECRET,
      callbackURL: AppConfig.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      // accessType: 'offline', // Request a refresh token
      // prompt: 'select_account', // Ensure the user is prompted to consent
    });
  }

  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
