import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Tractor, 
  LayoutDashboard, 
  Sprout, 
  Banknote, 
  Briefcase, 
  Bell, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  ShoppingBag,
  Package,
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    setLocation("/");
  };

  const navItems = [
    { label: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard, requiresAuth: true },
    { label: "فرص الاستثمار", href: "/feed", icon: Tractor, requiresAuth: false },
    { label: "مزارعي", href: "/farms", icon: Sprout, requiresAuth: true, roles: ["farm_owner"] },
    { label: "استثماراتي", href: "/investments", icon: Banknote, requiresAuth: true, roles: ["investor"] },
    { label: "الخدمات", href: "/services", icon: Briefcase, requiresAuth: false },
    { label: "خدماتي", href: "/services/my", icon: Briefcase, requiresAuth: true, roles: ["service_provider"] },
    { label: "المنتجات", href: "/products", icon: ShoppingBag, requiresAuth: false },
    { label: "منتجاتي", href: "/products/my", icon: Package, requiresAuth: true, roles: ["user"] },
    { label: "الإشعارات", href: "/notifications", icon: Bell, requiresAuth: true },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresAuth && !isAuthenticated) return false;
    if (item.roles && user && !item.roles.some((r) => user.roles?.includes(r))) return false;
    return true;
  });

  const roleLabel = (role: string) => {
    switch (role) {
      case "farm_owner": return "صاحب أرض";
      case "investor": return "مستثمر";
      case "service_provider": return "مزود خدمة";
      case "user": return "بائع";
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row" dir="rtl">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Sprout className="w-6 h-6" />
          حصائل
        </Link>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? "flex" : "hidden"} 
        md:flex flex-col w-full md:w-64 border-l border-border bg-card sticky top-0 h-screen overflow-y-auto
      `}>
        <div className="p-6 hidden md:flex">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary tracking-tight">
            <Sprout className="w-8 h-8" />
            حصائل
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors
                  ${isActive 
                    ? "bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          {isAuthenticated && user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-bold border border-border shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel(user.active_role)}</p>
                </div>
              </div>
              
              <Link href={`/profile/${user.id}`} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary">
                <UserIcon className="w-4 h-4" />
                الملف الشخصي
              </Link>
              
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors rounded-md"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" className="flex items-center justify-center w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="flex items-center justify-center w-full py-2 px-4 border border-border text-foreground font-medium rounded-md hover:bg-secondary transition-colors">
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
