import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getRandomInt } from './utils.js';

dotenv.config();

if(!process.env.FIREBASE_SERVICE_ACCOUNT_KEY || !process.env.FIREBASE_AUTH_UID) {
  throw new Error('Missing required environment variables for DB');
}

// Setting up Firebase Admin SDK https://firebase.google.com/docs/database/admin/start
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const FIREBASE_DB_URL = 'https://tiny-random-concert-default-rtdb.firebaseio.com/';

// Initialize the app with a service account, granting admin privileges
const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: FIREBASE_DB_URL,
  databaseAuthVariableOverride: {
    uid: process.env.FIREBASE_AUTH_UID
  }
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
const db = getDatabase(app);

// Useful link about security rules: https://medium.com/@juliomacr/10-firebase-realtime-database-rule-templates-d4894a118a98

// Exported CRUD methods that interact with Firebase DB
export const getData = async (path) => {
  try {
    const ref = db.ref(path);
    const snapshot = await ref.once("value");
    return snapshot.val();
  } catch (error) {
    console.error(`Error getting data from path ${path}:`, error);
    throw error;
  }
};

export const setRevid = async (id) => {
  if (!id || typeof id !== 'number') {
    throw new Error('revid must be a valid number');
  }
  
  try {
    const revidRef = db.ref('concerts/revid');
    await revidRef.set(id);
  } catch (error) {
    throw new Error(`Failed to set revid: ${error.message}`);
  }
};

export const setConcertsLinks = async (concertsLinks) => {  
  if (!Array.isArray(concertsLinks) || !concertsLinks.length) {
    throw new Error('concerts/links must be non-empty array');
  } 

  try {
    const linksRef = db.ref('concerts/links');
    const promises = concertsLinks.map(link => linksRef.push(link));
    await Promise.all(promises);
  } catch (error) {
    throw new Error(`Failed to set concertsLinks: ${error.message}`);
  }

};

export const addNewConcertLink = async (link) => {
  if (!link || typeof link !== 'string') {
    throw new Error('concertLink must be a valid string');
  }
  
  try {
    const linksRef = db.ref('concerts/links');
    await linksRef.push(link);
  } catch (error) {
    throw new Error(`Failed to add new concert link: ${error.message}`);
  }
};

// Helper function to get a random integer
const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
};

export const getRandConcert = async () => {
  try {
    const { concerts_count: maxCount } = await getData("concerts/concerts_count");
    const randomIndex = getRandomInt(maxCount);

    const linksRef = db.ref('concerts/links');
    const snapshot = await linksRef.once("value");
    const parsedLinks = snapshot.val();

    return parsedLinks[randomIndex];
  } catch (error) {
    console.error('Error getting random concert:', error);
    throw error; 
  }
};



export const updateCount = async () => {
  try {
    const concertsCount = db.ref('concerts/concerts_count');
    await concertsCount.transaction((currentValue) => (currentValue || 0) + 1);
  } catch (error) {
    console.error('Error updating concerts count:', error);
    throw error;
  }
};

export const getCount = async () => {
  try {
    const ref = db.ref('concerts/concerts_count');
    const snapshot = await ref.once('value');
    return snapshot.val();
  } catch (error) {
    console.error('Error getting concerts count:', error);
    throw error;
  }
};

export const setCount = async (num) => {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new Error('Count must be a valid number');
  }
  
  try {
    const countRef = db.ref('concerts/concerts_count');
    await countRef.set(num);
  } catch (error) {
    console.error('Error setting concerts count:', error);
    throw error; 
  }
};

// Export Firebase DB
export default db;

