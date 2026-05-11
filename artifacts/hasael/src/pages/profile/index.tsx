import { useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetPublicProfile,
  useUpdateMe,
  useGetMyInvestments,
  GetMyInvestmentsStatus,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Tractor,
  MapPin,
  Target,
  Banknote,
  Camera,
  CheckCircle2,
  Calendar,
  Sprout,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function PublicProfile() {
  const [, params] = useRoute("/profile/:id");
  const userId = params?.id ? parseInt(params.id, 10) : 0;
  const { user: me, setAuthData, token } = useAuth();
  const isOwnProfile = me?.id === userId;
  const isInvestor = me?.roles?.includes("investor") ?? false;

  const { data: profile, isLoading } = useGetPublicProfile(userId);
  const updateMeMutation = useUpdateMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: myInvestmentsData } = useGetMyInvestments(
  isOwnProfile && isInvestor
    ? { status: GetMyInvestmentsStatus.accepted }
    : undefined
);
  const acceptedInvestments = myInvestmentsData?.data ?? [];

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("فشل رفع الصورة");
      const { url } = await res.json();
      const updated = await updateMeMutation.mutateAsync({
        data: { avatar: url },
      });
      if (token) setAuthData(token, updated as any);
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/profile`],
      });
      toast({
        title: "تم تحديث الصورة",
        description: "تم تحديث صورتك الشخصية بنجاح.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: err.message || "فشل رفع الصورة.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const roleLabel = (r: string) => {
    switch (r) {
      case "farm_owner":
        return "صاحب أرض";
      case "investor":
        return "مستثمر";
      case "service_provider":
        return "مزود خدمة";
      default:
        return r;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-secondary" />
            <div className="space-y-2 flex-1">
              <div className="h-8 bg-secondary rounded w-1/3" />
              <div className="h-4 bg-secondary rounded w-1/4" />
            </div>
          </div>
          <div className="h-64 bg-secondary rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">المستخدم غير موجود</h2>
          <p className="text-muted-foreground mt-2">
            هذا الملف الشخصي غير موجود أو خاص.
          </p>
        </div>
      </Layout>
    );
  }

  const avatarUrl = isOwnProfile
    ? (me?.avatar ?? profile.avatar)
    : profile.avatar;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-10">
        {/* ── Header card ── */}
        <div className="bg-card border border-border/50 rounded-2xl p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          {/* Avatar */}
          <div className="relative shrink-0 z-10">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-secondary flex items-center justify-center border-4 border-background shadow-lg overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 left-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                  title="تغيير الصورة"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center md:text-right flex-1 relative z-10">
            <h1 className="text-3xl font-bold">{profile.full_name}</h1>
            {isOwnProfile && (
              <p className="text-xs text-muted-foreground mt-1">
                انقر على الصورة لتغييرها
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              {profile.roles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="bg-secondary hover:bg-secondary"
                >
                  {roleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* ── Accepted Investments (own investor profile) ── */}
        {isOwnProfile && isInvestor && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-chart-2" />
              استثماراتي
              {acceptedInvestments.length > 0 && (
                <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/30 font-normal text-sm">
                  {acceptedInvestments.length} عرض مقبول
                </Badge>
              )}
            </h2>

            {acceptedInvestments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedInvestments.map((inv) => (
                  <Link key={inv.id} href={`/farms/${inv.farm_id}`}>
                    <Card className="h-full hover:border-chart-2/50 transition-all cursor-pointer group border-border/50 bg-card overflow-hidden">
                      {/* Green accepted stripe */}
                      <div className="h-1.5 bg-chart-2 w-full" />

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                              {inv.farm_name ?? `مزرعة #${inv.farm_id}`}
                            </CardTitle>
                          </div>
                          <Badge className="shrink-0 bg-chart-2/10 text-chart-2 border-chart-2/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            مقبول
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pb-5">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs mb-0.5">
                              نوع الطلب
                            </p>
                            <p className="font-medium flex items-center gap-1">
                              <Sprout className="w-3.5 h-3.5 text-primary" />
                              {inv.type === "express_interest"
                                ? "إبداء اهتمام"
                                : "استثمار كامل"}
                            </p>
                          </div>
                          {inv.amount && (
                            <div>
                              <p className="text-muted-foreground text-xs mb-0.5">
                                المبلغ
                              </p>
                              <p className="font-medium flex items-center gap-1">
                                <Banknote className="w-3.5 h-3.5 text-chart-2" />
                                {inv.amount.toLocaleString()} ج.م
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
                          <Calendar className="w-3.5 h-3.5" />
                          تاريخ الطلب:{" "}
                          {format(new Date(inv.created_at), "d MMM yyyy", {
                            locale: ar,
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-secondary/40 rounded-xl border border-dashed border-border/50">
                <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">
                  لا توجد عروض مقبولة حتى الآن. استعرض فرص الاستثمار وقدّم
                  طلباتك.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Listed farms (farm owner) ── */}
        {profile.farms && profile.farms.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Tractor className="w-6 h-6 text-primary" />
              المزارع المدرجة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.farms.map((farm) => (
                <Link key={farm.id} href={`/farms/${farm.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group overflow-hidden bg-card border-border/50">
                    <div className="h-40 bg-muted relative">
                      {farm.cover_image ? (
                        <img
                          src={farm.cover_image}
                          alt={farm.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                          <Tractor className="w-10 h-10 opacity-20" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 bg-background/90 text-foreground backdrop-blur-sm text-xs">
                        {farm.status}
                      </Badge>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">
                        {farm.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                        <MapPin className="w-3 h-3" />
                        {farm.location.governorate}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 font-medium">
                          <Target className="w-3.5 h-3.5 text-primary" />
                          {farm.size_feddan} فدان
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                          <Banknote className="w-3.5 h-3.5 text-chart-2" />
                          {farm.investment_terms.min_investment.toLocaleString()}{" "}
                          ج.م
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
