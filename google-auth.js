/**
 * Gets a token, fetches user info, and saves both to storage.
 * This is the main function called by the "Sign In" button.
 * @returns {Promise<{authToken: string, user: object}>}
 */
export async function getAuthTokenAndUserInfo() {
  return new Promise((resolve, reject) => {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    const scopes = manifest.oauth2.scopes.join(" ");
    const redirectUri = chrome.identity.getRedirectURL();

    let authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    authUrl += `?client_id=${clientId}`;
    authUrl += `&response_type=token`;
    authUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    authUrl += `&scope=${encodeURIComponent(scopes)}`;
    authUrl += `&prompt=select_account`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }

        try {
          const url = new URL(responseUrl);
          const hash = new URLSearchParams(url.hash.substring(1));
          const authToken = hash.get("access_token");

          if (!authToken) {
            return reject(new Error("Token not found in auth response."));
          }

          const userResponse = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );
          if (!userResponse.ok) {
            return reject(new Error("Failed to fetch user info."));
          }
          const user = await userResponse.json();

          await chrome.storage.local.set({ authToken, userInfo: user });

          resolve({ authToken, user });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Checks storage for a saved token and user info.
 * @returns {Promise<{authToken: string, userInfo: object}>}
 */
export async function getSavedUserData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["authToken", "userInfo"], (result) => {
      if (chrome.runtime.lastError) {
        resolve({});
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * Signs the user out by revoking the token and clearing storage.
 */
export function revokeAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("authToken", (result) => {
      const token = result.authToken;
      if (!token) {
        console.log("Not signed in, no token to revoke.");
        return resolve();
      }

      fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "token=" + token,
      })
        .finally(() => {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            chrome.storage.local.remove(["authToken", "userInfo"], () => {
              console.log("Token revoked and user data cleared from storage.");
              resolve();
            });
          });
        })
        .catch((error) => {
          console.error("Network error during token revocation:", error);
          reject(error);
        });
    });
  });
}
