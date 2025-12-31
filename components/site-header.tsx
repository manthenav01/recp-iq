"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";

export function SiteHeader() {
    const { user, loading } = useAuth();

    // Don't show header if loading or not logged in
    // This assumes specific routes will handle redirection (like /login)
    // or that we only want this on authenticated pages.
    // Given the requirement "top header will always stay", we might want to show it 
    // even if not logged in (maybe with just title?) but existing logic checked for user.
    // For now, let's keep it consistent: show if user exists.
    if (loading || !user) return null;

    return (
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
    );
}
