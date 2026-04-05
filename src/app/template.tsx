export default function AppTemplate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="page-transition-shell">{children}</div>;
}
