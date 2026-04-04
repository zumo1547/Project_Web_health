type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)] backdrop-blur-sm sm:p-7 ${className}`}
      {...props}
    />
  );
}

export function CardTitle({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-[1.45rem] font-extrabold tracking-tight text-slate-950 sm:text-[1.65rem] ${className}`}
      {...props}
    />
  );
}

export function CardDescription({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-[1rem] leading-7 text-slate-600 sm:text-[1.02rem] ${className}`}
      {...props}
    />
  );
}
