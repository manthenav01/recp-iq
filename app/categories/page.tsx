import { CategoriesView } from "@/components/categories-view";
import { Suspense } from "react";

export default function CategoriesPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <CategoriesView />
        </Suspense>
    );
}
