"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useReceipts } from "@/hooks/use-receipts";
import { getCategoryStyle } from "@/lib/category-utils";
import { format, subMonths, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, Store, Trash2, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { deleteReceipt } from "@/app/actions/delete-receipt";
import { ReceiptDetailsDialog } from "@/components/receipt-details-dialog";
import { ItemHistorySheet } from "@/components/item-history-sheet";
import { Receipt } from "@/lib/schemas";
import { useToast } from "@/components/ui/use-toast";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { cn } from "@/lib/utils";

export function CategoriesView() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { receipts, loading: receiptsLoading } = useReceipts(user);
    const { toast } = useToast();

    // State
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
    const [viewReceipt, setViewReceipt] = useState<(Receipt & { id: string }) | null>(null);
    const [selectedItemHistory, setSelectedItemHistory] = useState<{ name: string; genericName?: string } | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // URL Param Sync
    const selectedCategory = searchParams.get('category'); // Read only. Use router.push to change.

    // Auth Check
    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    // Data Processing
    // 1. Filter by Month
    const filteredByMonth = receipts.filter(r => r.date.startsWith(selectedMonth));

    // 2. Aggregate Categories & Items
    const categoryData: Record<string, {
        total: number, items: Array<{
            name: string;
            genericName?: string;
            price: number;
            quantity?: number;
            receiptDate: string;
            receiptStore: string;
            receiptId: string;
            originalReceipt: Receipt & { id: string };
        }>
    }> = {};

    const totalSpent = filteredByMonth.reduce((sum, r) => sum + r.totalAmount, 0);

    filteredByMonth.forEach(r => {
        if (r.items && r.items.length > 0) {
            r.items.forEach(item => {
                const cat = item.category || "Other";
                if (!categoryData[cat]) categoryData[cat] = { total: 0, items: [] };

                categoryData[cat].total += item.price;
                categoryData[cat].items.push({
                    name: item.name,
                    genericName: item.genericName,
                    price: item.price,
                    quantity: item.quantity,
                    receiptDate: r.date,
                    receiptStore: r.storeName,
                    receiptId: r.id,
                    originalReceipt: r
                });
            });
        } else {
            // Receipt has no items, treat the whole receipt as an item in its category
            const cat = r.category || "Other";
            if (!categoryData[cat]) categoryData[cat] = { total: 0, items: [] };

            categoryData[cat].total += r.totalAmount;
            categoryData[cat].items.push({
                name: "Receipt Total (No Items)",
                genericName: undefined,
                price: r.totalAmount,
                quantity: 1,
                receiptDate: r.date,
                receiptStore: r.storeName,
                receiptId: r.id,
                originalReceipt: r
            });
        }
    });

    const months = Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), i);
        return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
    });


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="w-full py-8 px-6 space-y-8">
                <Breadcrumbs />
                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Manage and view receipts by category.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select
                            value={selectedCategory || "all"}
                            onValueChange={(val) => router.push(val === "all" ? "/categories" : `/categories?category=${encodeURIComponent(val)}`)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {Object.keys(categoryData).sort().map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />

                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[180px]">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Categories List (Accordions) */}
                <div className="space-y-4">
                    {/* If selectedCategory is set, show only that ONE, otherwise show ALL */}
                    {Object.entries(categoryData)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .filter(([cat]) => !selectedCategory || cat === selectedCategory)
                        .map(([cat, data]) => {
                            const style = getCategoryStyle(cat);

                            return (
                                <CategoryAccordionItem
                                    key={cat}
                                    category={cat}
                                    amount={data.total}
                                    totalSpent={totalSpent}
                                    style={style}
                                    items={data.items}
                                    isExpanded={selectedCategory === cat}
                                    onToggle={() => { }}
                                    onViewReceipt={setViewReceipt}
                                    onViewItemHistory={(item) => setSelectedItemHistory({ name: item.name, genericName: item.genericName })}
                                />
                            );
                        })}

                    {Object.keys(categoryData).length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No categories found for this month.
                        </div>
                    )}
                </div>
            </main>

            <ReceiptDetailsDialog
                open={!!viewReceipt}
                onOpenChange={(open) => !open && setViewReceipt(null)}
                receipt={viewReceipt}
            />

            <ItemHistorySheet
                isOpen={!!selectedItemHistory}
                onClose={() => setSelectedItemHistory(null)}
                itemName={selectedItemHistory?.name || null}
                genericName={selectedItemHistory?.genericName}
                allReceipts={receipts}
            />
        </div>
    );
}

