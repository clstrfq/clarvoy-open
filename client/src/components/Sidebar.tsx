import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  BarChart3,
  LogOut,
  ShieldCheck,
  User,
  BookOpen,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAlertCount } from "@/hooks/use-grant-alerts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const alertCount = useAlertCount();

  const isActive = (path: string) => location === path;

  return (
    <div className="h-screen w-64 bg-card border-r border-white/5 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight">Clarvoy</h1>
            <p className="text-xs text-muted-foreground">Governance OS v2.0</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-2 space-y-1">
        <Link href="/" className="block">
          <Button
            variant={isActive("/") ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 text-sm font-medium h-10"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/new" className="block">
          <Button
            variant={isActive("/new") ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 text-sm font-medium h-10"
          >
            <PlusCircle className="w-4 h-4" />
            New Decision
          </Button>
        </Link>
        <Link href="/use-cases" className="block">
          <Button
            variant={isActive("/use-cases") ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 text-sm font-medium h-10"
            data-testid="link-use-cases"
          >
            <BookOpen className="w-4 h-4" />
            PA Use Cases
          </Button>
        </Link>
        <Link href="/nonprofits" className="block">
          <Button
            variant={isActive("/nonprofits") ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 text-sm font-medium h-10"
          >
            <Building2 className="w-4 h-4" />
            Nonprofit Data
            {alertCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs h-5 px-1.5">
                {alertCount}
              </Badge>
            )}
          </Button>
        </Link>
        <Link href="/admin" className="block">
          <Button
            variant={isActive("/admin") ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 text-sm font-medium h-10"
          >
            <BarChart3 className="w-4 h-4" />
            Analysis & Admin
          </Button>
        </Link>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-white/10 hover:bg-white/5 text-muted-foreground"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
