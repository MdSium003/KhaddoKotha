# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for KhaddoKotha.

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or **Google Identity Services**)
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth client ID**
6. Choose **Web application** as the application type
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (for local development)
   - `http://192.168.0.102:3000` (if accessing from network)
   - Your production domain (e.g., `https://yourdomain.com`)
8. Add authorized redirect URIs (same as above)
9. Click **Create**
10. Copy the **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

## Step 2: Configure Environment Variables

Create or update `frontend/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**Important:** 
- The variable name must start with `NEXT_PUBLIC_` to be accessible in the browser
- Restart your Next.js dev server after adding this variable

## Step 3: Test the Integration

1. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to the login or signup page
3. You should see a Google sign-in button
4. Click it and sign in with your Google account
5. You should be redirected to the homepage after successful authentication

## Troubleshooting

### Google button doesn't appear
- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
- Make sure you've restarted the Next.js server after adding the env variable
- Check the browser console for any errors

### "Google Identity Services library not loaded" error
- Make sure the Google script is loading (check Network tab in browser dev tools)
- Verify your internet connection
- Check that the script URL `https://accounts.google.com/gsi/client` is accessible

### CORS errors
- Make sure your authorized JavaScript origins in Google Console match your current URL
- For local development, include both `http://localhost:3000` and your network IP

### Authentication fails
- Check the backend logs for any errors
- Verify the backend is running and accessible
- Make sure the backend CORS settings allow your frontend origin

## Security Notes

- Never commit your `.env.local` file to version control
- In production, use environment variables provided by your hosting platform
- The Google Client ID is safe to expose in the frontend (it's public)
- The backend should verify Google ID tokens for additional security (optional enhancement)

