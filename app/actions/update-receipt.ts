"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Receipt } from "@/lib/schemas";

export async function updateReceipt(receiptId: string, userId: string, data: Partial<Receipt>) {
    if (!userId) throw new Error("Unauthorized");
    if (!receiptId) throw new Error("Receipt ID required");

    try {
        await adminDb.collection("receipts").doc(receiptId).update({
            ...data,
            updatedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating receipt:", error);
        return { success: false, error: "Failed to update receipt" };
    }
}
