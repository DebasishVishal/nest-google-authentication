import { PassportSerializer } from '@nestjs/passport';

export class SessionSerializer extends PassportSerializer {
  serializeUser(user: any, done: (err: Error | null, user: any) => void): void {
    done(null, user); // Store the entire user object in the session
  }

  deserializeUser(
    payload: any,
    done: (err: Error | null, payload: any) => void,
  ): void {
    done(null, payload); // Retrieve the user object from the session
  }
}
