"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px]" />

            <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-slate-950/50 backdrop-blur-xl ring-1 ring-slate-900/5 dark:ring-slate-50/10">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <span className="text-white font-bold text-xl">R</span>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Sign in to your RecpIQ account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full h-11 relative"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                        )}
                        Sign in with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-slate-950 px-2 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-xs text-center text-slate-500">
                        By clicking continue, you agree to our <a href="#" className="underline hover:text-slate-900">Terms of Service</a> and <a href="#" className="underline hover:text-slate-900">Privacy Policy</a>.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
