// importStudySpots.js

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Path to your service account key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Path to your JSON file
const filePath = path.join(__dirname, "StudySpots.json");
const studySpotsData = JSON.parse(fs.readFileSync(filePath, "utf8"));

async function importStudySpots() {
  const batch = db.batch();
  const collectionRef = db.collection("studySpots");

  studySpotsData.forEach((spot) => {
    // Create a new document with auto-generated ID
    const docRef = collectionRef.doc();
    batch.set(docRef, spot);
  });

  try {
    await batch.commit();
    console.log("Study spots imported successfully!");
  } catch (error) {
    console.error("Error importing study spots:", error);
  }
}

importStudySpots();
