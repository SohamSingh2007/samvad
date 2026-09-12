export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 selection:bg-stone-900 selection:text-white dark:selection:bg-stone-100 dark:selection:text-stone-900 lg:overflow-hidden transition-colors duration-200 bg-dot-grid">
      {children}
    </div>
  );
}
