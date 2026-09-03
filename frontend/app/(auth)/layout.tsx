import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-stone-50">
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative bg-white">
        <div className="absolute top-8 left-8 sm:left-12">
           <Link href="/" className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
             <ArrowLeft className="w-4 h-4" /> Back to Home
           </Link>
        </div>
        <div className="w-full max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold font-serif italic">
              S
            </div>
            <span className="font-serif font-semibold text-xl tracking-tight">Samvad</span>
          </div>
          {children}
        </div>
      </div>
      <div className="hidden lg:flex flex-col justify-center items-center relative overflow-hidden bg-zinc-950 p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-rose-500/20 mix-blend-overlay"></div>
        <div className="relative z-10 text-center max-w-lg">
           <h2 className="text-white font-serif text-4xl mb-6">Conversations without barriers.</h2>
           <p className="text-zinc-400 text-lg">Join the community and experience real-time sign language translation in your meetings.</p>
        </div>
      </div>
    </div>
  );
}
