import { useRoute, Link } from "wouter";
import {
  useGetFarmInvestments,
  useRespondToInvestment,
  getGetFarmInvestmentsQueryKey,
} from "@workspace/api-client-react";

import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Banknote,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Sprout,
} from "lucide-react";

import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { useToast } from "@/hooks/use-toast";

import type { InvestmentResponseInputAction } from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";

export default function FarmInvestments() {
  const [, params] = useRoute("/investments/farm/:id");

  const farmId = params?.id ? parseInt(params.id, 10) : 0;

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const respondMutation = useRespondToInvestment();

  const { data: investmentsData, isLoading } =
    useGetFarmInvestments(farmId);

  const investments = investmentsData?.data || [];

  const handleResponse = async (
    investmentId: number,
    action: InvestmentResponseInputAction
  ) => {
    try {
      await respondMutation.mutateAsync({
        investmentId,
        data: { action },
      });

      queryClient.invalidateQueries({
        queryKey: getGetFarmInvestmentsQueryKey(farmId),
      });

      toast({
        title: "تم تحديث الحالة",
        description:
          action === "accepted"
            ? "تم قبول طلب الاستثمار."
            : "تم رفض طلب الاستثمار.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل تحديث حالة الاستثمار.",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle2 className="w-4 h-4 text-chart-2" />;

      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;

      case "cancelled":
        return (
          <XCircle className="w-4 h-4 text-muted-foreground" />
        );

      default:
        return <Clock className="w-4 h-4 text-chart-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";

      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/20";

      case "cancelled":
        return "bg-secondary text-muted-foreground border-border";

      default:
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending":
        return "قيد الانتظار";

      case "accepted":
        return "مقبول";

      case "rejected":
        return "مرفوض";

      case "cancelled":
        return "ملغى";

      default:
        return s;
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case "express_interest":
        return "إبداء اهتمام";

      case "full_investment":
        return "استثمار كامل";

      default:
        return t;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              طلبات الاستثمار
            </h1>

            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Link
                href={`/farms/${farmId}`}
                className="text-primary hover:underline font-medium"
              >
                العودة إلى تفاصيل المزرعة
              </Link>
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 bg-secondary animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : investments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {investments.map((inv: any) => (
              <Card
                key={inv.id}
                className="bg-card border-border/50"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6 justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>

                        <div>
                          <Link
                            href={`/profile/${inv.investor_id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {inv.investor_name ||
                              "مستثمر غير معروف"}
                          </Link>

                          <p className="text-sm text-muted-foreground">
                            طلب في{" "}
                            {format(
                              new Date(inv.created_at),
                              "d MMM yyyy",
                              { locale: ar }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1.5"
                        >
                          {inv.type === "express_interest" ? (
                            <Sprout className="w-3.5 h-3.5" />
                          ) : (
                            <Banknote className="w-3.5 h-3.5" />
                          )}

                          {typeLabel(inv.type)}
                        </Badge>

                        <Badge
                          className={`flex items-center gap-1 ${getStatusColor(
                            inv.status
                          )}`}
                        >
                          {getStatusIcon(inv.status)}

                          {statusLabel(inv.status)}
                        </Badge>
                      </div>

                      {inv.message && (
                        <div className="bg-secondary/50 p-4 rounded-lg border border-border/50">
                          <p className="text-sm italic text-muted-foreground">
                            "{inv.message}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col lg:items-end justify-between min-w-[200px] border-t lg:border-t-0 lg:border-r border-border/50 pt-4 lg:pt-0 lg:pr-6">
                      <div className="mb-4 lg:mb-0 lg:text-right">
                        <p className="text-sm text-muted-foreground mb-1">
                          المبلغ المقترح
                        </p>

                        {inv.amount ? (
                          <p className="text-2xl font-bold text-primary">
                            {inv.amount.toLocaleString()} ج.م
                          </p>
                        ) : (
                          <p className="text-lg text-muted-foreground font-medium">
                            غير محدد
                          </p>
                        )}
                      </div>

                      {inv.status === "pending" && (
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                          <Button
                            variant="outline"
                            className="flex-1 lg:flex-none border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() =>
                              handleResponse(
                                inv.id,
                                "rejected"
                              )
                            }
                            disabled={respondMutation.isPending}
                          >
                            رفض
                          </Button>

                          <Button
                            className="flex-1 lg:flex-none bg-chart-2 hover:bg-chart-2/90"
                            onClick={() =>
                              handleResponse(
                                inv.id,
                                "accepted"
                              )
                            }
                            disabled={respondMutation.isPending}
                          >
                            قبول
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/50 rounded-xl border border-dashed border-border/50">
            <Sprout className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />

            <h3 className="text-lg font-medium">
              لا توجد طلبات بعد
            </h3>

            <p className="text-muted-foreground mt-2">
              لا توجد طلبات استثمار لهذه المزرعة حالياً.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
