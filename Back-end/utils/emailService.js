const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { getAuthenticatedClient } = require('./oauthService');

// ─────────────────────────────────────────────────────────────────────────────
// Legacy nodemailer send (kept as fallback, not used in main flow)
// ─────────────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to, subject, text,
      attachments: [{ path: './public/Mohd_Monish.docx' }],
    });
    console.log('Email sent (legacy):', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email (legacy):', error);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Gmail API send — sends FROM the authenticated user, returns threadId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send an email with an optional attachment via the Gmail API.
 * Returns { success, threadId, messageId } on success, { success: false } on failure.
 *
 * @param {string} to             - Recipient email
 * @param {string} subject        - Subject line
 * @param {string} text           - Plain-text body
 * @param {string} attachmentPath - Absolute path to the attachment (optional)
 * @param {object} tokens         - OAuth2 tokens { access_token, refresh_token, ... }
 */
const sendEmailViaGmailAPI = async (to, subject, text, attachmentPath, tokens, threadId = null) => {
  try {
    const oAuth2Client = getAuthenticatedClient(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Build MIME using nodemailer stream transport (handles attachments cleanly)
    const streamTransport = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });

    const info = await streamTransport.sendMail({
      from: 'me',
      to,
      subject,
      text: text.replace(/<[^>]*>/g, ''), // Plain text fallback
      html: text, // HTML body for tracking pixel support
      ...(threadId ? { headers: { 'In-Reply-To': threadId, 'References': threadId } } : {}),
      ...(attachmentPath ? { attachments: [{ path: attachmentPath }] } : {}),
    });

    // Convert Buffer → base64url for Gmail API
    const rawEmail = info.message
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawEmail,
        ...(threadId ? { threadId } : {})
      },
    });

    const { id: messageId, threadId: responseThreadId } = response.data;
    console.log(`✅ Email sent to ${to} | Thread: ${responseThreadId}`);
    return { success: true, messageId, threadId: responseThreadId };
  } catch (error) {
    console.error('Error sending email via Gmail API:', error.message);
    return { success: false };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Gmail API — check a thread for replies from HR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a Gmail thread has a reply from the HR (someone other than 'me').
 *
 * @param {string} threadId      - Gmail thread ID
 * @param {object} tokens        - OAuth2 tokens
 * @returns {{ hasReply: boolean, replyFrom: string|null, replyDate: Date|null }}
 */
const checkThreadForReply = async (threadId, tokens) => {
  try {
    const oAuth2Client = getAuthenticatedClient(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Get full thread with metadata
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'metadata',
      metadataHeaders: ['From', 'Date', 'Subject'],
    });

    const messages = thread.data.messages || [];

    // The first message is the one WE sent. A reply is any subsequent message.
    if (messages.length <= 1) {
      return { hasReply: false, replyFrom: null, replyDate: null };
    }

    // Check for messages NOT from 'me' (sent by someone else = HR reply)
    // Get the authenticated user's email to filter
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const { data: profile } = await oauth2.userinfo.get();
    const myEmail = profile.email.toLowerCase();

    for (const msg of messages.slice(1)) {
      const headers = msg.payload?.headers || [];
      const fromHeader = headers.find(h => h.name === 'From')?.value || '';
      const dateHeader = headers.find(h => h.name === 'Date')?.value || null;

      // If the From address doesn't contain our email → it's a reply from HR
      if (!fromHeader.toLowerCase().includes(myEmail)) {
        return {
          hasReply: true,
          replyFrom: fromHeader,
          replyDate: dateHeader ? new Date(dateHeader) : new Date(),
        };
      }
    }

    return { hasReply: false, replyFrom: null, replyDate: null };
  } catch (error) {
    console.error(`Error checking thread ${threadId}:`, error.message);
    return { hasReply: false, replyFrom: null, replyDate: null };
  }
};

module.exports = { sendEmail, sendEmailViaGmailAPI, checkThreadForReply };