import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Post,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { google } from 'googleapis';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { OnboardingService } from 'src/services/onboarding.service';
import { OnboardingUserDataDto } from './dto/onboarding-user-data.dto';
import { CheckTokenExpiryGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly onboardingService: OnboardingService,
  ) {}

  @Get()
  @UseGuards(GoogleOauthGuard)
  async googleAuth(@Req() req) {} // This route will initiate the Google OAuth2 login flow

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = this.authService.googleLogin(req);
    console.log('User in googleAuthRedirect:', user);

    console.log('Access Token :', req.user.accessToken);
    console.log('Refresh Token :', req.user.refreshToken);

    const googleToken = req.user.accessToken;
    const googleRefreshToken = req.user.refreshToken;

    res.cookie('access_token', googleToken, { httpOnly: true });
    res.cookie('refresh_token', googleRefreshToken, {
      httpOnly: true,
    });

    // Save the user's email and set isOnboarding to false
    const existingUser = await this.onboardingService.findUserByEmail(
      user.user.email,
    );
    if (!existingUser) {
      await this.onboardingService.createUser({
        email: user.user.email,
        isOnboardingComplete: false,
      });
    }

    // Log session data
    console.log('Session before saving:', req.session);

    // Store user in session
    req.session.user = user;

    // Log session data after saving
    console.log('Session after saving:', req.session);

    // Redirect to onboarding or dashboard based on isOnboarding flag
    if (existingUser && existingUser.isOnboardingComplete) {
      res.redirect('http://localhost:3000/dashboard');
    } else {
      res.redirect('http://localhost:3000/onboarding');
    }

    // res.status(200).json(user);
  }

  // For getting response
  @Get('user')
  async getUser(@Req() req, @Res() res: Response) {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // console.log('User endpoint session ', req.session.user);

    // Return user data securely in the response body
    res.status(200).json(req.session.user);
  }

  // For getting onboarding status
  @Get('status')
  async getOnboardingStatus(@Req() req, @Res() res: Response) {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dataWithEmail = req.session.user.user; // Get user from session
    const user = await this.onboardingService.findUserByEmail(
      dataWithEmail.email,
    );

    console.log('User in getOnboardingStatus:', user);

    res.status(200).json(user?.isOnboardingComplete || false);
    // return { isOnboarding: user?.isOnboarding || false };
  }

  // For logging out
  @Post('logout')
  async revokeGoogleToken(@Req() req, @Res() res: Response) {
    const accessToken = req.cookies['access_token'];
    const refreshToken = req.cookies['refresh_token'];
    console.log('Access token:', accessToken);
    console.log('Refresh token:', refreshToken);

    try {
      // // Step 1: Check if the access token is expired
      // const isExpired = await this.authService.isTokenExpired(accessToken);

      // let validAccessToken = accessToken;
      // if (isExpired) {
      //   // Step 2: Refresh the access token if expired
      //   validAccessToken =
      //     await this.authService.getNewAccessToken(refreshToken);

      //   console.log('New access token:', validAccessToken);
      // }

      // Step 3: Revoke the valid refresh token
      await this.authService.revokeGoogleToken(refreshToken);

      // Step 4: Destroy the session and cookies
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ message: 'Logout failed' });
        }

        // Clear cookies
        res.clearCookie('connect.sid');
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');

        // console.log('Access token:', req.cookies['access_token']);
        // console.log('Refresh token:', req.cookies['refresh_token']);

        res.status(200).json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Revocation error:', error);
      res
        .status(500)
        .json({ message: 'Logout completed with partial success' });
    }
  }

  // Saving onboarding data
  @Post('onboarding')
  async saveOnboardingData(
    @Body() data: any,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      // console.log('Request headers:', req.headers); // Log request headers
      // console.log('Session ID in onboarding:', req.sessionID); // Log the session ID
      // console.log('Session in onboarding:', req.session); // Log the entire session
      // console.log('Session in onboarding: ', req.session.user); // Log the user in session

      if (!req.session || !req.session.user) {
        console.log('Session not found in onboarding request');
        return { message: 'Unauthorized' };
      }

      const user = req.session.user.user; // Get user from session
      console.log('User in onboarding:', user);

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const updatedUser = await this.onboardingService.updateUser(user.email, {
        ...data,
      });

      console.log('Saved onboarding data', updatedUser);
      res.status(200).json(data);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to save onboarding data', error });
    }
  }

  // @Post('logout')
  // @UseGuards(CheckTokenExpiryGuard)
  // async revokeGoogleToken(@Req() req, @Res() res: Response) {
  //   const refreshToken = req.cookies['refresh_token'];
  //   // res.clearCookie('access_token');
  //   // res.clearCookie('refresh_token');
  //   // this.authService.revokeGoogleToken(refreshToken);

  //   // Destroy session FIRST
  //   req.session.destroy(async (err) => {
  //     if (err) {
  //       console.error('Session destruction error:', err);
  //       return res.status(500).json({ message: 'Logout failed' });
  //     }

  //     try {
  //       // Revoke token AFTER session destruction
  //       await this.authService.revokeGoogleToken(refreshToken);

  //       // Clear cookies
  //       res.clearCookie('connect.sid');
  //       res.clearCookie('access_token');
  //       res.clearCookie('refresh_token');

  //       res.status(200).json({ message: 'Logged out successfully' });
  //     } catch (error) {
  //       console.error('Revocation error:', error);
  //       res
  //         .status(500)
  //         .json({ message: 'Logout completed with partial success' });
  //     }
  //   });
  //   // try {
  //   //   await this.authService.revokeGoogleToken(refreshToken);
  //   //   console.log('Google token revoked successfully');
  //   //   // Clear session data
  //   //   req.session.destroy((err) => {
  //   //     if (err) {
  //   //       console.error('Error destroying session:', err);
  //   //       return res
  //   //         .status(500)
  //   //         .json({ message: 'Failed to revoke Google token' });
  //   //     }

  //   //     res.clearCookie('connect.sid');
  //   //     res.clearCookie('access_token');
  //   //     res.clearCookie('refresh_token');
  //   //     // Log the session and cookies after deletion
  //   //     // console.log('Session after deletion:', req.session);
  //   //     // console.log('Cookies after deletion:', req.cookies);
  //   //     res.status(200).json({ message: 'Google token revoked successfully' });
  //   //   });
  //   // } catch (error) {
  //   //   console.error('Error revoking Google token:', error);
  //   //   return res.status(500).json({
  //   //     message: 'Failed to revoke Google token',
  //   //     error: error.message,
  //   //   });
  //   // }

  //   // const accessToken = req.session.accessToken; // Retrieve access token from session
  //   // // Log the session and cookies before deletion
  //   // // console.log('Session before deletion:', req.session);
  //   // // console.log('Cookies before deletion:', req.cookies);
  //   // if (!accessToken) {
  //   //   return res.status(400).json({ message: 'No access token found' });
  //   // }
  //   // try {
  //   //   const oauth2Client = new google.auth.OAuth2(
  //   //     process.env.GOOGLE_CLIENT_ID,
  //   //     process.env.GOOGLE_CLIENT_SECRET,
  //   //   );
  //   //   oauth2Client.setCredentials({
  //   //     access_token: accessToken,
  //   //   });
  //   //   await oauth2Client.revokeCredentials();
  //   //   console.log('Google token revoked successfully');
  //   //   // Clear session data
  //   //   req.session.destroy((err) => {
  //   //     if (err) {
  //   //       console.error('Error destroying session:', err);
  //   //       return res
  //   //         .status(500)
  //   //         .json({ message: 'Failed to revoke Google token' });
  //   //     }
  //   //     res.clearCookie('connect.sid');
  //   //     // Log the session and cookies after deletion
  //   //     // console.log('Session after deletion:', req.session);
  //   //     // console.log('Cookies after deletion:', req.cookies);
  //   //     res.status(200).json({ message: 'Google token revoked successfully' });
  //   //   });
  //   // } catch (error) {
  //   //   console.error('Error revoking Google token:', error);
  //   //   return res.status(500).json({
  //   //     message: 'Failed to revoke Google token',
  //   //     error: error.message,
  //   //   });
  //   // }
  // }
}
