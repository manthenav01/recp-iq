import { Suspense } from "react";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { adminDb } from "@/lib/firebase-admin";
import { Receipt } from "@/lib/schemas";
// import { ReceiptDataGrid } from "@/components/receipt-data-grid"; 

// Temporary Grid Component directly here for speed, can refactor later
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

async function ReceiptList() {
    // Fetch data using Admin SDK
    // Note: In a real app we'd filter by user ID. 
    // Since this component is a generic Server Component, we need the current user ID. 
    // Usually we get it from session cookies if using Firebase Auth with Cookies (session management), 
    // OR we can't easily get it here without using 'firebase-admin' based cookie verification.
    // FOR MVP: I will fetch ALL receipts for now, assuming single user or filtered by client if data is small? 
    // Actually, passing User ID to Server Component in Next.js with Firebase client-side auth is tricky.
    // STRATEGY: 
    // 1. Fetch data on CLIENT side (easiest for Firebase Client Auth).
    // 2. OR use cookies. 
    // Given the constraints and "Plan with me" speed, I will use CLIENT SIDE fetching for the dashboard list.
    // It is safer. So I will convert the list part to a Client Component.

    return null;
}

// Switching strategy: Dashboard Page will be Client Component or contain a Client Component for the list.
// I'll make a `components/dashboard-view.tsx` client component.

import { DashboardView } from "@/components/dashboard-view";

export default function DashboardPage() {
    return <DashboardView />;
}
