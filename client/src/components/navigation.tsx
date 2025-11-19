import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="flex gap-2 border-b bg-background px-4 py-2">
      <Link href="/">
        <Button
          variant={location === "/" ? "default" : "ghost"}
          size="sm"
          className="gap-2"
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
        >
          <FileText className="h-4 w-4" />
          Reports
        </Button>
      </Link>
    </nav>
  );
}
