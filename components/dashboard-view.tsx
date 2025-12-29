"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Receipt } from "@/lib/schemas";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, DollarSign, Store, ShoppingBag } from "lucide-react";
import { format, subMonths, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export function DashboardView() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [receipts, setReceipts] = useState<(Receipt & { id: string })[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
    const [isUploadOpen, setIsUploadOpen] = useState(false);

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

    useEffect(() => {
        if (!user) return;

        // Filter by User ID
        // Note: We could also filter by yearMonth field in the query, but client side filtering 
        // is fine for this scale and allows for smooth transitions.
        const q = query(
            collection(db, "receipts"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as (Receipt & { id: string })[];
            setReceipts(data);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredReceipts = receipts.filter(r => r.date.startsWith(selectedMonth));
    const totalSpent = filteredReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

    if (loading || !user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Top Navigation */}
            <header className="px-6 h-16 flex items-center border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-lg flex items-center justify-center text-white text-sm">R</div>
                    RecpIQ
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="text-sm text-slate-500 hidden sm:block">
                        {user.email}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => auth.signOut?.()}>Sign Out</Button>
                </div>
            </header>

            <main className="container py-8 px-4 md:px-6 space-y-8">

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-slate-500 dark:text-slate-400">Overview of your expenses.</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
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

                        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                                    <Plus className="mr-2 h-4 w-4" /> New Receipt
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
                </div>

                {/* Info Cards */}
                <div className="grid gap-4 md:grid-cols-3">
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
                </div>

                {/* Data Grid */}
                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Store</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReceipts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No receipts found for this month.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReceipts.map((receipt) => (
                                    <TableRow key={receipt.id}>
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
                                            <div className="max-w-[300px] truncate text-slate-500 text-sm">
                                                {receipt.items.map(i => i.name).join(", ")}
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
            </main>
        </div>
    );
}

// Helper to fix auth import usage in code if needed
import { auth } from "@/lib/firebase";
import { FileText } from "lucide-react";
