import { Injectable } from '@nestjs/common';

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
}