function CategoryAccordionItem({
    category,
    amount,
    totalSpent,
    style,
    items,
    isExpanded: initialExpanded,
    onToggle,
    onViewReceipt,
    onViewItemHistory
}: {
    category: string,
    amount: number,
    totalSpent: number,
    style: any,
    items: Array<{
        name: string;
        price: number;
        quantity?: number;
        receiptDate: string;
        receiptStore: string;
        receiptId: string;
        originalReceipt: Receipt & { id: string };
        genericName?: string;
    }>,
    isExpanded: boolean,
    onToggle: () => void,
    onViewReceipt: (r: any) => void,
    onViewItemHistory: (item: { name: string, genericName?: string }) => void
}) {
    const [isOpen, setIsOpen] = useState(initialExpanded);

    // Sync with parent prop if it changes (for URL handling)
    useEffect(() => {
        setIsOpen(initialExpanded);
    }, [initialExpanded]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        onToggle();
    };

    // Calculate top 3 items by price
    const topItems = [...items]
        .sort((a, b) => b.price - a.price)
        .slice(0, 3)
        .map(i => i.name)
        .join(", ");

    return (
        <Card className="overflow-hidden transition-all duration-200">
            <div
                className={cn(
                    "grid grid-cols-[auto_1fr_auto] items-center gap-4 p-3 pr-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors",
                    isOpen && "bg-slate-50 dark:bg-slate-900/50",
                    "sm:gap-6"
                )}
                onClick={handleToggle}
            >
                {/* Left: Icon & Name */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-[200px]">
                    <div className={style.color}>
                        {style.icon}
                    </div>
                    <div>
                        <div className="font-semibold text-base sm:text-lg">{category}</div>
                        <div className="text-xs sm:text-sm text-slate-500">
                            {items.length} items • {((amount / totalSpent) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Middle: Top Items Preview (Hidden on small screens) */}
                <div className="hidden md:block text-sm text-slate-400 truncate px-4">
                    {items.length > 0 && (
                        <span>
                            <span className="font-medium text-slate-500">Top: </span>
                            {topItems}
                            {items.length > 3 && "..."}
                        </span>
                    )}
                </div>

                {/* Right: Amount & Chart */}
                <div className="flex items-center gap-4 sm:gap-6 ml-auto">
                    <div className="text-right">
                        <div className="font-bold text-base sm:text-lg">${amount.toFixed(2)}</div>
                        <div className="w-16 sm:w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 ml-auto">
                            <div
                                className="h-full bg-slate-900 dark:bg-slate-100"
                                style={{ width: `${Math.min(100, (amount / totalSpent) * 100)}%` }}
                            />
                        </div>
                    </div>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
            </div>

            {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-900/20">
                                <TableHead className="w-[100px]">Date</TableHead>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Store</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, idx) => (
                                <TableRow
                                    key={`${item.receiptId}-${idx}`}
                                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                    onClick={(e) => { e.stopPropagation(); onViewItemHistory(item); }}
                                >
                                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{item.receiptDate}</TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-200">
                                        {item.name}
                                    </TableCell>
                                    <TableCell className="font-medium text-xs">
                                        <div className="flex items-center gap-2">
                                            <Store className="h-3 w-3 text-slate-400" />
                                            {item.receiptStore}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        {item.quantity && item.quantity > 1 ? `x${item.quantity}` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        ${item.price.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </Card>
    );
}
