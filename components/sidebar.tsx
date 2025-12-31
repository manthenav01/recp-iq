"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

const sidebarLinks = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/categories",
        label: "Categories",
        icon: Library,
    },
    // Placeholder for future Profile/Settings
    // {
    //     href: "/settings",
    //     label: "Settings",
    //     icon: Settings,
    // },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, loading } = useAuth();

    // Hide if not authenticated (similar to Header)
    if (loading || !user) return null;

    return (
        <aside className="hidden md:flex w-64 flex-col fixed left-0 top-16 bottom-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-40">
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            {/* Footer Area (Optional) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <Settings className="h-4 w-4" />
                    <span>Settings (Coming Soon)</span>
                </div>
            </div>
        </aside>
    );
}
