// Google OAuth utility functions

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: {
              credential: string;
            }) => void;
          }) => void;
          renderButton: (element: HTMLElement, config: {
            theme: string;
            size: string;
            text: string;
            width: string;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export interface GoogleUserInfo {
  sub: string; // Google ID
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

/**
 * Get Google user info from ID token
 */
async function getGoogleUserInfo(idToken: string): Promise<GoogleUserInfo> {
  // Decode the JWT token (client-side, not verified - backend should verify)
  const base64Url = idToken.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

/**
 * Sign in with Google using One Tap or button
 */
export async function signInWithGoogle(): Promise<GoogleUserInfo> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("Google Client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  }

  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google Identity Services library not loaded"));
      return;
    }

    // Use One Tap for automatic sign-in
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const userInfo = await getGoogleUserInfo(response.credential);
          resolve(userInfo);
        } catch (error) {
          reject(error);
        }
      },
    });

    // Prompt One Tap
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap not available, use button instead
        reject(new Error("One Tap not available"));
      }
    });
  });
}

/**
 * Sign in with Google using button click
 */
export function setupGoogleButton(
  buttonElement: HTMLElement | null,
  onSuccess: (userInfo: GoogleUserInfo) => void,
  onError: (error: Error) => void
) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    onError(new Error("Google Client ID is not configured"));
    return;
  }

  if (!window.google) {
    onError(new Error("Google Identity Services library not loaded"));
    return;
  }

  if (!buttonElement) {
    onError(new Error("Button element not found"));
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: async (response) => {
      try {
        const userInfo = await getGoogleUserInfo(response.credential);
        onSuccess(userInfo);
      } catch (error) {
        onError(error instanceof Error ? error : new Error("Failed to decode Google token"));
      }
    },
  });

  window.google.accounts.id.renderButton(buttonElement, {
    theme: "outline",
    size: "large",
    text: "signin_with",
    width: "100%",
  });
}

