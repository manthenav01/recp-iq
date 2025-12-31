"use client";

import React, { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Receipt } from "@/lib/schemas";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Store, TrendingDown, TrendingUp, DollarSign, Calendar, FileText } from "lucide-react";
import { ImagePreviewDialog } from "@/components/image-preview-dialog";

interface ItemHistorySheetProps {
    isOpen: boolean;
    onClose: () => void;
    itemName: string | null;
    genericName?: string;
    allReceipts: (Receipt & { id: string })[];
}

export function ItemHistorySheet({ isOpen, onClose, itemName, genericName, allReceipts }: ItemHistorySheetProps) {
    // Filter and aggregate data
    const itemHistory = useMemo(() => {
        if (!itemName) return [];

        const normalizedSearch = itemName.toLowerCase().trim();
        const history: Array<{
            date: string;
            store: string;
            price: number;
            quantity: number;
            unit?: string;
            total: number; // price * quantity if quantity > 1, else price usually
            receiptId: string;
            imageUrl?: string;
        }> = [];

        allReceipts.forEach(receipt => {
            if (receipt.items) {
                receipt.items.forEach((item: any) => {
                    // 1. Try to match by genericName (Strongest Signal)
                    // If both the searched item and the target item have a genericName, use that.
                    // (Note: `itemName` passed to this component is just a string, so we'll need to infer genericness or just rely on the target item having a genericName that matches the search)

                    // Actually, since we only have `itemName` (string) as input, we can't easily access the genericName of the *clicked* item unless we passed the whole object.
                    // BUT, let's assume `itemName` is the name the user clicked.
                    // We can check if the target item's `genericName` matches our search term (if the search term happens to be generic)
                    // OR if the target item's `name` matches.

                    // Ideally, we should receive `genericName` as a prop too. But for now, let's stick to name matching logic, ENHANCED by checking against the target's genericName.

                    const searchTokens = normalizedSearch.split(/\s+/);
                    const itemLower = item.name.toLowerCase();
                    const itemGenericLower = (item.genericName || "").toLowerCase();

                    // Check Match vs Name
                    const searchMatchesTargetName = searchTokens.every((token: string) => itemLower.includes(token));
                    const targetNameMatchesSearch = itemLower.split(/\s+/).every((token: string) => normalizedSearch.includes(token));

                    // Check Match vs Generic Name (Exact match prefered for generic)
                    const matchesGeneric = itemGenericLower && (itemGenericLower === normalizedSearch || itemGenericLower.includes(normalizedSearch));

                    if (searchMatchesTargetName || targetNameMatchesSearch || matchesGeneric) {
                        history.push({
                            date: receipt.date,
                            store: receipt.storeName,
                            price: item.price,
                            quantity: item.quantity || 1,
                            unit: item.unit,
                            total: item.price,
                            receiptId: receipt.id,
                            imageUrl: receipt.imageUrl
                        });
                    }
                });
            }
        });

        // Sort by date desc
        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [itemName, allReceipts]);

    const stats = useMemo(() => {
        if (itemHistory.length === 0) return null;
        const prices = itemHistory.map(h => h.price / (h.quantity || 1)); // Unit price approximation
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const totalSpent = itemHistory.reduce((sum, h) => sum + h.total, 0);

        return { min, max, avg, totalSpent, count: itemHistory.length };
    }, [itemHistory]);

    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                        {itemName}
                    </SheetTitle>
                    <SheetDescription>
                        Purchase history across all stores.
                    </SheetDescription>
                </SheetHeader>

                {stats && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-1">
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Avg Price</span>
                            <div className="text-2xl font-bold flex items-baseline gap-1">
                                ${stats.avg.toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-1">
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Spent</span>
                            <div className="text-2xl font-bold flex items-baseline gap-1">
                                ${stats.totalSpent.toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-1">
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Lowest</span>
                            <div className="text-lg font-semibold flex items-center gap-1 text-emerald-600">
                                <TrendingDown className="h-4 w-4" />
                                ${stats.min.toFixed(2)}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-1">
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Highest</span>
                            <div className="text-lg font-semibold flex items-center gap-1 text-rose-600">
                                <TrendingUp className="h-4 w-4" />
                                ${stats.max.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">History</h3>
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />

                        <div className="space-y-6">
                            {itemHistory.map((item, idx) => (
                                <div key={`${item.receiptId}-${idx}`} className="relative pl-8 group">
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-500 transition-colors" />

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justifying-between w-full">
                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(item.date), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <Store className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm flex items-center gap-2">
                                                        {item.store}
                                                        {item.imageUrl && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedImage(item.imageUrl || null); }}
                                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                                                title="View Receipt"
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {item.quantity && item.quantity > 1 ? `Qty: ${item.quantity}` : ''}
                                                        {item.unit && item.unit !== 'ea' ? (item.quantity > 1 ? ` • ` : '') + item.unit : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-base">
                                                    ${item.price.toFixed(2)}
                                                </div>
                                                {item.unit && item.unit !== 'ea' && (
                                                    <div className="text-xs text-slate-400">
                                                        ${(item.price / (item.quantity || 1)).toFixed(2)} / {item.unit}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SheetContent>

            {/* Image Dialog */}
            <ImagePreviewDialog
                open={!!selectedImage}
                onOpenChange={(open) => !open && setSelectedImage(null)}
                imageUrl={selectedImage}
            />
        </Sheet>
    );
}
