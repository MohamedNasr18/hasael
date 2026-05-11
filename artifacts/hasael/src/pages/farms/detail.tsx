import { useRoute } from "wouter";
import { useGetFarm, getGetFarmQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Target, Banknote, Clock, PieChart, Users, Eye } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function FarmDetail() {
  const [, params] = useRoute("/farms/:id");
  const farmId = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: farm, isLoading } = useGetFarm(farmId, {
    query: {
      enabled: !!farmId,
      queryKey: getGetFarmQueryKey(farmId)
    }
  });

  const statusLabel = (s: string) => {
    switch (s) {
      case "available": return "متاح";
      case "under_negotiation": return "قيد التفاوض";
      case "funded": return "ممول";
      case "closed": return "مغلق";
      default: return s;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8 animate-pulse">
          <div className="h-64 bg-secondary rounded-xl w-full"></div>
          <div className="h-10 bg-secondary rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="h-40 bg-secondary rounded-xl"></div>
              <div className="h-40 bg-secondary rounded-xl"></div>
            </div>
            <div className="h-80 bg-secondary rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!farm) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">المزرعة غير موجودة</h2>
          <p className="text-muted-foreground mt-2">هذه المزرعة غير موجودة أو لا تملك صلاحية الوصول إليها.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="relative rounded-2xl overflow-hidden bg-muted border border-border/50 h-64 md:h-80 flex items-end">
          {farm.cover_image ? (
            <img src={farm.cover_image} alt={farm.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-secondary/80 flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground/30 uppercase tracking-widest">{farm.crop_type}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <div className="relative p-6 md:p-8 w-full">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant={farm.is_published ? "default" : "secondary"} className="bg-primary/90 text-primary-foreground border-none">
                {farm.is_published ? "منشور" : "مسودة"}
              </Badge>
              <Badge variant="outline" className="bg-background/20 text-white border-white/30 backdrop-blur-md">
                {statusLabel(farm.status)}
              </Badge>
              <Badge variant="outline" className="bg-background/20 text-white border-white/30 backdrop-blur-md capitalize">
                {farm.crop_type}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{farm.name}</h1>
            <div className="flex items-center text-white/80 gap-4 text-sm md:text-base">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {farm.location.governorate}{farm.location.district ? `، ${farm.location.district}` : ''}</span>
              <span className="flex items-center gap-1"><Target className="w-4 h-4" /> {farm.size_feddan} فدان</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle>عن المزرعة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {farm.description || "لا يوجد وصف."}
                </p>
                <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {farm.views_count} مشاهدة
                  </span>
                  <span className="flex items-center gap-1 text-chart-2">
                    <Users className="w-4 h-4" /> {farm.interest_count} مهتم
                  </span>
                  <span>أُدرجت في {format(new Date(farm.created_at), 'd MMMM yyyy', { locale: ar })}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>شروط الاستثمار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">أدنى استثمار</p>
                  <p className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Banknote className="w-6 h-6" />
                    {farm.investment_terms.min_investment.toLocaleString()} ج.م
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-primary/10 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Target className="w-4 h-4" /> العائد المتوقع
                    </p>
                    <p className="text-xl font-bold text-chart-4">{farm.investment_terms.expected_roi}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> المدة
                    </p>
                    <p className="text-xl font-bold">{farm.investment_terms.duration_months} شهر</p>
                  </div>
                </div>

                {farm.investment_terms.profit_split && (
                  <div className="border-t border-primary/10 pt-4">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <PieChart className="w-4 h-4" /> توزيع الأرباح
                    </p>
                    <p className="font-bold">{farm.investment_terms.profit_split}% مستثمر / {100 - farm.investment_terms.profit_split}% مالك</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
