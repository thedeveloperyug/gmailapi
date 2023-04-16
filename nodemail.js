const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const gmail = google.gmail('v1');
// require('dotenv').config();


const GMAIL_ID = 'thedeveloperyug@gmail.com';
const CLIENT_ID = '1021823119827-015fqfvq8ii39apscsfmqe9am7l056v5.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//040QTxz2eYRnRCgYIARAAGAQSNwF-L9IrzGszr8kT2F5dWBRRozbVk7dYb8xlLiWEMXQiO7StRZs97KiHdxBXTwlJ7-N8kswb8KA';

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
      q: 'is:unread' // Only get unread messages
    });
    const messages = res.data.messages || [];
    console.log(messages)
    for (const message of messages) {
      const res = await gmail.users.threads.get({
        userId: 'me',
        id: message.threadId
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
          text: 'Thanks for your email',
        };
        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${mailOptions.to}`);
        console.log(messages[0].id[0])
       
        // Function to add a Label to the email and move the email to the label
        // console.log(result)
        await gmail.users.messages.modify({
          auth: oAuth2Client,
          userId: 'me',
          id:messages[0].id[0],
          requestBody: {
            addLabelIds:['Labels'],
            // removeLabelIds: ['INBOX'],
          },
        });
        console.log(`Email moved to Label_1`);
      }
    }
    const result = await transporter.sendReplyToEmail(mailOptions);

  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

checkForNewEmails().then((result) => console.log('Email sent...', result)).catch((error) => console.log(error.message));
setInterval(checkForNewEmails, Math.floor(Math.random() * (120000 - 45000 + 1) + 4500));
