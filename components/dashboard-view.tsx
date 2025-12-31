"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase"; // Combined auth import
import { useAuth } from "@/components/auth-provider";
import { Receipt } from "@/lib/schemas";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, DollarSign, Store, ShoppingBag, ArrowLeft, Loader2, Trash2, FileText, ArrowUpDown, ShoppingCart, Utensils, Car, Zap, Shirt, Home, Heart, Smartphone, Film, Tag, Leaf, Droplet, Flame, Cake, Package, Snowflake, Coffee, Cookie, Sparkles, Baby, Star, Hexagon, Circle, Square, Dna, Briefcase, Gamepad2, LayoutGrid } from "lucide-react"; // Combined icons
import { format, subMonths, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ReceiptDetailsDialog } from "@/components/receipt-details-dialog";
import { CategoryDetailsDialog } from "@/components/category-details-dialog";
import { SearchBar } from "@/components/search-bar";
import { searchReceipts } from "@/app/actions/search-receipts";
import { deleteReceipt } from "@/app/actions/delete-receipt";
import { useToast } from "@/components/ui/use-toast";
import { useReceipts } from "@/hooks/use-receipts";
import { getCategoryStyle } from "@/lib/category-utils";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ImagePreviewDialog } from "@/components/image-preview-dialog";

