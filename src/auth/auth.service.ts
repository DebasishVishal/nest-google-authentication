import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { google } from 'googleapis';
import { AppConfig } from 'src/config';

@Injectable()
export class AuthService {
  googleLogin(req) {
    if (!req.user) {
      return { success: false, message: 'No user from google' };
    }

    return {
      success: true,
      message: 'User Info from Google',
      user: req.user,
    };
  }

  async getNewAccessToken(refreshToken: string): Promise<string> {
    try {
      const response = await axios.post<{ access_token: string }>(
        'https://accounts.google.com/o/oauth2/token',
        {
          client_id: AppConfig.GOOGLE_CLIENT_ID,
          client_secret: AppConfig.GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
      );

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to refresh the access token.');
    }
  }

  async isTokenExpired(token: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,
      );

      const { expires_in: expiresIn } = response.data as { expires_in: number };

      if (!expiresIn || expiresIn <= 0) {
        return true;
      }
      return false;
    } catch (error) {
      return true;
    }
  }

  async revokeGoogleToken(token: string) {
    try {
      // await axios.get(
      //   `https://accounts.google.com/o/oauth2/revoke?token=${token}`,
      // );
      const oauth2Client = new google.auth.OAuth2(
        AppConfig.GOOGLE_CLIENT_ID,
        AppConfig.GOOGLE_CLIENT_SECRET,
      );
      oauth2Client.setCredentials({
        access_token: token,
      });

      await oauth2Client.revokeCredentials();

      console.log('Google token revoked successfully');
    } catch (error) {
      console.error('Failed to revoke the token:', error);
    }
  }
}
