import { useState } from "react";
import { useGetFeed, useGetMyInvestments, useCreateInvestment } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Target, Banknote, Tractor, Search, Sprout } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

const AVAILABLE_STATUSES = ["available"];

export default function Feed() {
  const [search, setSearch] = useState("");
  const { data: feedData, isLoading } = useGetFeed();
  const { user, isAuthenticated } = useAuth();
  const isInvestor = isAuthenticated && user?.active_role === "investor";

 const { data: myInvestmentsData } = useGetMyInvestments();

  const investedFarmIds = new Set(
    (myInvestmentsData?.data ?? []).map((inv) => inv.farm_id)
  );

  const farms = feedData?.data || [];

  const filteredFarms = farms.filter(farm =>
    farm.name.toLowerCase().includes(search.toLowerCase()) ||
    farm.location.governorate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">فرص الاستثمار</h1>
            <p className="text-muted-foreground mt-1">اكتشف واستثمر في مستقبل الزراعة.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مزارع أو مناطق..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-secondary animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : filteredFarms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFarms.map((farm) => (
              <FarmCard
                key={farm.id}
                farm={farm}
                isInvestor={isInvestor}
                alreadyInvested={investedFarmIds.has(farm.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/50 rounded-xl border border-dashed border-border/50">
            <Sprout className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">لا توجد فرص</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">جرّب تعديل كلمات البحث للعثور على فرص استثمارية أخرى.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

function FarmCard({ farm, isInvestor, alreadyInvested }: {
  farm: any;
  isInvestor: boolean;
  alreadyInvested: boolean;
}) {
  const [sent, setSent] = useState(alreadyInvested);
  const [error, setError] = useState("");
  const createInvestment = useCreateInvestment();
  const queryClient = useQueryClient();

  const isAvailable = farm.status === "available";

  const handleInvest = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    try {
      await createInvestment.mutateAsync({
        data: { farm_id: farm.id, type: "express_interest" },
      });
      setSent(true);
      queryClient.invalidateQueries({ queryKey: ["/api/investments/my"] });
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "available": return "متاح";
      case "under_negotiation": return "قيد التفاوض";
      case "funded": return "ممول";
      case "closed": return "مغلق";
      default: return s;
    }
  };

  const statusBadgeClass = (s: string) => {
    switch (s) {
      case "available": return "bg-chart-2/10 text-chart-2 border-chart-2/30";
      case "under_negotiation": return "bg-chart-3/10 text-chart-3 border-chart-3/30";
      case "funded": return "bg-primary/10 text-primary border-primary/30";
      case "closed": return "bg-secondary text-muted-foreground border-border";
      default: return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <Link href={`/farms/${farm.id}`}>
      <Card className={`h-full hover:border-primary/50 transition-colors cursor-pointer group overflow-hidden bg-card/80 border-border/50 ${!isAvailable ? "opacity-90" : ""}`}>
        <div className="h-48 bg-muted relative">
          {farm.cover_image ? (
            <img src={farm.cover_image} alt={farm.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
              <Tractor className="w-12 h-12 opacity-20" />
            </div>
          )}
          <Badge className={`absolute top-4 right-4 backdrop-blur-sm border ${statusBadgeClass(farm.status)}`}>
            {statusLabel(farm.status)}
          </Badge>
        </div>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="line-clamp-1">{farm.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                <MapPin className="w-3 h-3" />
                {farm.location.governorate}{farm.location.district ? `، ${farm.location.district}` : ''}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize shrink-0">{farm.crop_type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">المساحة</p>
              <p className="font-medium flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-primary" />
                {farm.size_feddan} فدان
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">أدنى استثمار</p>
              <p className="font-medium flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-chart-2" />
                {farm.investment_terms.min_investment.toLocaleString()} ج.م
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">العائد المتوقع</p>
              <p className="font-medium text-chart-4">{farm.investment_terms.expected_roi}%</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">المدة</p>
              <p className="font-medium">{farm.investment_terms.duration_months} شهر</p>
            </div>
          </div>

          {isInvestor && (
            <div className="mt-4 pt-3 border-t border-border/50">
              {isAvailable ? (
                <>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={sent || createInvestment.isPending}
                    onClick={handleInvest}
                  >
                    {sent ? "تم الإرسال ✓" : createInvestment.isPending ? "جارٍ الإرسال..." : "استثمر الآن"}
                  </Button>
                  {error && (
                    <p className="text-xs text-destructive mt-2 text-center">{error}</p>
                  )}
                </>
              ) : (
                <Button className="w-full" size="sm" variant="outline" disabled>
                  {statusLabel(farm.status)}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
