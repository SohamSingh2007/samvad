export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-white text-stone-900 selection:bg-stone-900 selection:text-white lg:overflow-hidden">
      {children}
    </div>
  );
}
