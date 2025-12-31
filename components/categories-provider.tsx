"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";

const DEFAULT_CATEGORIES = [
    "Groceries", "Produce", "Dairy", "Meat", "Bakery", "Pantry", "Frozen",
    "Beverages", "Snacks", "Household", "Health", "Personal Care", "Clothing",
    "Dining", "Utilities", "Retail", "Other"
];

interface CategoriesContextType {
    categories: string[];
    addCategory: (category: string) => Promise<void>;
    loading: boolean;
}

const CategoriesContext = createContext<CategoriesContextType>({
    categories: [],
    addCategory: async () => { },
    loading: true,
});

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setCategories([]);
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, "users", user.uid);

        const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.categories && Array.isArray(data.categories)) {
                    setCategories(data.categories.sort());
                } else {
                    // If exists but no categories, set defaults
                    await setDoc(userDocRef, { categories: DEFAULT_CATEGORIES }, { merge: true });
                }
            } else {
                // Initialize new user doc with defaults
                await setDoc(userDocRef, { categories: DEFAULT_CATEGORIES }, { merge: true });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCategory = async (category: string) => {
        if (!user) return;
        // Prevent duplicates (case-insensitive check locally, but DB is source of truth)
        if (categories.some(c => c.toLowerCase() === category.toLowerCase())) return;

        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                categories: arrayUnion(category)
            });
        } catch (error) {
            console.error("Failed to add category:", error);
        }
    };

    return (
        <CategoriesContext.Provider value={{ categories, addCategory, loading }}>
            {children}
        </CategoriesContext.Provider>
    );
}

export const useCategories = () => useContext(CategoriesContext);
