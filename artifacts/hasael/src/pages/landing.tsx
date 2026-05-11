import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Sprout,
  UserPlus,
  Search,
  Handshake,
  Mail,
  Phone,
  MapPin,
  Target,
  Banknote,
  Tractor,
  ArrowLeft,
} from "lucide-react";

interface PlatformStats {
  investors: number;
  published_farms: number;
  completed_deals: number;
  avg_roi: number;
}

const FALLBACK_STATS: PlatformStats = {
  investors: 500,
  published_farms: 120,
  completed_deals: 85,
  avg_roi: 18,
};

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(ease * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function AnimatedStatCard({
  label,
  value,
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const { count, ref } = useCountUp(value);
  return (
    <div
      ref={ref}
      className="text-center p-6 bg-background rounded-xl border border-border/50 shadow-sm"
    >
      <p className="text-4xl font-bold text-primary mb-2">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

const cropLabels: Record<string, string> = {
  wheat: "قمح",
  corn: "ذرة",
  rice: "أرز",
  vegetables: "خضروات",
  fruits: "فاكهة",
  cotton: "قطن",
  sugarcane: "قصب السكر",
  other: "أخرى",
};

function FarmCard({ farm, isLoggedIn }: { farm: any; isLoggedIn: boolean }) {
  const [, navigate] = useLocation();

  const handleLearnMore = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigate(`/farms/${farm.id}`);
    } else {
      navigate("/login");
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
      default: return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden border-border/50 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 group">
      <div className="h-48 bg-muted relative shrink-0">
        {farm.cover_image ? (
          <img
            src={farm.cover_image}
            alt={farm.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
            <Tractor className="w-12 h-12 opacity-20" />
          </div>
        )}
        <Badge
          className={`absolute top-3 right-3 backdrop-blur-sm border text-xs ${statusBadgeClass(farm.status)}`}
        >
          {statusLabel(farm.status)}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg line-clamp-1">{farm.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1 text-xs">
              <MapPin className="w-3 h-3 shrink-0" />
              {farm.location.governorate}
              {farm.location.district ? `، ${farm.location.district}` : ""}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {cropLabels[farm.crop_type] ?? farm.crop_type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-5 flex-1 flex flex-col justify-between gap-4">
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">المساحة</p>
            <p className="font-medium flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-primary" />
              {farm.size_feddan} فدان
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">أدنى استثمار</p>
            <p className="font-medium flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-chart-2" />
              {farm.investment_terms.min_investment.toLocaleString()} ج.م
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">العائد المتوقع</p>
            <p className="font-semibold text-chart-4">
              {farm.investment_terms.expected_roi}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">المدة</p>
            <p className="font-medium">{farm.investment_terms.duration_months} شهر</p>
          </div>
        </div>

        <Button
          className="w-full mt-1 flex items-center gap-2"
          size="sm"
          onClick={handleLearnMore}
        >
          تعرف على المزيد
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Landing() {
  const [stats, setStats] = useState<PlatformStats>(FALLBACK_STATS);
  const [farms, setFarms] = useState<any[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);

  const isLoggedIn =
    typeof window !== "undefined" &&
    !!localStorage.getItem("auth_token");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.investors === "number") setStats(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.data)) setFarms(data.data);
      })
      .catch(() => {})
      .finally(() => setFarmsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-2xl text-primary"
          >
            <Sprout className="w-7 h-7" />
            حصائل
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a
              href="#opportunities"
              className="hover:text-foreground transition-colors"
            >
              فرص الاستثمار
            </a>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              كيف نعمل
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">إنشاء حساب</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600"
          alt="أرض زراعية"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            منصة حصائل — الاستثمار الزراعي الذكي
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-10 leading-relaxed">
            نربط أصحاب الأراضي بالمستثمرين لبناء مستقبل زراعي مستدام
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8 py-6">
              <Link href="/register">ابدأ الاستثمار</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 border-white/50 text-white bg-white/10 hover:bg-white/20"
              asChild
            >
              <a href="#opportunities">استعرض الفرص</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-card border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <AnimatedStatCard label="مستثمر مسجل" value={stats.investors} prefix="+" />
            <AnimatedStatCard label="مزرعة منشورة" value={stats.published_farms} prefix="+" />
            <AnimatedStatCard label="صفقة مكتملة" value={stats.completed_deals} prefix="+" />
            <AnimatedStatCard label="عائد متوسط" value={stats.avg_roi} suffix="%" />
          </div>
        </div>
      </section>

      {/* ── Investment Opportunities ── */}
      <section id="opportunities" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl font-bold">فرص الاستثمار</h2>
              <p className="text-muted-foreground mt-2">
                تصفح أحدث المزارع المتاحة للاستثمار من أصحاب الأراضي
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={isLoggedIn ? "/feed" : "/login"}>
                عرض جميع الفرص
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Link>
            </Button>
          </div>

          {farmsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-80 bg-secondary animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : farms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {farms.map((farm) => (
                <FarmCard key={farm.id} farm={farm} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-secondary/40 rounded-2xl border border-dashed border-border/50">
              <Sprout className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-muted-foreground">لا توجد فرص متاحة حالياً</p>
            </div>
          )}

          {!isLoggedIn && farms.length > 0 && (
            <div className="mt-10 text-center">
              <p className="text-muted-foreground mb-4">
                سجّل دخولك لاستعراض تفاصيل كل فرصة والتواصل مع أصحاب الأراضي
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button asChild>
                  <Link href="/register">إنشاء حساب مجاني</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/login">تسجيل الدخول</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 bg-secondary/40">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-14">كيف تعمل المنصة؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <HowStep
              icon={<UserPlus className="w-8 h-8" />}
              title="سجّل حسابك"
              desc="أنشئ حسابك في دقيقة واختر دورك كمستثمر أو صاحب أرض"
            />
            <HowStep
              icon={<Search className="w-8 h-8" />}
              title="استعرض الفرص"
              desc="تصفح المزارع المتاحة وابحث حسب المنطقة والمحصول والعائد"
            />
            <HowStep
              icon={<Handshake className="w-8 h-8" />}
              title="أتمّ الصفقة"
              desc="تواصل مع الطرف الآخر وأبرم اتفاقية الاستثمار بأمان"
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-14">ماذا يقول مستثمرونا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              initials="أش"
              quote="منصة حصائل غيّرت طريقة استثماري — وجدت أرضاً مناسبة في أسبوع واحد فقط."
              name="أحمد الشمري"
              role="مستثمر زراعي"
            />
            <TestimonialCard
              initials="سق"
              quote="تمكنت من إيجاد شريك استثماري موثوق خلال أيام، والعملية كانت شفافة تماماً."
              name="سارة القحطاني"
              role="صاحبة أرض"
            />
            <TestimonialCard
              initials="مع"
              quote="عائد استثماري ممتاز وفريق دعم متجاوب. أنصح كل من يبحث عن فرص زراعية."
              name="محمد العتيبي"
              role="مستثمر"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-primary text-primary-foreground pt-14 pb-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 text-2xl font-bold mb-3">
                <Sprout className="w-7 h-7" />
                حصائل
              </div>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                منصة الاستثمار الزراعي الذكي
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-primary-foreground/90">روابط سريعة</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors">
                    الرئيسية
                  </a>
                </li>
                <li>
                  <a
                    href="#opportunities"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    فرص الاستثمار
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    كيف نعمل
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-primary-foreground/90">تواصل معنا</h4>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  info@hasael.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" />
                  +966 50 000 0000
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  الرياض، المملكة العربية السعودية
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 pt-6 text-center text-xs text-primary-foreground/50">
            حقوق النشر © 2026 حصائل — جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}

function HowStep({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function TestimonialCard({
  initials,
  quote,
  name,
  role,
}: {
  initials: string;
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col gap-4">
      <p className="text-foreground/80 leading-relaxed text-sm flex-1">"{quote}"</p>
      <div className="flex items-center gap-3 pt-3 border-t border-border/50">
        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}
