import type { ReactNode } from "react";
import ProtectedClient from "@/components/ProtectedClient";
import SignOutButton from "@/components/SignOutButton";
import SidebarLink from "@/components/SidebarLink";
import { BarChart3, Users, Church, Handshake, Upload, LayoutDashboard, Presentation } from "lucide-react";
import TopBar from "@/components/TopBar";
import { Container } from "@/components/ui/Container";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedClient>
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>
        <aside 
          className="w-80 border-r p-7 hidden md:flex flex-col shadow-xl"
          style={{
            backgroundColor: 'var(--sidebar)',
            borderColor: 'var(--border)'
          }}
        >
          <div 
            className="text-2xl font-bold mb-8 flex items-center gap-2"
            style={{ color: 'var(--sidebar-foreground)' }}
          >
            <Church size={28} style={{ color: 'var(--sidebar-accent)' }} />
            Church Tracker
          </div>
          <nav className="space-y-2 flex-1">
            <SidebarLink href="/dashboard">
              <span className="inline-flex items-center gap-3">
                <LayoutDashboard size={18}/> Dashboard
              </span>
            </SidebarLink>
            <SidebarLink href="/members">
              <span className="inline-flex items-center gap-3">
                <Users size={18}/> Central Members
              </span>
            </SidebarLink>
            <SidebarLink href="/evangelism">
              <span className="inline-flex items-center gap-3">
                <Handshake size={18}/> Evangelism
              </span>
            </SidebarLink>
            <SidebarLink href="/services">
              <span className="inline-flex items-center gap-3">
                <Church size={18}/> Services
              </span>
            </SidebarLink>
            <SidebarLink href="/first-timers">
              <span className="inline-flex items-center gap-3">
                <BarChart3 size={18}/> First Timers
              </span>
            </SidebarLink>
            <SidebarLink href="/export">
              <span className="inline-flex items-center gap-3">
                <Upload size={18}/> Data Export
              </span>
            </SidebarLink>
            <SidebarLink href="/presenting">
              <span className="inline-flex items-center gap-3">
                <Presentation size={18}/> Presenting
              </span>
            </SidebarLink>
          </nav>
          <div className="mt-8">
            <SignOutButton />
          </div>
        </aside>
        <main className="flex-1 flex flex-col">
          <TopBar />
          <Container max="3xl" className="p-10 space-y-8 flex-1" >
            <div style={{ backgroundColor: 'var(--background)' }}>
              {children}
            </div>
          </Container>
        </main>
      </div>
    </ProtectedClient>
  );
}

 


