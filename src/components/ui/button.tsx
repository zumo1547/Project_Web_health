type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-emerald-700 text-white shadow-[0_18px_36px_-20px_rgba(4,120,87,0.7)] hover:bg-emerald-800 focus-visible:outline-emerald-700",
  secondary:
    "bg-amber-100 text-amber-950 shadow-[0_16px_32px_-24px_rgba(217,119,6,0.5)] hover:bg-amber-200 focus-visible:outline-amber-400",
  ghost:
    "bg-white/80 text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-400",
  danger:
    "bg-rose-700 text-white shadow-[0_18px_36px_-20px_rgba(190,24,93,0.6)] hover:bg-rose-800 focus-visible:outline-rose-700",
};

export function Button({
  className = "",
  variant = "primary",
  fullWidth = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`motion-button inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.35rem] px-5 py-3 text-base font-bold leading-none tracking-tight transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? "w-full" : ""} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
