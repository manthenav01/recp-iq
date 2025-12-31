"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Receipt } from "@/lib/schemas";

export async function searchReceipts(query: string, userId: string) {
    if (!userId) throw new Error("Unauthorized");
    if (!query || query.trim().length === 0) return { success: true, data: [] };

    try {
        const lowerQuery = query.toLowerCase();

        // 1. Fetch all receipts for the user (Firestore doesn't support array-contains-any for substrings easily)
        // For a scalable solution, we'd use Algolia/Elasticsearch. For this scale, retrieving user's receipts is fine.
        const receiptsSnap = await adminDb.collection("receipts")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(100) // Safety limit
            .get();

        const allReceipts = receiptsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (Receipt & { id: string })[];

        // 2. Filter in memory
        const results = allReceipts.filter(receipt => {
            // Match Store Name
            if (receipt.storeName.toLowerCase().includes(lowerQuery)) return true;

            // Match Items
            if (receipt.items && receipt.items.some(item =>
                item.name.toLowerCase().includes(lowerQuery) ||
                (item.category && item.category.toLowerCase().includes(lowerQuery))
            )) return true;

            // Match Category
            if (receipt.category && receipt.category.toLowerCase().includes(lowerQuery)) return true;

            return false;
        }).map(receipt => {
            // Serialize Firestore Timestamp to string to prevent "Only plain objects..." error
            const createdAt = (receipt as any).createdAt;
            return {
                ...receipt,
                createdAt: createdAt && typeof createdAt.toDate === 'function'
                    ? createdAt.toDate().toISOString()
                    : createdAt
            };
        });

        return { success: true, data: results };
    } catch (error) {
        console.error("Search Error:", error);
        return { success: false, error: "Failed to search receipts" };
    }
}
