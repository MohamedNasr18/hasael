import { useState } from "react";
import {
  useGetMyNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useRespondToInvestment,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Notifications() {
  const { data: notificationsData, isLoading } = useGetMyNotifications();
  const markAllMutation = useMarkAllNotificationsRead();
  const markOneMutation = useMarkNotificationRead();
  const respondMutation = useRespondToInvestment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Track responded investment ids so buttons disappear immediately
  const [responded, setResponded] = useState<Record<number, "accepted" | "rejected">>({});

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unread_count || 0;

  const handleMarkAllRead = async () => {
    try {
      await markAllMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "تم", description: "تم تعليم جميع الإشعارات كمقروءة." });
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تعليم الإشعارات كمقروءة." });
    }
  };

  const handleMarkRead = async (notificationId: number, isRead: boolean) => {
    if (isRead) return;
    try {
      await markOneMutation.mutateAsync({ notificationId });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch {
      // silent
    }
  };

  const handleRespond = async (
    notif: any,
    action: "accepted" | "rejected"
  ) => {
    if (!notif.investment_id) return;
    try {
      await respondMutation.mutateAsync({
        investmentId: notif.investment_id,
        data: { action },
      });
      setResponded((prev) => ({ ...prev, [notif.investment_id]: action }));
      // Mark notification as read
      if (!notif.is_read) {
        await markOneMutation.mutateAsync({ notificationId: notif.id });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/farms/my"] });
      toast({
        title: action === "accepted" ? "تم القبول ✓" : "تم الرفض",
        description:
          action === "accepted"
            ? "تم قبول طلب الاستثمار وإشعار المستثمر."
            : "تم رفض طلب الاستثمار.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: err.message || "فشل تحديث حالة الطلب.",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "investment_received":
        return <Banknote className="w-5 h-5 text-primary" />;
      case "investment_accepted":
        return <CheckCircle2 className="w-5 h-5 text-chart-2" />;
      case "investment_rejected":
      case "investment_cancelled":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Bell className="w-5 h-5 text-chart-3" />;
    }
  };

  const getNotificationMessage = (n: any) => {
    switch (n.type) {
      case "investment_received":
        return (
          <span>
            <strong>{n.investor_name}</strong> أرسل طلب استثمار في{" "}
            <strong>{n.farm_name}</strong>
          </span>
        );
      case "investment_accepted":
        return (
          <span>
            تم <strong className="text-chart-2">قبول</strong> طلب استثمارك في{" "}
            <strong>{n.farm_name}</strong>!
          </span>
        );
      case "investment_rejected":
        return (
          <span>
            تم <strong className="text-destructive">رفض</strong> طلب استثمارك في{" "}
            <strong>{n.farm_name}</strong>.
          </span>
        );
      case "investment_cancelled":
        return (
          <span>
            <strong>{n.investor_name}</strong> ألغى طلب استثماره في{" "}
            <strong>{n.farm_name}</strong>
          </span>
        );
      default:
        return <span>نشاط جديد على حسابك.</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">الإشعارات</h1>
            <p className="text-muted-foreground mt-1">
              ابقَ على اطّلاع دائم بنشاط استثماراتك ومزارعك.
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllMutation.isPending}
            >
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-secondary animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => {
              const alreadyResponded = n.investment_id
                ? responded[n.investment_id]
                : undefined;
              const isPendingInvestment =
                n.type === "investment_received" &&
                n.investment_id &&
                !alreadyResponded;

              return (
                <Card
                  key={n.id}
                  className={`bg-card overflow-hidden transition-all ${
                    !n.is_read
                      ? "border-primary/40 shadow-sm"
                      : "border-border/40 opacity-80"
                  }`}
                  onClick={() => {
                    if (!isPendingInvestment) handleMarkRead(n.id, n.is_read);
                  }}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                      {/* Icon */}
                      <div
                        className={`p-3 rounded-full shrink-0 self-start ${
                          !n.is_read ? "bg-primary/10" : "bg-secondary"
                        }`}
                      >
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base leading-snug">
                          {getNotificationMessage(n)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(n.created_at),
                              "d MMM yyyy • h:mm a",
                              { locale: ar }
                            )}
                          </p>
                        </div>

                        {/* Accept / Reject buttons for pending investment requests */}
                        {isPendingInvestment && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              className="bg-chart-2 hover:bg-chart-2/90 text-white gap-1.5"
                              disabled={respondMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRespond(n, "accepted");
                              }}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive/10 gap-1.5"
                              disabled={respondMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRespond(n, "rejected");
                              }}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              رفض
                            </Button>
                            {n.farm_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="text-muted-foreground"
                              >
                                <Link href={`/farms/${n.farm_id}`}>عرض المزرعة</Link>
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Responded badge */}
                        {alreadyResponded && (
                          <div className="mt-2">
                            <Badge
                              className={
                                alreadyResponded === "accepted"
                                  ? "bg-chart-2/10 text-chart-2 border-chart-2/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                              }
                            >
                              {alreadyResponded === "accepted"
                                ? "✓ تم القبول"
                                : "✗ تم الرفض"}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                        {!n.is_read && !isPendingInvestment && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                        {n.farm_id && !isPendingInvestment && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/farms/${n.farm_id}`}>عرض</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/50 rounded-xl border border-dashed border-border/50">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">لا توجد إشعارات</h3>
            <p className="text-muted-foreground mt-2">
              ليس لديك أي إشعارات الآن.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
