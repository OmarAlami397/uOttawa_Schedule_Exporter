/**
 * Prompts the user to sign in to their Google Account and
 * authorize the extension.
 *
 * @returns {Promise<string>} A promise that resolves with the auth token.
 */
export function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {

      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

