import { registerAs } from '@nestjs/config';

export default registerAs('meta', () => ({
  appId: process.env.META_APP_ID || 'your-meta-app-id',
  appSecret: process.env.META_APP_SECRET || 'your-meta-app-secret',
  redirectUri:
    process.env.META_REDIRECT_URI ||
    'http://localhost:3000/api/v1/auth/meta/callback',
  scopes: [
    'catalog_management',
    'business_management',
    'ads_management',
    'pages_read_engagement',
    'instagram_basic',
  ],
}));
