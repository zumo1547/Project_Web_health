export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-[3.5rem] w-full rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 ${className}`}
      {...props}
    />
  );
}
