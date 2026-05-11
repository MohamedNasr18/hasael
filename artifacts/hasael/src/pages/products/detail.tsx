import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetProduct } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Tag,
  User as UserIcon,
  ChevronRight,
  Phone,
  MessageSquare,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const CATEGORY_LABELS: Record<string, string> = {
  seeds: "بذور", fertilizers: "أسمدة", tools: "أدوات",
  equipment: "معدات", livestock: "مواشي", crops: "محاصيل",
  food: "غذاء", other: "أخرى",
};

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id ? parseInt(params.id, 10) : 0;
  const { user } = useAuth();

  const { data: product, isLoading } = useGetProduct(productId);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-72 bg-secondary rounded-xl" />
          <div className="h-8 bg-secondary rounded w-1/2" />
          <div className="h-4 bg-secondary rounded w-1/3" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">المنتج غير موجود</h2>
          <p className="text-muted-foreground mt-2">لا يمكن العثور على هذا المنتج.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/products">العودة للمنتجات</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const images = product.images ?? [];
  const isOwner = user?.id === product.owner_id;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-primary transition-colors">المنتجات</Link>
          <ChevronLeft className="w-4 h-4" />
          <span className="text-foreground font-medium truncate">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border/50">
              {images.length > 0 ? (
                <img
                  src={images[activeImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="w-16 h-16 opacity-20" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                      i === activeImage ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold">{product.title}</h1>
                {!product.is_available && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/30 shrink-0">
                    غير متاح
                  </Badge>
                )}
              </div>
              <Badge className="mt-2 text-xs" variant="outline">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </Badge>
            </div>

            <div className="text-3xl font-bold text-primary">
              {product.price.toLocaleString()} <span className="text-base text-muted-foreground font-normal">ج.م</span>
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/40 bg-secondary/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <Tag className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">الكمية المتاحة</p>
                    <p className="font-semibold">{product.quantity}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-secondary/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ الإدراج</p>
                    <p className="font-semibold text-sm">
                      {format(new Date(product.created_at), "d MMM yyyy", { locale: ar })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seller info */}
            {product.owner_name && (
              <Card className="border-border/50 bg-card">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    {product.owner_avatar ? (
                      <img src={product.owner_avatar} alt={product.owner_name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">البائع</p>
                    <p className="font-semibold truncate">{product.owner_name}</p>
                  </div>
                  {!isOwner && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/profile/${product.owner_id}`}>عرض الملف</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {isOwner ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/products/${product.id}/edit`}>تعديل المنتج</Link>
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  disabled={!product.is_available}
                  asChild
                >
                  <Link href={`/profile/${product.owner_id}`}>
                    <MessageSquare className="w-4 h-4 ml-2" />
                    تواصل مع البائع
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
