import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, setDoc, doc } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  console.log("Seeding Firestore...");

  // Create Users
  const users = [
    { name: "John Doe", email: "user1@example.com", balance: 1000 },
    { name: "Jane Smith", email: "user2@example.com", balance: 500 },
    { name: "Michael Brown", email: "michael@example.com", balance: 250 },
    { name: "Emily Davis", email: "emily@example.com", balance: 1200 },
    { name: "Chris Wilson", email: "chris@example.com", balance: -50 },
    { name: "Sarah Connor", email: "sarah@example.com", balance: 800 },
    { name: "Bruce Wayne", email: "bruce@example.com", balance: 10000 },
    { name: "Diana Prince", email: "diana@example.com", balance: 5000 },
    { name: "Peter Parker", email: "peter@example.com", balance: 150 },
    { name: "Tony Stark", email: "tony@example.com", balance: 25000 },
  ];

  for (const u of users) {
    const q = query(collection(db, "users"), where("email", "==", u.email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await addDoc(collection(db, "users"), {
        ...u,
        bookingCount: 0,
        createdAt: new Date()
      });
      console.log(`Created user: ${u.name}`);
    } else {
      console.log(`User already exists: ${u.name}`);
    }
  }

  // Create Captains
  const captains = [
    { name: "Captain Jack", email: "captain1@example.com", balance: 0 },
    { name: "Captain Hook", email: "captain2@example.com", balance: 0 },
    { name: "Captain Nemo", email: "nemo@example.com", balance: 150 },
    { name: "Captain Ahab", email: "ahab@example.com", balance: -200 },
    { name: "Captain Marvel", email: "marvel@example.com", balance: 500 },
    { name: "Captain America", email: "america@example.com", balance: 100 },
    { name: "Captain Planet", email: "planet@example.com", balance: 300 },
    { name: "Captain Morgan", email: "morgan@example.com", balance: 450 },
    { name: "Captain Falcon", email: "falcon@example.com", balance: 200 },
    { name: "Captain Kirk", email: "kirk@example.com", balance: 600 },
  ];

  for (const c of captains) {
    const q = query(collection(db, "captains"), where("email", "==", c.email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await addDoc(collection(db, "captains"), {
        ...c,
        bookingCount: 0,
        totalEarnings: 0,
        totalCommission: 0,
        createdAt: new Date()
      });
      console.log(`Created captain: ${c.name}`);
    } else {
      console.log(`Captain already exists: ${c.name}`);
    }
  }

  console.log("Seed data created successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
