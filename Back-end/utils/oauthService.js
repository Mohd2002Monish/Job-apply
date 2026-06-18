const { google } = require('googleapis');

/**
 * Create a fresh OAuth2 client using env credentials
 */
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * Generate the Google consent screen URL.
 * We request gmail.send scope + profile so we can get user info.
 */
const getAuthUrl = () => {
  const oAuth2Client = getOAuth2Client();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',   // get refresh_token
    prompt: 'consent',        // always show consent screen to ensure refresh_token
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',  // to read reply threads
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
};

/**
 * Exchange an authorization code for access + refresh tokens
 */
const getTokensFromCode = async (code) => {
  const oAuth2Client = getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
};

/**
 * Build an authenticated OAuth2 client from stored tokens
 */
const getAuthenticatedClient = (tokens) => {
  const oAuth2Client = getOAuth2Client();
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
};

/**
 * Fetch the authenticated user's profile (email, name, picture)
 */
const getUserInfo = async (oAuth2Client) => {
  const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
};

module.exports = { getOAuth2Client, getAuthUrl, getTokensFromCode, getAuthenticatedClient, getUserInfo };
