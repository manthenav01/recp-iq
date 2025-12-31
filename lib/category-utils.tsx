import { ShoppingCart, Utensils, Car, Zap, Shirt, Home, Heart, Smartphone, Film, Tag, Leaf, Droplet, Flame, Cake, Package, Snowflake, Coffee, Cookie, Sparkles, Baby, Star, Hexagon, Circle, Square, Dna, Briefcase, Gamepad2, LayoutGrid, ShoppingBag } from "lucide-react";
import React from 'react';

// Robust Icon Mapping & Hashing
export const getCategoryStyle = (category: string) => {
    const c = category.toLowerCase().trim();

    // 1. Predefined Mapping (18 Categories)
    if (c.includes('grocer')) return { icon: <ShoppingCart className="h-4 w-4" />, color: "text-emerald-500", bg: "bg-emerald-500" };
    if (c.includes('produce') || c.includes('fruit') || c.includes('veg')) return { icon: <Leaf className="h-4 w-4" />, color: "text-green-500", bg: "bg-green-500" };
    if (c.includes('dairy') || c.includes('milk')) return { icon: <Droplet className="h-4 w-4" />, color: "text-cyan-500", bg: "bg-cyan-500" };
    if (c.includes('meat') || c.includes('beef') || c.includes('chic')) return { icon: <Flame className="h-4 w-4" />, color: "text-red-500", bg: "bg-red-500" };
    if (c.includes('bakery') || c.includes('bread')) return { icon: <Cake className="h-4 w-4" />, color: "text-orange-400", bg: "bg-orange-400" };
    if (c.includes('pantry') || c.includes('canned')) return { icon: <Package className="h-4 w-4" />, color: "text-amber-500", bg: "bg-amber-500" };
    if (c.includes('frozen') || c.includes('ice')) return { icon: <Snowflake className="h-4 w-4" />, color: "text-blue-400", bg: "bg-blue-400" };
    if (c.includes('beverage') || c.includes('drink') || c.includes('coffee')) return { icon: <Coffee className="h-4 w-4" />, color: "text-teal-500", bg: "bg-teal-500" };
    if (c.includes('snack') || c.includes('chip')) return { icon: <Cookie className="h-4 w-4" />, color: "text-orange-500", bg: "bg-orange-500" };
    if (c.includes('household') || c.includes('clean')) return { icon: <Home className="h-4 w-4" />, color: "text-indigo-500", bg: "bg-indigo-500" };
    if (c.includes('health') || c.includes('pharm')) return { icon: <Heart className="h-4 w-4" />, color: "text-rose-500", bg: "bg-rose-500" };
    if (c.includes('personal') || c.includes('care')) return { icon: <Sparkles className="h-4 w-4" />, color: "text-purple-500", bg: "bg-purple-500" };
    if (c.includes('cloth') || c.includes('apparel')) return { icon: <Shirt className="h-4 w-4" />, color: "text-pink-500", bg: "bg-pink-500" };
    if (c.includes('dining') || c.includes('eat') || c.includes('restaurant')) return { icon: <Utensils className="h-4 w-4" />, color: "text-orange-600", bg: "bg-orange-600" };
    if (c.includes('util') || c.includes('electric')) return { icon: <Zap className="h-4 w-4" />, color: "text-yellow-500", bg: "bg-yellow-500" };
    if (c.includes('retail') || c.includes('shop')) return { icon: <ShoppingBag className="h-4 w-4" />, color: "text-blue-600", bg: "bg-blue-600" };
    if (c.includes('kid') || c.includes('baby') || c.includes('toy')) return { icon: <Baby className="h-4 w-4" />, color: "text-sky-500", bg: "bg-sky-500" };
    if (c.includes('other') || c.includes('misc')) return { icon: <Tag className="h-4 w-4" />, color: "text-slate-400", bg: "bg-slate-400" };

    // 2. Custom Category Hashing
    // Deterministic hash to pick color and icon
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Palettes
    const colors = [
        { text: "text-indigo-500", bg: "bg-indigo-500" },
        { text: "text-pink-500", bg: "bg-pink-500" },
        { text: "text-violet-500", bg: "bg-violet-500" },
        { text: "text-fuchsia-500", bg: "bg-fuchsia-500" },
        { text: "text-cyan-500", bg: "bg-cyan-500" },
        { text: "text-emerald-500", bg: "bg-emerald-500" },
    ];

    const Icons = [Star, Hexagon, Circle, Square, Dna, Briefcase, Gamepad2, LayoutGrid];

    const colorIndex = Math.abs(hash) % colors.length;
    const iconIndex = Math.abs(hash) % Icons.length;
    const SelectedIcon = Icons[iconIndex];

    return {
        icon: <SelectedIcon className="h-4 w-4" />,
        color: colors[colorIndex].text,
        bg: colors[colorIndex].bg
    };
};
