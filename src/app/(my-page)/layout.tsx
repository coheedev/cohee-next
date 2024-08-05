import { Sidebar } from "./sidebar";

export default function MyPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex w-full flex-1">
      <Sidebar />
      <div className="flex-1 px-6 py-4">{children}</div>
    </main>
  );
}
