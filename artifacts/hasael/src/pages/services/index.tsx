import { useState } from "react";
import { useBrowseServices } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Briefcase, MapPin, Wrench, Droplet, Truck, Lightbulb } from "lucide-react";
import type { BrowseServicesCategory } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Services() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BrowseServicesCategory | "all">("all");
  
  const { data: servicesData, isLoading } = useBrowseServices({
    category: category !== "all" ? category : undefined
  });

  const services = servicesData?.data || [];

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    (s.governorate && s.governorate.toLowerCase().includes(search.toLowerCase()))
  );

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'machinery': return <Wrench className="w-5 h-5" />;
      case 'irrigation': return <Droplet className="w-5 h-5" />;
      case 'logistics': return <Truck className="w-5 h-5" />;
      case 'consultancy': return <Lightbulb className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  const categoryLabel = (c: string) => {
    switch (c) {
      case "machinery": return "آليات";
      case "irrigation": return "ري";
      case "logistics": return "لوجستيات";
      case "consultancy": return "استشارات";
      default: return "أخرى";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">سوق الخدمات</h1>
            <p className="text-muted-foreground mt-1">ابحث عن آليات ولوجستيات وخبراء لمزرعتك.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن خدمات أو مناطق..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue placeholder="كل الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفئات</SelectItem>
                <SelectItem value="machinery">آليات</SelectItem>
                <SelectItem value="irrigation">ري</SelectItem>
                <SelectItem value="logistics">لوجستيات</SelectItem>
                <SelectItem value="consultancy">استشارات</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-secondary animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="bg-card border-border/50 hover:border-primary/50 transition-colors flex flex-col">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {getCategoryIcon(service.category)}
                    </div>
                    <Badge variant={service.is_available ? "default" : "secondary"}>
                      {service.is_available ? "متاح" : "مشغول"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{service.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                    {service.governorate ? (
                      <><MapPin className="w-3 h-3" /> {service.governorate}</>
                    ) : (
                      "متاح في كل المناطق"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {service.description || "لا يوجد وصف."}
                  </p>
                  
                  <div className="mt-auto">
                    <div className="flex items-end justify-between pt-4 border-t border-border/30">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">مقدّم الخدمة</p>
                        <Link href={`/profile/${service.provider_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                          {service.provider_name || `مزود #${service.provider_id}`}
                        </Link>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-primary">
                          {service.price_per_unit.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground mr-1">ج.م/{service.unit}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/50 rounded-xl border border-dashed border-border/50">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">لا توجد خدمات</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">جرّب تعديل البحث أو فئة الخدمة.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
