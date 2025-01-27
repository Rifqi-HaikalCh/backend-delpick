const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-firebase-project-id.appspot.com', // Replace with your bucket URL
});

const bucket = admin.storage().bucket();
const auth = admin.auth();

module.exports = { bucket, auth };
