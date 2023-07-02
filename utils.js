const fs = require("fs/promises");
const { authenticate } = require("@google-cloud/local-auth");

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

// returns random number from 45 to 125

function getToAddressandSubject(headers) {
  let to;
  let subject;
  for (let x of headers) {
    if (x.name === "From") {
      to = x.value.split("<")[1].split(">")[0];
    }
    if (x.name === "Subject") {
      subject = x.value;
    }
  }
  return { to, subject };
}

async function authorize(TOKEN_PATH, CREDENTIALS_PATH, SCOPES) {
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

function randomNumberGenerator() {
  return (Math.floor(Math.random() * 80) + 45) * 1000;
}

function encodedEmail(to, subject, threadID) {
  const emailContent =
    `To: ${to}\r\n` +
    `Subject: Re: ${subject}\r\n` +
    `In-Reply-To: ${threadID}\r\n` +
    `References: ${threadID}\r\n` +
    "Content-Type: text/plain; charset=utf-8\r\n\r\n" +
    "This is a reply to the thread";
  const encoded = Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return encoded;
}

async function createLabel() {
  await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: "custom_reviewed",
      type: "user",
      messageListVisibility: "show",
      labelListVisibility: "labelShow",
    },
  });
}

module.exports = {
  randomNumberGenerator,
  getToAddressandSubject,
  encodedEmail,
};
