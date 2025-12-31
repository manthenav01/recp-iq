"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ className }: { className?: string }) {
    const pathname = usePathname();
    const router = useRouter();

    if (pathname === "/dashboard") return null;

    const paths = pathname.split("/").filter(Boolean);

    return (
        <nav className={cn("flex items-center space-x-2 text-sm text-slate-500 mb-6", className)}>
            <button
                onClick={() => router.push("/dashboard")}
                className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center"
            >
                <Home className="h-4 w-4" />
            </button>

            {paths.map((path, index) => {
                const href = `/${paths.slice(0, index + 1).join("/")}`;
                const isLast = index === paths.length - 1;

                // Capitalize
                const label = path.charAt(0).toUpperCase() + path.slice(1);

                return (
                    <div key={path} className="flex items-center">
                        <ChevronRight className="h-4 w-4 mx-1 text-slate-400" />
                        {isLast ? (
                            <span className="font-semibold text-slate-900 dark:text-slate-100 cursor-default">
                                {label}
                            </span>
                        ) : (
                            <button
                                onClick={() => router.push(href)}
                                className="hover:text-slate-900 dark:hover:text-slate-200"
                            >
                                {label}
                            </button>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
