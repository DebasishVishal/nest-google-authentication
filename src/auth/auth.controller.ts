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
import { SessionAuthGuard } from './guards/auth.guard';

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

    // console.log('After google authenticationuser - ', user);

    // // Save the user's email and set isOnboarding to false
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
    // console.log('Session before saving:', req.session);

    // Store user and access token in the session
    req.session.user = user;
    req.session.accessToken = user.user.accessToken;

    // Log session data after saving
    // console.log('Session after saving:', req.session);

    // Redirect to onboarding or dashboard based on isOnboarding flag
    if (existingUser && existingUser.isOnboardingComplete) {
      res.redirect('http://localhost:3000/dashboard');
    } else {
      res.redirect('http://localhost:3000/onboarding');
    }

    // Redirect without sensitive data in the URL
    // res.redirect('http://localhost:3000/onboarding');

    // res.redirect(
    //   `http://localhost:3000/dashboard?user=${encodeURIComponent(JSON.stringify(user))}`,
    // );
  }

  // For getting response
  @Get('user')
  async getUser(@Req() req, @Res() res: Response) {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // console.log('Session ID in user:', req.sessionID);
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

  @Post('logout')
  async revokeGoogleToken(@Req() req, @Res() res: Response) {
    const accessToken = req.session.accessToken; // Retrieve access token from session

    // Log the session and cookies before deletion
    // console.log('Session before deletion:', req.session);
    // console.log('Cookies before deletion:', req.cookies);

    if (!accessToken) {
      return res.status(400).json({ message: 'No access token found' });
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      await oauth2Client.revokeCredentials();
      console.log('Google token revoked successfully');

      // Clear session data
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res
            .status(500)
            .json({ message: 'Failed to revoke Google token' });
        }

        res.clearCookie('connect.sid');

        // Log the session and cookies after deletion
        // console.log('Session after deletion:', req.session);
        // console.log('Cookies after deletion:', req.cookies);

        res.status(200).json({ message: 'Google token revoked successfully' });
      });
    } catch (error) {
      console.error('Error revoking Google token:', error);
      return res.status(500).json({
        message: 'Failed to revoke Google token',
        error: error.message,
      });
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
      console.log('Session ID in onboarding:', req.sessionID); // Log the session ID
      // console.log('Session in onboarding:', req.session); // Log the entire session
      console.log('Session in onboarding: ', req.session.user); // Log the user in session

      if (!req.session || !req.session.user) {
        console.log('Session not found in onboarding request');
        return { message: 'Unauthorized' };
      }

      const user = req.session.user.user; // Get user from session

      // console.log('Session in onboarding : ', user);
      // console.log('User in session:', user);
      // if (!user) {
      //   return res.status(401).json({ message: 'Unauthorized' });
      // }

      // // Add email to the incoming data
      // const dataWithEmail = { email: user.email, ...data };

      // const savedData = await this.onboardingService.saveOnboardingData(data);
      const updatedUser = await this.onboardingService.updateUser(user.email, {
        ...data,
      });

      res.status(200).json(data);
      console.log('Saved onboarding data', updatedUser);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to save onboarding data', error });
    }
  }

  // @Post('onboarding')
  // async saveOnboardingData(@Body() data: any, @Req() req, @Res() res) {
  //   try {
  //     console.log('Session in /onboarding:', req.session); // Log the session
  //     const user = req.session.user; // Get user from session
  //     if (!user) {
  //       return res.status(401).json({ message: 'Unauthorized' });
  //     }

  //     const savedData = await this.onboardingService.saveOnboardingData(data);
  //     res.status(201).json(savedData);
  //   } catch (error) {
  //     console.error('Error in saveOnboardingData:', error);
  //     res.status(500).json({ message: 'Failed to save onboarding data', error: error.message });
  //   }
  // }
}
