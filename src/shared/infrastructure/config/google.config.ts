import { registerAs } from '@nestjs/config';

export default registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:3000/api/v1/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/content',
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
}));
