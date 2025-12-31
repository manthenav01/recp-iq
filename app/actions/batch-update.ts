"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

interface ItemOperation {
    receiptId: string;
    itemIndex: number;
    action: 'delete' | 'update_category';
    data?: any; // For update_category, this would be { category: string }
}

export async function batchUpdateItems(operations: ItemOperation[], userId: string) {
    if (!userId) throw new Error("Unauthorized");
    if (!operations.length) return { success: true };

    try {
        // Group operations by receiptId to minimize reads/writes
        const opsByReceipt: Record<string, ItemOperation[]> = {};
        for (const op of operations) {
            if (!opsByReceipt[op.receiptId]) opsByReceipt[op.receiptId] = [];
            opsByReceipt[op.receiptId].push(op);
        }

        const promises = Object.entries(opsByReceipt).map(async ([receiptId, ops]) => {
            const receiptRef = adminDb.collection("receipts").doc(receiptId);
            const doc = await receiptRef.get();

            if (!doc.exists) throw new Error(`Receipt ${receiptId} not found`);
            const data = doc.data();

            if (data?.userId !== userId) throw new Error("Unauthorized access to receipt");

            let items = [...(data?.items || [])];
            let needsUpdate = false;

            // Sort ops by index descending to avoid shifting issues when splicing
            // However, we can't just splice if we have updates AND deletes intermixed easily without tracking original indices.
            // Better approach: Reconstruct the items array.

            // Map original indices to operations
            const opsByIndex = new Map<number, ItemOperation>();
            ops.forEach(op => opsByIndex.set(op.itemIndex, op));

            const newItems = [];
            let totalAmount = 0;

            for (let i = 0; i < items.length; i++) {
                const op = opsByIndex.get(i);

                if (op) {
                    needsUpdate = true;
                    if (op.action === 'delete') {
                        // Skip adding this item
                        continue;
                    } else if (op.action === 'update_category') {
                        // Add modified item
                        const item = { ...items[i], category: op.data.category };
                        newItems.push(item);
                        totalAmount += (item.price * (item.quantity || 1));
                    }
                } else {
                    // Keep original item
                    const item = items[i];
                    newItems.push(item);
                    totalAmount += (item.price * (item.quantity || 1));
                }
            }

            if (needsUpdate) {
                // Determine if we need to update totalAmount.
                // If we deleted items, yes. If we just changed category, maybe no.
                // But simplified logic: just recalculate is safest if we assume we have full breakdown.
                // *Caveat*: If the receipt has taxes/fees not in items list, our sum might differ.
                // Ideally, we should just subtract deleted items from old total.
                // But for now, let's recalculate based on *remaining items* assuming items list is source of truth.
                // Or better, let's just use the logic of: 
                // newTotal = oldTotal - deletedItemsPrice.

                // Let's refine the total calc:
                // Only change total if we deleted something.
                // But wait, what if we edited a price (not supported yet)? Only category.
                // So total only changes for deletes.

                // Let's calculate delta from deleted items to be safer about hidden fees.
                let delta = 0;
                ops.forEach(op => {
                    if (op.action === 'delete') {
                        const item = items[op.itemIndex];
                        delta += (item.price * (item.quantity || 1));
                    }
                });

                const finalTotal = (data?.totalAmount || 0) - delta;

                await receiptRef.update({
                    items: newItems,
                    totalAmount: parseFloat(finalTotal.toFixed(2)),
                    updatedAt: new Date()
                });
            }
        });

        await Promise.all(promises);

        revalidatePath("/dashboard");
        return { success: true, message: "Batch updates processed successfully" };

    } catch (error) {
        console.error("Batch update error:", error);
        return { success: false, error: (error as Error).message };
    }
}
