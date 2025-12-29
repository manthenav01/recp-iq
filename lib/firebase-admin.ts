import "server-only";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

import fs from "fs";
import path from "path";

// Helper to handle service account being a string or object
const getServiceAccount = () => {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (key) {
        try {
            console.log("Loading service account from env var...");
            return JSON.parse(key);
        } catch (error) {
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
        }
    }

    // Try reading from service-account.json in the project root
    try {
        const filePath = path.join(process.cwd(), "service-account.json");
        if (fs.existsSync(filePath)) {
            console.log("Loading service account from file:", filePath);
            const content = fs.readFileSync(filePath, "utf-8");
            const parsed = JSON.parse(content);
            console.log("Service Account Project ID:", parsed.project_id);
            return parsed;
        } else {
            console.warn("service-account.json not found at:", filePath);
        }
    } catch (error) {
        console.warn("Error reading service-account.json:", error);
    }

    console.warn("No service account found, using default credentials.");
    return {};
};

const serviceAccount = getServiceAccount();

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
} else {
    // Ensure we don't re-initialize if hot reloading
    try {
        // getApp(); 
    } catch (e) {
        // ignore
    }
}

const adminDb = getFirestore();
const adminStorage = getStorage();

export { adminDb, adminStorage };
