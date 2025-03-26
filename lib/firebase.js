const admin = require("firebase-admin");
const path = require("path"); // For resolving the path to the service account file

// Path to your service account JSON file
const serviceAccount = path.resolve(
  "../config",
  "./todo-auth-5ce3e-firebase-adminsdk-fbsvc-4ae1205cae.json"
);

// Initialize Firebase Admin SDK with credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), // Provide the service account key here
});

// Firestore and Auth instance from Firebase Admin SDK
const auth = admin.auth(); // Access Firebase Authentication through Admin SDK

module.exports = auth;
