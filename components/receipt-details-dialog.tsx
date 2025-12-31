"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt } from "@/lib/schemas";
import { Calendar, Store, Tag, Loader2, Save, RotateCcw, Trash2 } from "lucide-react";
import { updateReceipt } from "@/app/actions/update-receipt";
import { useAuth } from "@/components/auth-provider";
import { useCategories } from "@/components/categories-provider";
import { useToast } from "@/components/ui/use-toast";

interface ReceiptDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receipt: (Receipt & { id: string }) | null;
}

// Categories managed by provider

export function ReceiptDetailsDialog({ open, onOpenChange, receipt }: ReceiptDetailsDialogProps) {
    const { user } = useAuth();
    const { categories } = useCategories();
    const { toast } = useToast();
    const [localItems, setLocalItems] = useState<Receipt['items']>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (receipt && open) {
            setLocalItems(receipt.items.map(i => ({ ...i, category: i.category || "Other" })));
            setSelectedIndices(new Set());
            setHasChanges(false);
        }
    }, [receipt, open]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIndices(new Set(localItems.map((_, i) => i)));
        } else {
            setSelectedIndices(new Set());
        }
    };

    const handleToggleSelect = (index: number) => {
        const newSelected = new Set(selectedIndices);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedIndices(newSelected);
    };

    const handleDeleteSelected = () => {
        if (selectedIndices.size === 0) return;

        const newItems = localItems.filter((_, i) => !selectedIndices.has(i));
        setLocalItems(newItems);
        setSelectedIndices(new Set());
        setHasChanges(true);
    };

    const handleCategoryChange = (index: number, newCategory: string) => {
        const newItems = [...localItems];
        newItems[index] = { ...newItems[index], category: newCategory };
        setLocalItems(newItems);
        setHasChanges(true);
    };

    const handleReset = () => {
        if (receipt) {
            setLocalItems(receipt.items.map(i => ({ ...i, category: i.category || "Other" })));
            setSelectedIndices(new Set());
            setHasChanges(false);
        }
    };

    const handleSave = async () => {
        if (!receipt || !user) return;
        setIsSaving(true);

        // Recalculate total
        const newTotal = localItems.reduce((sum, item) => sum + item.price, 0);

        try {
            const result = await updateReceipt(receipt.id, user.uid, {
                items: localItems,
                totalAmount: parseFloat(newTotal.toFixed(2))
            });

            if (result.success) {
                setHasChanges(false);
                onOpenChange(false);
                toast({ title: "Receipt updated", description: "Changes saved successfully." });
            } else {
                toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!receipt) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[95vw] !w-[95vw] !h-[90vh] !max-h-[95vh] flex flex-col resize-y overflow-hidden p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b">
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Store className="h-5 w-5 text-blue-500" />
                            {receipt.storeName}
                        </DialogTitle>
                        <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                            ${localItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                        </Badge>
                    </div>
                    <DialogDescription className="flex items-center gap-4 mt-2 text-slate-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> {receipt.date}
                        </span>
                        <span className="flex items-center gap-1">
                            <Tag className="h-4 w-4" /> {receipt.category}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0 p-6 pt-2">
                    <div className="flex items-center justify-between mb-2 h-8">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">Items</h3>
                        {selectedIndices.size > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">{selectedIndices.size} selected</span>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7"
                                    onClick={handleDeleteSelected}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="border rounded-md flex-1 min-h-0 relative overflow-hidden">
                        <ScrollArea className="h-full w-full">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="w-[40px] pl-4">
                                            <Checkbox
                                                checked={localItems.length > 0 && selectedIndices.size === localItems.length}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="w-[40%]">Item</TableHead>
                                        <TableHead className="w-[30%]">Category</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right pr-4">Price</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localItems.map((item, index) => (
                                        <TableRow key={index} className={selectedIndices.has(index) ? "bg-slate-50 dark:bg-slate-800/50" : ""}>
                                            <TableCell className="pl-4">
                                                <Checkbox
                                                    checked={selectedIndices.has(index)}
                                                    onCheckedChange={() => handleToggleSelect(index)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="truncate max-w-[200px]" title={item.name}>
                                                    {item.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={item.category || "Other"}
                                                    onValueChange={(val) => handleCategoryChange(index, val)}
                                                >
                                                    <SelectTrigger className="h-8 w-full min-w-[120px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map(cat => (
                                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-center text-slate-500">{item.quantity}</TableCell>
                                            <TableCell className="text-right pr-4">${item.price.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t mt-auto flex justify-between sm:justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <Button variant="ghost" onClick={handleReset} disabled={isSaving} className="text-slate-500 hover:text-slate-900">
                                <RotateCcw className="mr-2 h-4 w-4" /> Reset Changes
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="bg-blue-600 hover:bg-blue-700">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
