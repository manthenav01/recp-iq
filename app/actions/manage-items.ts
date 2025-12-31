"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function deleteReceiptItem(receiptId: string, itemIndex: number, userId: string) {
    if (!userId) throw new Error("Unauthorized");

    try {
        const receiptRef = adminDb.collection("receipts").doc(receiptId);
        const doc = await receiptRef.get();

        if (!doc.exists) throw new Error("Receipt not found");

        const data = doc.data();
        if (data?.userId !== userId) throw new Error("Unauthorized access to receipt");

        const items = data?.items || [];
        if (itemIndex < 0 || itemIndex >= items.length) throw new Error("Invalid item index");

        // Remove the item
        const [removedItem] = items.splice(itemIndex, 1);

        // Recalculate total amount
        // If the item had a quantity, we assume the price in the object is unit price, 
        // but typically the receipt parser puts final line price. 
        // Let's assume price is total for line item based on our parser logic.
        // Wait, parser logic: "CRITICAL: ... Use the FINAL price (after discount) as the item price."
        // So we can just subtract the price.
        // However, safer to recalculate strictly from remaining items to avoid floating point drift or logic mismatch.

        let newTotal = 0;
        items.forEach((item: any) => {
            // Assuming price is the line total for that item.
            // If we support quantity logic in future, we might strictly do price * quantity.
            // Current parser output structure usually has price as the definitive value for that line.
            newTotal += (item.price || 0) * (item.quantity || 1);
        });

        // Update Firestore
        await receiptRef.update({
            items: items,
            totalAmount: newTotal
        });

        revalidatePath("/dashboard");
        return { success: true, message: "Item deleted successfully" };
    } catch (error) {
        console.error("Error deleting item:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function updateReceiptItemCategory(receiptId: string, itemIndex: number, newCategory: string, userId: string) {
    if (!userId) throw new Error("Unauthorized");

    try {
        const receiptRef = adminDb.collection("receipts").doc(receiptId);
        const doc = await receiptRef.get();

        if (!doc.exists) throw new Error("Receipt not found");

        const data = doc.data();
        if (data?.userId !== userId) throw new Error("Unauthorized access to receipt");

        const items = data?.items || [];
        if (itemIndex < 0 || itemIndex >= items.length) throw new Error("Invalid item index");

        // Update the category
        items[itemIndex].category = newCategory;

        // Update Firestore
        await receiptRef.update({
            items: items
        });

        revalidatePath("/dashboard");
        return { success: true, message: "Item category updated successfully" };

    } catch (error) {
        console.error("Error updating item category:", error);
        return { success: false, error: (error as Error).message };
    }
}
