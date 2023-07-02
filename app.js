const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const {
  getToAddressandSubject,
  randomNumberGenerator,
  encodedEmail,
} = require("./utils");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://mail.google.com/"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist(TOKEN_PATH);
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

async function sendEmail(auth) {
  console.log("working");

  const gmail = google.gmail({ version: "v1", auth });

  const labelsForQuery = ["custom_reviewed", "SENT"];

  // returns a query sting that from labelsForQuery, we'll use it below for querying
  const query = labelsForQuery.map((label) => `-label:${label}`).join(" ");

  const threads = await gmail.users.threads.list({
    userId: "me",
    q: query,
  });

  console.log(threads.data);

  if (!threads.data.threads) {
    return;
  }

  for (let thread of threads.data.threads) {
    const singleThread = await gmail.users.threads.get({
      userId: "me",
      id: thread.id,
    });

    const { messages } = singleThread.data;

    const { id: messageId } = singleThread.data.messages[0];

    if (messages.length > 1) {
      // if there are more
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: ["Label_2"],
        },
      });
    } else {
      const threadID = singleThread.data.id;
      const { headers } = singleThread.data.messages[0].payload;
      const { to, subject } = getToAddressandSubject(headers);

      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail(to, subject, threadID),
          threadId: threadID,
          labelIds: ["Label_2"],
        },
      });
    }
  }
}

setInterval(async () => {
  try {
    const auth = await authorize();
    sendEmail(auth);
  } catch (err) {
    console.log(err);
  }
}, randomNumberGenerator());
