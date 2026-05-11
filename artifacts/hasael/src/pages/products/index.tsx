import { useState } from "react";
import { useGetProducts, GetProductsCategory } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Search, ShoppingBag, Tag, Package, ChevronLeft } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const CATEGORIES: { value: GetProductsCategory; label: string }[] = [
  { value: GetProductsCategory.seeds, label: "بذور" },
  { value: GetProductsCategory.fertilizers, label: "أسمدة" },
  { value: GetProductsCategory.tools, label: "أدوات" },
  { value: GetProductsCategory.equipment, label: "معدات" },
  { value: GetProductsCategory.livestock, label: "مواشي" },
  { value: GetProductsCategory.crops, label: "محاصيل" },
  { value: GetProductsCategory.food, label: "غذاء" },
  { value: GetProductsCategory.other, label: "أخرى" },
];

const categoryLabel = (cat: string) =>
  CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

const categoryColor = (cat: string) => {
  const map: Record<string, string> = {
    seeds: "bg-chart-2/10 text-chart-2 border-chart-2/30",
    fertilizers: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    tools: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    equipment: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    livestock: "bg-primary/10 text-primary border-primary/30",
    crops: "bg-chart-2/10 text-chart-2 border-chart-2/30",
    food: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    other: "bg-secondary text-muted-foreground border-border",
  };
  return map[cat] ?? "bg-secondary text-muted-foreground border-border";
};

export default function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useGetProducts(
    {
      search: debouncedSearch || undefined,
      category: category !== "all" ? (category as GetProductsCategory) : undefined,
      page,
      limit: 12,
    },
    { query: { keepPreviousData: true } as any }
  );

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-primary" />
            المنتجات
          </h1>
          <p className="text-muted-foreground mt-1">
            تصفّح المنتجات الزراعية المتاحة من البائعين.
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pr-9"
            />
          </div>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/40 rounded-xl border border-dashed border-border/50">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-medium">لا توجد منتجات</h3>
            <p className="text-muted-foreground mt-1 text-sm">حاول تغيير معايير البحث.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`}>
                <Card className="h-full hover:border-primary/40 transition-all cursor-pointer group border-border/50 bg-card overflow-hidden">
                  <div className="h-44 bg-secondary relative overflow-hidden">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-10 h-10 opacity-20" />
                      </div>
                    )}
                    <Badge className={`absolute top-3 right-3 text-xs ${categoryColor(p.category)}`}>
                      {categoryLabel(p.category)}
                    </Badge>
                    {!p.is_available && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <Badge variant="outline" className="text-destructive border-destructive">غير متاح</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {p.title}
                    </CardTitle>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">{p.price.toLocaleString()} ج.م</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        الكمية: {p.quantity}
                      </span>
                    </div>
                    {p.owner_name && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">البائع: {p.owner_name}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              السابق
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
            >
              التالي
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
