"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState, KeyboardEvent } from "react";

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Search items, stores..." }: SearchBarProps) {
    const [query, setQuery] = useState("");

    const handleSearch = () => {
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const clearSearch = () => {
        setQuery("");
        onSearch(""); // Reset
    };

    return (
        <div className="relative w-full max-w-sm flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="pl-9 pr-9 bg-white dark:bg-slate-900"
            />
            {query && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 h-full w-9 hover:bg-transparent"
                    onClick={clearSearch}
                >
                    <X className="h-4 w-4 text-slate-400" />
                </Button>
            )}
        </div>
    );
}
