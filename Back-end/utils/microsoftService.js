const fs = require('fs');
const path = require('path');

/**
 * Generate the Microsoft OAuth 2.0 authorization URL.
 */
const getMicrosoftAuthUrl = () => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.MICROSOFT_REDIRECT_URI);
  const scopes = encodeURIComponent('openid profile email offline_access User.Read Mail.ReadWrite Mail.Send');
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scopes}`;
};

/**
 * Exchange authorization code for Microsoft tokens.
 */
const getMicrosoftTokensFromCode = async (code) => {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
    grant_type: 'authorization_code',
    scope: 'openid profile email offline_access User.Read Mail.ReadWrite Mail.Send'
  });

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Microsoft token exchange failed: ${errorText}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000)
  };
};

/**
 * Refresh Microsoft credentials using refresh token.
 */
const refreshMicrosoftTokens = async (refreshToken) => {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'openid profile email offline_access User.Read Mail.ReadWrite Mail.Send'
  });

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Microsoft token refresh failed: ${errorText}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + (data.expires_in * 1000)
  };
};

/**
 * Retrieve user info from Microsoft Graph API.
 */
const getMicrosoftUserInfo = async (accessToken) => {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to get Microsoft user info: ${errorText}`);
  }

  const data = await res.json();
  return {
    email: data.mail || data.userPrincipalName,
    name: data.displayName || '',
    picture: '' // Microsoft avatar requires fetching a binary stream from /photo/$value. Keeping it empty for simplicity.
  };
};

/**
 * Retrieve valid Microsoft token (checks expiry and refreshes if needed).
 */
const getValidMicrosoftToken = async (email, store, authStore) => {
  if (Date.now() > store.tokens.expires_at - 60000) {
    console.log(`Refreshing Microsoft tokens for ${email}...`);
    try {
      const newTokens = await refreshMicrosoftTokens(store.tokens.refresh_token);
      store.tokens = newTokens;
      authStore.set(email, store);
      return newTokens.access_token;
    } catch (err) {
      console.error(`Failed to refresh Microsoft tokens:`, err.message);
      throw err;
    }
  }
  return store.tokens.access_token;
};

/**
 * Send an email via Microsoft Graph API by creating a draft first (to get conversationId) and then sending it.
 */
const sendEmailViaGraphAPI = async (to, subject, text, attachmentPath, accessToken) => {
  try {
    const attachments = [];
    if (attachmentPath && fs.existsSync(attachmentPath)) {
      const contentBytes = fs.readFileSync(attachmentPath).toString('base64');
      attachments.push({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: path.basename(attachmentPath),
        contentType: 'application/octet-stream',
        contentBytes: contentBytes
      });
    }

    // 1. Create a draft message to obtain a conversationId (thread ID equivalence)
    const draftRes = await fetch('https://graph.microsoft.com/v1.0/me/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject,
        body: {
          contentType: 'html',
          content: text
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ],
        attachments
      })
    });

    if (!draftRes.ok) {
      const errorText = await draftRes.text();
      console.error('Failed to create Microsoft draft:', errorText);
      return { success: false };
    }

    const draftData = await draftRes.json();
    const messageId = draftData.id;
    const threadId = draftData.conversationId;

    // 2. Send the draft message
    const sendRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!sendRes.ok) {
      const errorText = await sendRes.text();
      console.error('Failed to send Microsoft draft:', errorText);
      return { success: false };
    }

    console.log(`✅ Email sent to ${to} via Microsoft Graph | Thread: ${threadId}`);
    return { success: true, messageId, threadId };
  } catch (error) {
    console.error('Error sending email via Microsoft Graph API:', error.message);
    return { success: false };
  }
};

/**
 * Check if an Outlook conversation thread has a reply from the recipient.
 */
const checkOutlookThreadForReply = async (conversationId, myEmail, accessToken) => {
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$filter=conversationId eq '${conversationId}'&$select=sender,from,receivedDateTime`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to list Outlook messages for conversation ${conversationId}:`, errorText);
      return { hasReply: false, replyFrom: null, replyDate: null };
    }

    const data = await res.json();
    const messages = data.value || [];

    const myEmailLower = myEmail.toLowerCase();
    for (const msg of messages) {
      const senderAddress = msg.sender?.emailAddress?.address || msg.from?.emailAddress?.address || '';
      if (senderAddress && !senderAddress.toLowerCase().includes(myEmailLower)) {
        return {
          hasReply: true,
          replyFrom: senderAddress,
          replyDate: msg.receivedDateTime ? new Date(msg.receivedDateTime) : new Date()
        };
      }
    }

    return { hasReply: false, replyFrom: null, replyDate: null };
  } catch (error) {
    console.error(`Error checking Outlook conversation ${conversationId}:`, error.message);
    return { hasReply: false, replyFrom: null, replyDate: null };
  }
};

/**
 * Send an Outlook follow-up email as a direct thread reply.
 */
const sendOutlookFollowUp = async (conversationId, followUpText, accessToken) => {
  try {
    // 1. Get messages in the conversation to find the message ID to reply to
    const messagesRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$filter=conversationId eq '${conversationId}'&$select=id`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!messagesRes.ok) {
      throw new Error(`Failed to list conversation messages: ${await messagesRes.text()}`);
    }

    const messagesData = await messagesRes.json();
    const messages = messagesData.value || [];
    if (messages.length === 0) {
      throw new Error(`No messages found in conversation ${conversationId}`);
    }

    // Use the first/most recent message to reply to
    const lastMessageId = messages[0].id;

    // 2. Create draft reply
    const replyDraftRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${lastMessageId}/createReply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!replyDraftRes.ok) {
      throw new Error(`Failed to create reply draft: ${await replyDraftRes.text()}`);
    }

    const replyDraftData = await replyDraftRes.json();
    const replyMessageId = replyDraftData.id;

    // 3. Update reply draft with our follow-up text
    const updateRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${replyMessageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: {
          contentType: 'text',
          content: followUpText
        }
      })
    });

    if (!updateRes.ok) {
      throw new Error(`Failed to update reply draft: ${await updateRes.text()}`);
    }

    // 4. Send reply draft
    const sendRes = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${replyMessageId}/send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!sendRes.ok) {
      throw new Error(`Failed to send reply draft: ${await sendRes.text()}`);
    }

    console.log(`✅ Outlook follow-up sent successfully for thread ${conversationId}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Outlook follow-up:', error.message);
    return { success: false };
  }
};

module.exports = {
  getMicrosoftAuthUrl,
  getMicrosoftTokensFromCode,
  getMicrosoftUserInfo,
  getValidMicrosoftToken,
  sendEmailViaGraphAPI,
  checkOutlookThreadForReply,
  sendOutlookFollowUp
};
