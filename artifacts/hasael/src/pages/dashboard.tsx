import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tractor, Banknote, Briefcase, Bell, Sprout, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { user } = useAuth();

  if (isLoading || !summary) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-secondary rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-secondary rounded-xl"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const role = user?.active_role;

  const roleLabel = (r: string) => {
    switch (r) {
      case "farm_owner": return "صاحب أرض";
      case "investor": return "مستثمر";
      case "service_provider": return "مزود خدمة";
      default: return r;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">مرحباً، {user?.full_name.split(' ')[0]}</h1>
            <p className="text-muted-foreground mt-1">إليك نظرة عامة على محفظتك الزراعية.</p>
          </div>
          
          <div className="flex gap-2">
            {role === 'farm_owner' && (
              <Button asChild>
                <Link href="/farms/new">إضافة مزرعة جديدة</Link>
              </Button>
            )}
            {role === 'investor' && (
              <Button asChild>
                <Link href="/feed">استعرض الفرص</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {role === 'farm_owner' && (
            <>
              <StatCard 
                title="المزارع النشطة" 
                value={summary.active_farms} 
                icon={Tractor} 
                color="text-primary" 
              />
              <StatCard 
                title="طلبات الاستثمار الواردة" 
                value={summary.total_interest_received || 0} 
                icon={TrendingUp} 
                color="text-chart-2" 
              />
            </>
          )}

          {role === 'investor' && (
            <>
              <StatCard 
                title="إجمالي الاستثمارات" 
                value={summary.total_investments} 
                icon={Banknote} 
                color="text-primary" 
              />
              <StatCard 
                title="الطلبات المعلّقة" 
                value={summary.pending_investments} 
                icon={Sprout} 
                color="text-chart-3" 
              />
            </>
          )}

          {role === 'service_provider' && (
            <>
              <StatCard 
                title="إجمالي الخدمات" 
                value={summary.total_services || 0} 
                icon={Briefcase} 
                color="text-primary" 
              />
            </>
          )}

          <StatCard 
            title="الإشعارات غير المقروءة" 
            value={summary.unread_notifications} 
            icon={Bell} 
            color="text-chart-4" 
            urgent={summary.unread_notifications > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Sprout className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>سيظهر سجل النشاط هنا.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>نظرة على السوق</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>اتجاهات السوق ومؤشرات المحاصيل.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color, urgent = false }: any) {
  return (
    <Card className={`border-border/50 ${urgent ? 'border-chart-4/50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex items-baseline space-x-2">
          <h2 className="text-3xl font-bold">{value}</h2>
        </div>
      </CardContent>
    </Card>
  );
}
