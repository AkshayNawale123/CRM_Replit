import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, BookOpen, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function Navigation() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <nav className="flex gap-2 border-b bg-background px-4 py-2 justify-between">
      <div className="flex gap-2">
        <Link href="/">
          <Button
            variant={location === "/" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/reports">
          <Button
            variant={location === "/reports" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            data-testid="nav-reports"
          >
            <FileText className="h-4 w-4" />
            Reports
          </Button>
        </Link>
        <Link href="/glossary">
          <Button
            variant={location === "/glossary" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            data-testid="nav-glossary"
          >
            <BookOpen className="h-4 w-4" />
            Glossary
          </Button>
        </Link>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={logout}
        data-testid="button-logout"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </nav>
  );
}
