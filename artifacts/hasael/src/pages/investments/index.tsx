import { useGetMyInvestments } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Banknote, Clock, CheckCircle2, XCircle, Sprout, Building } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";

export default function MyInvestments() {
  const { data: investmentsData, isLoading } = useGetMyInvestments();
  const investments = investmentsData?.data || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="w-5 h-5 text-chart-2" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-muted-foreground" />;
      default: return <Clock className="w-5 h-5 text-chart-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case 'rejected': return "bg-destructive/10 text-destructive border-destructive/20";
      case 'cancelled': return "bg-secondary text-muted-foreground border-border";
      default: return "bg-chart-3/10 text-chart-3 border-chart-3/20";
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending": return "قيد الانتظار";
      case "accepted": return "مقبول";
      case "rejected": return "مرفوض";
      case "cancelled": return "ملغى";
      default: return s;
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case "express_interest": return "إبداء اهتمام";
      case "full_investment": return "استثمار كامل";
      default: return t;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">استثماراتي</h1>
          <p className="text-muted-foreground mt-1">تابع محفظتك الاستثمارية الزراعية وطلباتك.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-secondary animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : investments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {investments.map((investment) => (
              <Card key={investment.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                        {investment.type === 'express_interest' ? <Sprout className="w-6 h-6" /> : <Banknote className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/farms/${investment.farm_id}`} className="font-bold text-lg hover:text-primary transition-colors">
                            {investment.farm_name || `مزرعة #${investment.farm_id}`}
                          </Link>
                          <Badge variant="outline" className="text-xs font-normal">
                            {typeLabel(investment.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          طلب في {format(new Date(investment.created_at), 'd MMM yyyy', { locale: ar })}
                        </p>
                        {investment.message && (
                          <p className="text-sm mt-2 italic text-muted-foreground border-r-2 border-primary/20 pr-2">
                            "{investment.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end gap-3 md:min-w-[200px] border-t md:border-t-0 md:border-r border-border/50 pt-4 md:pt-0 md:pr-6">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(investment.status)}
                        <Badge className={`capitalize ${getStatusColor(investment.status)}`}>
                          {statusLabel(investment.status)}
                        </Badge>
                      </div>
                      {investment.amount && (
                        <p className="font-bold text-lg">{investment.amount.toLocaleString()} ج.م</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-secondary/50 rounded-xl border border-dashed border-border/50">
            <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold">لا توجد استثمارات بعد</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">استعرض السوق للعثور على فرص زراعية مثيرة.</p>
            <Button asChild size="lg">
              <Link href="/feed">استعرض الفرص</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
