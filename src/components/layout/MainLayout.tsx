import { CSSProperties, ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-frame min-h-screen bg-background" style={{ '--sidebar-width': collapsed ? '4.25rem' : '15rem' } as CSSProperties}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="app-content min-h-screen" style={{ paddingLeft: collapsed ? '4.25rem' : '15rem' }}>
        <Header />
        <main className="page-shell px-5 py-7 md:px-8 md:py-9 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
