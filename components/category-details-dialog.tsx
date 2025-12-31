"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { batchUpdateItems } from "@/app/actions/batch-update";
import { useCategories } from "@/components/categories-provider";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Store, Tag, Trash2, Pencil, Loader2, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CategoryItem {
    name: string;
    price: number;
    quantity: number;
    store: string;
    date: string;
    originalReceiptId: string;
    category: string;
    itemIndex: number;
}

interface CategoryDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: string | null;
    items: CategoryItem[];
    totalAmount: number;
}

// Categories managed by provider

export function CategoryDetailsDialog({ open, onOpenChange, category, items, totalAmount }: CategoryDetailsDialogProps) {
    const { user } = useAuth();
    const { categories } = useCategories();
    const { toast } = useToast();

    const [localItems, setLocalItems] = useState<CategoryItem[]>([]);

    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
    const [pendingCategoryUpdates, setPendingCategoryUpdates] = useState<Map<string, string>>(new Map());

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && items) {
            setLocalItems([...items]);
            setSelectedIndices(new Set());
            setPendingCategoryUpdates(new Map());
            setPendingDeletes(new Set());
        }
    }, [open, items]);

    const hasChanges = pendingDeletes.size > 0 || pendingCategoryUpdates.size > 0;

    const getItemKey = (item: CategoryItem) => `${item.originalReceiptId}-${item.itemIndex}`;

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

        const newDeletes = new Set(pendingDeletes);
        // We iterate current localItems to find what to delete.
        // We need to be careful: the index is into localItems, which MIGHT have already been filtered?
        // No, current logic is: localItems IS the view.
        // So selectedIndices refers to indices in `localItems`.

        const newLocalItems = localItems.filter((item, index) => {
            if (selectedIndices.has(index)) {
                newDeletes.add(getItemKey(item));
                return false;
            }
            return true;
        });

        setLocalItems(newLocalItems);
        setPendingDeletes(newDeletes);
        setSelectedIndices(new Set());
    };

    const handleDeleteSingle = (index: number) => {
        const item = localItems[index];
        const newDeletes = new Set(pendingDeletes);
        newDeletes.add(getItemKey(item));

        const newLocalItems = localItems.filter((_, i) => i !== index);
        setLocalItems(newLocalItems);
        setPendingDeletes(newDeletes);
    };

    const handleUpdateCategory = (index: number, newCategory: string) => {
        const item = localItems[index];
        const key = getItemKey(item);

        const newUpdates = new Map(pendingCategoryUpdates);
        newUpdates.set(key, newCategory);
        setPendingCategoryUpdates(newUpdates);

        const newLocalItems = [...localItems];
        newLocalItems[index] = { ...item, category: newCategory };
        setLocalItems(newLocalItems);
    };

    const handleReset = () => {
        setLocalItems([...items]);
        setSelectedIndices(new Set());
        setPendingDeletes(new Set());
        setPendingCategoryUpdates(new Map());
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        const operations = [];

        for (const key of pendingDeletes) {
            const [receiptId, idxStr] = key.split('-');
            operations.push({
                receiptId,
                itemIndex: parseInt(idxStr),
                action: 'delete' as const
            });
        }

        for (const [key, category] of pendingCategoryUpdates) {
            if (pendingDeletes.has(key)) continue;
            const [receiptId, idxStr] = key.split('-');
            operations.push({
                receiptId,
                itemIndex: parseInt(idxStr),
                action: 'update_category' as const,
                data: { category }
            });
        }

        try {
            const result = await batchUpdateItems(operations, user.uid);
            if (result.success) {
                toast({ title: "Updated", description: "Changes saved successfully." });
                onOpenChange(false);
            } else {
                toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!category) return null;

    const currentTotal = localItems.reduce((sum, i) => sum + i.price, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-4xl !h-[90vh] !max-h-[95vh] flex flex-col p-0 overflow-hidden gap-0">
                <div className="p-6 pb-4 pr-12 border-b bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Tag className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {category}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 mt-1">
                                    {localItems.length} items remaining
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Spent</div>
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                ${currentTotal.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950">
                    <div className="flex items-center justify-between px-6 py-2 border-b h-12 bg-white dark:bg-slate-950">
                        <div className="flex items-center gap-2">
                            {selectedIndices.size > 0 ? (
                                <>
                                    <span className="text-sm text-slate-500">{selectedIndices.size} selected</span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-7"
                                        onClick={handleDeleteSelected}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                                    </Button>
                                </>
                            ) : (
                                <span className="text-sm text-slate-400">Select items to edit</span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 relative overflow-hidden">
                        <ScrollArea className="h-full w-full">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
                                    <TableRow className="hover:bg-transparent border-b-slate-100 dark:border-b-slate-800">
                                        <TableHead className="w-[40px] pl-6">
                                            <Checkbox
                                                checked={localItems.length > 0 && selectedIndices.size === localItems.length}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="w-[120px] py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</TableHead>
                                        <TableHead className="w-[200px] py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Store</TableHead>
                                        <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Item</TableHead>
                                        <TableHead className="text-right pr-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Price</TableHead>
                                        <TableHead className="w-[80px] py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localItems.map((item, index) => (
                                        <TableRow key={index} className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 border-b-slate-50 dark:border-b-slate-900 group ${selectedIndices.has(index) ? "bg-slate-50 dark:bg-slate-800/50" : ""}`}>
                                            <TableCell className="pl-6">
                                                <Checkbox
                                                    checked={selectedIndices.has(index)}
                                                    onCheckedChange={() => handleToggleSelect(index)}
                                                />
                                            </TableCell>
                                            <TableCell className="py-4 text-slate-500 font-medium tabular-nums text-sm">
                                                {item.date}
                                            </TableCell>
                                            <TableCell className="py-4 font-medium text-slate-900 dark:text-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-3 w-3 text-slate-400" />
                                                    {item.store}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {item.name}
                                                    </span>
                                                    {item.quantity > 1 && (
                                                        <Badge variant="outline" className="w-fit mt-1 h-5 text-[10px] px-1 text-slate-500 border-slate-200">
                                                            Qty: {item.quantity}
                                                        </Badge>
                                                    )}
                                                    {pendingCategoryUpdates.has(getItemKey(item)) && (
                                                        <span className="text-[10px] text-amber-600 font-medium">New Category: {item.category}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 py-4 text-right font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                                ${item.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 overflow-y-auto max-h-[300px]">
                                                            <DropdownMenuLabel>Change Category</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {categories.map((cat) => (
                                                                <DropdownMenuItem
                                                                    key={cat}
                                                                    onClick={() => handleUpdateCategory(index, cat)}
                                                                >
                                                                    {cat}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={() => handleDeleteSingle(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
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
        </Dialog >
    );
}
