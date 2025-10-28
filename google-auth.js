/**
 * Prompts the user to sign in to their Google Account and
 * authorize the extension.
 *
 * @returns {Promise<string>} A promise that resolves with the auth token.
 */
export function getAuthToken() {
  return new Promise((resolve, reject) => {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    const scopes = manifest.oauth2.scopes.join(" ");
    const redirectUri = chrome.identity.getRedirectURL();
    console.log("COPY THIS URI:", redirectUri);

    let authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    authUrl += `?client_id=${clientId}`;
    authUrl += `&response_type=token`;
    authUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    authUrl += `&scope=${encodeURIComponent(scopes)}`;
    authUrl += `&prompt=select_account`;

    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      function (responseUrl) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
          return;
        }

        try {
          const url = new URL(responseUrl);
          const hash = new URLSearchParams(url.hash.substring(1));
          const token = hash.get("access_token");

          if (token) {
            resolve(token);
          } else {
            reject(new Error("Token not found in auth response."));
          }
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Fetches the user's email address using their auth token.
 *
 * @param {string} token The auth token.
 * @returns {Promise<object>} A promise that resolves with the user's info.
 */
export function getUserInfo(token) {
  return new Promise((resolve, reject) => {
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Failed to fetch user info.");
      })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Signs the user out by revoking their Google auth token.
 */
export function revokeAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, function (token) {
      if (chrome.runtime.lastError) {
        console.log("Not signed in, no token to revoke.");
        resolve();
        return;
      }

      fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "token=" + token,
      })
        .then((response) => {
          if (response.ok) {
            chrome.identity.removeCachedAuthToken(
              { token: token },
              function () {
                console.log("Token revoked and removed from cache.");
                resolve();
              }
            );
          } else {
            console.warn(
              "Google token revocation failed. Status:",
              response.status
            );
            chrome.identity.removeCachedAuthToken(
              { token: token },
              function () {
                console.log("Token revocation failed, but removed from cache.");
                resolve();
              }
            );
          }
        })
        .catch((error) => {
          console.error("Network error during token revocation:", error);
          reject(error);
        });
    });
  });
}
