"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function deleteReceipt(receiptId: string, userId: string) {
    if (!userId) throw new Error("Unauthorized");

    try {
        const receiptRef = adminDb.collection("receipts").doc(receiptId);
        const doc = await receiptRef.get();

        if (!doc.exists) throw new Error("Receipt not found");

        const data = doc.data();
        if (data?.userId !== userId) throw new Error("Unauthorized access to receipt");

        // Delete the receipt document
        await receiptRef.delete();

        revalidatePath("/dashboard");
        return { success: true, message: "Receipt deleted successfully" };
    } catch (error) {
        console.error("Error deleting receipt:", error);
        return { success: false, error: (error as Error).message };
    }
}
