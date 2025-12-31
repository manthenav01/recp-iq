import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Receipt } from "@/lib/schemas";
import { User } from "firebase/auth";

export function useReceipts(user: User | null) {
    const [receipts, setReceipts] = useState<(Receipt & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
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
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { receipts, loading };
}
