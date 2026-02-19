import { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const getInitialOpen = () => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/sidebar:state=(\w+)/);
      return match ? match[1] === "true" : true;
    }
    return true;
  };

  return (
    <SidebarProvider defaultOpen={getInitialOpen()}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background">
          <div className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4">
            <SidebarTrigger />
          </div>
          <div className="p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
