const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const gmail = google.gmail('v1');
// require('dotenv').config();


const GMAIL_ID = 'YOUR GMAIL_ID';
const CLIENT_ID = 'YOUR CLIENT_ID';
const CLIENT_SECRET = 'YOUR CLIENT_SECRET';
const REDIRECT_URI = 'YOUR REDIRECT_URI';
const REFRESH_TOKEN = 'REFRESH_TOKEN';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
console.log("Executing...")

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });



// Function to check for new emails in a given Gmail ID
async function checkForNewEmails() {
  try {
    const accessToken = await oAuth2Client.getAccessToken()
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: GMAIL_ID,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });
    const gmail = google.gmail({
      version: 'v1',
      auth: oAuth2Client
    });

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 1, // Only get unread messages
    });
    const messages = res.data.messages || [];
    console.log(messages)
    for (const message of messages) {
      const res = await gmail.users.threads.get({
        userId: 'me',
        id: message.threadId,
      });
      const thread = res.data;
      const isReply = thread.messages.some(
        m => m.labelIds.includes('SENT') && m.from.emailAddress === 'thedeveloperyug@gmail.com'
      );
      if (!isReply) {
        const mailOptions = {
          from: GMAIL_ID,
          to: thread.messages[0].payload.headers.find(header => header.name === 'From').value,
          subject: 'Thanks for your email',
          text: 'We will contact you soon...',
        };
        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${mailOptions.to}`);
        console.log(message.threadId)

        // Function to add a Label to the email and move the email to the label
        // await gmail.users.messages.list({
        //   userId: 'me',
        //   maxResults: 1,
        // });
        const messageId = res.data.messages[0].id;
        console.log(`Message ID: ${messageId}`);
        const labelName = "Replied";
        // Get the latest message from the inbox
        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 1,
          q: 'in:inbox', // Only get messages from the inbox
        });


        // Check if the label already exists
        const labelsResponse = await gmail.users.labels.list({ userId: "me" });
        const labels = labelsResponse.data.labels;
        let labelId = null;
        for (let i = 0; i < labels.length; i++) {
          if (labels[i].name === labelName) {
            labelId = labels[i].id;
            break;
          }
        }

        // If the label doesn't exist, create it
        if (!labelId) {
          const createLabelResponse = await gmail.users.labels.create({
            userId: "me",
            requestBody: {
              name: labelName,
              labelListVisibility: "labelShow",
              messageListVisibility: "show",
            },
          });
          labelId = createLabelResponse.data.id;
        }

        // Apply the label to the message
        await gmail.users.messages.modify({
          userId: "me",
          id: messageId,
          requestBody: {
            addLabelIds: [labelId],
            removeLabelIds: ['INBOX', 'UNREAD'],
          },
        });

        console.log(`Email moved to replied`);

      }
    }

  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

checkForNewEmails().then((result) => console.log('Email sent...', result)).catch((error) => console.log(error.message));
setInterval(checkForNewEmails, Math.floor(Math.random() * (120000 - 45000 + 1) + 4500));
