import Link from "next/link";
import { ArrowRight, Play, CheckCircle2, Mic, Ear, MessageSquare, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-serif italic">
              S
            </div>
            <span className="font-serif font-semibold text-xl tracking-tight">Samvad</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-zinc-950 text-white overflow-hidden py-24 lg:py-32">
          <div className="container mx-auto px-4 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="font-serif text-5xl lg:text-7xl leading-[1.1] tracking-tight mb-6">
                Every Sign, <span className="italic text-zinc-300">Heard.</span>
              </h1>
              <p className="text-lg lg:text-xl text-zinc-400 mb-8 max-w-lg leading-relaxed">
                Experience seamless video conferencing with real-time sign language recognition, text-to-speech, and live captions. Because conversations shouldn't have barriers.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/signup" className="flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="flex items-center gap-2 bg-transparent border border-zinc-700 text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors">
                  <Play className="w-4 h-4" /> Watch Demo
                </button>
              </div>
            </div>
            {/* Abstract visual/mockup for hero right side */}
            <div className="relative aspect-square lg:aspect-auto lg:h-[600px] w-full bg-zinc-900 rounded-[2rem] border border-zinc-800 shadow-2xl overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 mix-blend-overlay"></div>
               <div className="flex flex-col gap-4 w-3/4">
                 <div className="bg-zinc-800/50 backdrop-blur-sm p-4 rounded-2xl border border-zinc-700/50">
                    <p className="text-zinc-300 font-medium text-sm">Sign detected: <span className="text-blue-400">"Hello, everyone"</span></p>
                 </div>
                 <div className="bg-zinc-800/50 backdrop-blur-sm p-4 rounded-2xl border border-zinc-700/50 self-end">
                    <p className="text-zinc-300 font-medium text-sm">Voice output playing...</p>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* How it Works Bento Grid */}
        <section id="how-it-works" className="py-24 bg-stone-50">
          <div className="container mx-auto px-4">
            <div className="mb-16">
              <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Phases</span>
              <h2 className="font-serif text-4xl lg:text-5xl mt-4">How it works</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: "01", title: "Sign Detection", desc: "Advanced AI tracks hand gestures in real-time.", icon: Ear, active: true },
                { num: "02", title: "Live Captions", desc: "Instant text translation displayed for everyone.", icon: MessageSquare },
                { num: "03", title: "Voice Synthesis", desc: "Text is converted to natural-sounding speech.", icon: Mic },
                { num: "04", title: "Group Calls", desc: "Seamless multi-party video architecture.", icon: Users }
              ].map((step, i) => (
                <div key={i} className={`relative p-8 rounded-3xl transition-all duration-300 hover:shadow-xl ${step.active ? 'bg-blue-50 border-blue-100 shadow-lg' : 'bg-white border-stone-200 border hover:-translate-y-1'}`}>
                  <span className="absolute top-6 left-6 text-sm font-bold text-muted-foreground">{step.num}</span>
                  <div className={`mt-12 mb-6 w-12 h-12 rounded-full flex items-center justify-center ${step.active ? 'bg-blue-200 text-blue-700' : 'bg-stone-100 text-stone-600'}`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Demo Mockup */}
        <section className="py-24 bg-white overflow-hidden">
           <div className="container mx-auto px-4 text-center">
              <h2 className="font-serif text-3xl lg:text-4xl mb-16 max-w-2xl mx-auto">See conversations flow naturally.</h2>
              <div className="relative max-w-5xl mx-auto bg-stone-100 rounded-t-[2.5rem] border-t-8 border-x-8 border-stone-200 shadow-2xl h-[500px] overflow-hidden flex flex-col">
                  {/* Browser Chrome */}
                  <div className="h-12 bg-stone-200/50 flex items-center px-6 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <div className="mx-auto bg-white/60 px-24 py-1 rounded-md text-xs text-stone-500 font-medium">samvad.qixolabs.com</div>
                  </div>
                  {/* Fake UI */}
                  <div className="flex-1 bg-stone-900 p-6 flex flex-col justify-end relative">
                     <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
                        <div className="bg-stone-800 rounded-2xl border border-stone-700"></div>
                        <div className="bg-stone-800 rounded-2xl border border-stone-700"></div>
                     </div>
                     <div className="relative z-10 mx-auto bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 mb-8 max-w-2xl text-white text-lg font-medium text-center">
                        <span className="opacity-70">Sarah: </span> "I think this design looks absolutely stunning."
                     </div>
                  </div>
              </div>
           </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-rose-100 to-purple-100"></div>
          <div className="container mx-auto px-4 relative z-10 flex justify-center">
            <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[2.5rem] shadow-2xl text-center max-w-3xl w-full border border-white">
              <h2 className="font-serif text-4xl lg:text-5xl mb-4 text-stone-900">Ready to talk?</h2>
              <p className="text-stone-600 text-lg mb-8">Join the platform that is making every meeting accessible by default.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-full font-medium hover:bg-stone-800 transition-all hover:scale-105 shadow-lg">
                Create free account <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400 py-16 border-t border-stone-900">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
             <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-white font-bold font-serif italic">S</div>
              <span className="font-serif font-semibold text-xl tracking-tight text-white">Samvad</span>
            </div>
            <p className="text-sm max-w-xs">Bridging the communication gap with real-time AI sign language translation.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-16 pt-8 border-t border-stone-800 text-sm text-stone-500 flex justify-between items-center">
          <p>© 2026 Samvad Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