export function DashboardView() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const { receipts, loading: receiptsLoading } = useReceipts(user);

    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [viewReceipt, setViewReceipt] = useState<(Receipt & { id: string }) | null>(null);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedStore, setSelectedStore] = useState<string | null>(null);

    // Loading State
    const loading = authLoading || receiptsLoading;

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<(Receipt & { id: string })[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMode, setSearchMode] = useState(false);

    // Generate last 12 months for filter
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(new Date(), i);
        return {
            value: format(d, "yyyy-MM"),
            label: format(d, "MMMM yyyy"),
        };
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const handleSearch = async (query: string) => {
        if (!query) {
            setSearchMode(false);
            setSearchResults([]);
            return;
        }

        if (!user) return;

        setSearchMode(true);
        setIsSearching(true);
        setSearchQuery(query);

        const result = await searchReceipts(query, user.uid);
        if (result.success && result.data) {
            setSearchResults(result.data as (Receipt & { id: string })[]);
        }
        setIsSearching(false);
    };

    const handleBackToDashboard = () => {
        setSearchMode(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleDeleteReceipt = async (receiptId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (!user) return;
        if (!confirm("Are you sure you want to delete this entire receipt?")) return;

        try {
            await deleteReceipt(receiptId, user.uid);
            toast({ title: "Receipt deleted", description: "The receipt has been permanently removed." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to delete receipt.", variant: "destructive" });
        }
    };


    const filteredReceipts = receipts.filter(r => {
        const matchesMonth = r.date.startsWith(selectedMonth);
        const matchesStore = selectedStore ? r.storeName === selectedStore : true;
        return matchesMonth && matchesStore;
    });

    // Sorting Logic
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedReceipts = [...filteredReceipts].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        // Define values for custom sort keys
        let aValue: any = a[key as keyof typeof a];
        let bValue: any = b[key as keyof typeof b];

        // Specific handling for complex or non-string fields
        if (key === 'items') {
            aValue = a.items.length;
            bValue = b.items.length;
        } else if (key === 'totalAmount') {
            aValue = a.totalAmount;
            bValue = b.totalAmount;
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalSpent = filteredReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

    // Stats Logic
    interface CategoryItem {
        name: string;
        price: number;
        quantity: number;
        store: string;
        date: string;
        originalReceiptId: string;
        category: string;
        itemIndex: number; // For deletion/update API
    }

    // Aggregate items by category and store
    const itemsByCategory: Record<string, CategoryItem[]> = {};
    const categoryTotals: Record<string, number> = {};
    const storeTotals: Record<string, number> = {};

    filteredReceipts.forEach(r => {
        // Store Totals
        storeTotals[r.storeName] = (storeTotals[r.storeName] || 0) + r.totalAmount;

        if (r.items && r.items.length > 0) {
            r.items.forEach((item, idx) => {
                const cat = item.category || "Other";
                // Update totals
                categoryTotals[cat] = (categoryTotals[cat] || 0) + item.price;

                // Add to detailed list
                if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
                itemsByCategory[cat].push({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity || 1,
                    store: r.storeName,
                    date: r.date,
                    originalReceiptId: r.id,
                    category: cat,
                    itemIndex: idx
                });
            });
        } else {
            // Fallback for receipts without items
            const cat = r.category || "Other";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + r.totalAmount;
        }
    });

    // Find top item
    const allItems = filteredReceipts.flatMap(r => r.items.map(i => ({ ...i, store: r.storeName, date: r.date })));
    const topItem = allItems.sort((a, b) => b.price - a.price)[0];

    if (loading || !user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="w-full py-8 px-6 space-y-8">
                <Breadcrumbs />
                {/* Search Bar & Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {!searchMode ? (
                        <>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                                <p className="text-slate-500 dark:text-slate-400">Overview of your expenses.</p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <SearchBar onSearch={handleSearch} />
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[240px]">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Select Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-blue-600 text-white hover:bg-blue-700">
                                            <Plus className="mr-2 h-4 w-4" /> New
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Upload Receipt</DialogTitle>
                                            <DialogDescription>
                                                Upload an image of your receipt. AI will extract the data automatically.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <UploadDropzone onUploadComplete={() => setIsUploadOpen(false)} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={handleBackToDashboard}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="flex-1">
                                    <SearchBar onSearch={handleSearch} placeholder={`Searching for "${searchQuery}"...`} />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold mb-2">Search Results</h2>
                                <p className="text-slate-500">
                                    Found {searchResults.length} receipts matching "{searchQuery}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Areas */}
                {!searchMode ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                                    <DollarSign className="h-4 w-4 text-slate-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                                    <p className="text-xs text-slate-500">for {format(parseISO(selectedMonth + "-01"), "MMMM yyyy")}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Receipts</CardTitle>
                                    <FileText className="h-4 w-4 text-slate-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{filteredReceipts.length}</div>
                                    <p className="text-xs text-slate-500">processed this month</p>
                                </CardContent>
                            </Card>
                            <Card className="md:col-span-2 lg:col-span-2 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Top Purchase Item</CardTitle>
                                    <ShoppingBag className="h-4 w-4 text-slate-500" />
                                </CardHeader>
                                <CardContent>
                                    {topItem ? (
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1 flex-1 min-w-0 pr-4">
                                                <div className="text-2xl font-bold truncate text-slate-900 dark:text-white" title={topItem.name}>
                                                    {topItem.name}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Store className="h-3 w-3" /> {topItem.store}
                                                    <span>•</span>
                                                    {topItem.date}
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold text-slate-900 dark:text-white whitespace-nowrap">${topItem.price.toFixed(2)}</div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 text-sm italic">No items found</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Category Breakdown */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1 cursor-pointer" onClick={() => router.push('/categories')}>
                                        <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                                            Category Breakdown
                                        </CardTitle>
                                    </div>
                                    <Button variant="ghost" size="sm" className="hidden sm:flex text-xs h-7" onClick={() => router.push('/categories')}>
                                        View All
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    {Object.entries(categoryTotals)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 5)
                                        .map(([cat, amount]) => {
                                            const style = getCategoryStyle(cat);

                                            return (
                                                <div
                                                    key={cat}
                                                    className="space-y-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-md transition-colors"
                                                    onClick={() => router.push(`/categories?category=${encodeURIComponent(cat)}`)}
                                                >
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className={style.color}>{style.icon}</span>
                                                            <span className="font-medium">{cat}</span>
                                                        </div>
                                                        <span className="text-slate-500">${amount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${style.bg} opacity-80`}
                                                            style={{ width: `${Math.min(100, (amount / totalSpent) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {Object.keys(categoryTotals).length === 0 && (
                                        <p className="text-sm text-center text-slate-500 py-4">No data available</p>
                                    )}
                                    {Object.keys(categoryTotals).length > 5 && (
                                        <div className="pt-2 text-center">
                                            <Button variant="link" size="sm" className="text-xs text-slate-500" onClick={() => router.push('/categories')}>
                                                + {Object.keys(categoryTotals).length - 5} more categories
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Top Stores */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Top Stores</CardTitle>
                                    {selectedStore && (
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedStore(null); }} className="h-6 text-xs">
                                            Clear Filter
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Object.entries(storeTotals).sort(([, a], [, b]) => b - a).slice(0, 6).map(([store, amount]) => (
                                        <div
                                            key={store}
                                            className={cn(
                                                "space-y-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-md transition-colors",
                                                selectedStore === store && "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                                            )}
                                            onClick={() => setSelectedStore(selectedStore === store ? null : store)}
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-slate-400" />
                                                    <span className="font-medium">{store}</span>
                                                </div>
                                                <span className="text-slate-500">${amount.toFixed(2)}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-violet-500 rounded-full"
                                                    style={{ width: `${Math.min(100, (amount / totalSpent) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(storeTotals).length === 0 && (
                                        <p className="text-sm text-center text-slate-500 py-4">No data available</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Receipts Table - Full Width */}
                        <div className="grid gap-4">
                            <Card className="overflow-hidden">
                                <CardHeader>
                                    <CardTitle>Receipts</CardTitle>
                                </CardHeader>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                <Button variant="ghost" className="-ml-4 h-8 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-900" onClick={() => handleSort('date')}>
                                                    Date
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button variant="ghost" className="-ml-4 h-8 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-900" onClick={() => handleSort('storeName')}>
                                                    Store
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button variant="ghost" className="-ml-4 h-8 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-900" onClick={() => handleSort('category')}>
                                                    Category
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                </Button>
                                            </TableHead>
                                            <TableHead>
                                                <Button variant="ghost" className="-ml-4 h-8 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-900" onClick={() => handleSort('items')}>
                                                    Items
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-right">
                                                <Button variant="ghost" className="-mr-4 h-8 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-900" onClick={() => handleSort('totalAmount')}>
                                                    Amount
                                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                                </Button>
                                            </TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedReceipts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center">
                                                    No receipts found for this month.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            sortedReceipts.map((receipt) => (
                                                <TableRow
                                                    key={receipt.id}
                                                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                                    onClick={() => setViewReceipt(receipt)}
                                                >
                                                    <TableCell>{receipt.date}</TableCell>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        <Store className="h-4 w-4 text-slate-400" />
                                                        {receipt.storeName}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {receipt.category}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-[200px] truncate text-slate-500 text-sm">
                                                            {receipt.items.length} items ({receipt.items.map(i => i.name).slice(0, 2).join(", ")}...)
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        ${receipt.totalAmount.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-1">
                                                            {receipt.imageUrl && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                    onClick={(e) => { e.stopPropagation(); setViewImage(receipt.imageUrl || null); }}
                                                                    title="View Original Receipt"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                onClick={(e) => handleDeleteReceipt(receipt.id, e)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    </>
                ) : (
                    /* Search Results View */
                    <Card className="overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Store</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Matched Items</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isSearching ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                            Searching...
                                        </TableCell>
                                    </TableRow>
                                ) : searchResults.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                            No receipts found matching "{searchQuery}".
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    searchResults.map((receipt) => (
                                        <TableRow
                                            key={receipt.id}
                                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                                            onClick={() => setViewReceipt(receipt)}
                                        >
                                            <TableCell>{receipt.date}</TableCell>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <Store className="h-4 w-4 text-slate-400" />
                                                {receipt.storeName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {receipt.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] text-sm">
                                                    {/* Highlight matching items if any */}
                                                    {receipt.items.filter(i =>
                                                        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    ).map(i => (
                                                        <span key={i.name} className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded mr-1">
                                                            {i.name}
                                                        </span>
                                                    ))}
                                                    {/* If match was on store name, just show count */}
                                                    {receipt.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) ? null : (
                                                        <span className="text-slate-500">{receipt.items.length} items</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                ${receipt.totalAmount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                )}

            </main>

            <ReceiptDetailsDialog
                open={!!viewReceipt}
                onOpenChange={(open) => !open && setViewReceipt(null)}
                receipt={viewReceipt}
            />

            <CategoryDetailsDialog
                open={!!selectedCategory}
                onOpenChange={(open) => !open && setSelectedCategory(null)}
                category={selectedCategory}
                items={selectedCategory ? itemsByCategory[selectedCategory] || [] : []}
                totalAmount={selectedCategory ? categoryTotals[selectedCategory] || 0 : 0}
            />

            <ImagePreviewDialog
                open={!!viewImage}
                onOpenChange={(open) => !open && setViewImage(null)}
                imageUrl={viewImage}
            />
        </div>
    );
}
