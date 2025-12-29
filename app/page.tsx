import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Receipt, BarChart3, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 h-14 flex items-center border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-lg flex items-center justify-center text-white text-sm">R</div>
          RecpIQ
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Sign In
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px]" />

          <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center space-y-4">
            <div className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-sm text-slate-900 dark:text-slate-100 mb-4">
              Now with Genkit AI Support
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Turn Receipts into <br />
              Actionable Financial Insights
            </h1>
            <p className="max-w-[600px] text-slate-500 md:text-xl dark:text-slate-400 mx-auto">
              Stop manually entering data. Upload your grocery receipts and let RecpIQ&apos;s advanced AI extract, categorize, and verify your spending instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-blue-500/20 transition-all">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full">
                View Demo
              </Button>
            </div>

            {/* Visual Abstract Representation of parsing */}
            <div className="mt-16 w-full max-w-4xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden aspect-video relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 opacity-50" />
              <div className="z-10 text-slate-400 font-mono text-sm p-4">
                {`
{
  "store": "Whole Foods Market",
  "date": "2024-12-22",
  "total": 145.23,
  "items": [
    { "name": "Organic Avocados", "price": 5.99 },
    { "name": "Almond Milk", "price": 4.49 }
    ...
  ]
}
                    `}
              </div>
              {/* Floating Receipt Icon */}
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 transform -rotate-6">
                <Receipt className="w-12 h-12 text-blue-500" />
              </div>
              {/* Floating Chart Icon */}
              <div className="absolute top-1/2 right-1/4 -translate-y-1/2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 transform rotate-6">
                <BarChart3 className="w-12 h-12 text-violet-500" />
              </div>
              {/* Arrow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 dark:bg-white rounded-full p-2 z-20">
                <ArrowRight className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm text-blue-700 dark:text-blue-300">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Intelligent Receipt Processing
                </h2>
                <p className="max-w-[900px] text-slate-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-slate-400">
                  We leverage cutting-edge AI to ensure every penny is accounted for with zero manual effort.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  <Receipt className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl">Smart Parsing</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Extracts store name, date, total, and line items automatically using Google's Multimodal Gemini AI.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl">Visual Dashboard</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Track your spending month-over-month with beautiful, interactive grids and charts.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-xl">Secure Storage</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Your data is yours. Securely stored in Google Firestore and Firebase Storage with authenticated access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} RecpIQ. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-slate-500" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-slate-500" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
