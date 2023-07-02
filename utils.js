// returns random number from 45 to 125
function getToAddressandSubject(headers) {
  let fromAddress;
  let subject;
  for (let x of headers) {
    if (x.name === "From") {
      fromAddress = x.value.split("<")[1].split(">")[0];
    }
    if (x.name === "Subject") {
      subject = x.value;
    }
  }
  return { fromAddress, subject };
}

function randomNumberGenerator() {
  return (Math.floor(Math.random() * 80) + 45) * 1000;
}

//returns raw encoded email
function encodedEmail(fromAddress, subject, threadID) {
  const emailContent =
    `To: ${fromAddress}\r\n` +
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
