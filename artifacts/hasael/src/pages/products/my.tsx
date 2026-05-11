import { useGetMyProducts, useDeleteProduct } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { Package, Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const categoryLabel = (cat: string) => {
  const map: Record<string, string> = {
    seeds: "بذور", fertilizers: "أسمدة", tools: "أدوات",
    equipment: "معدات", livestock: "مواشي", crops: "محاصيل",
    food: "غذاء", other: "أخرى",
  };
  return map[cat] ?? cat;
};

export default function MyProducts() {
  const { data, isLoading } = useGetMyProducts();
  const deleteMutation = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const products = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ productId: deleteId });
      queryClient.invalidateQueries({ queryKey: ["/api/products/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "تم الحذف", description: "تم حذف المنتج بنجاح." });
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المنتج." });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="w-8 h-8 text-primary" />
              منتجاتي
            </h1>
            <p className="text-muted-foreground mt-1">إدارة منتجاتك المدرجة في السوق.</p>
          </div>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="w-4 h-4 ml-2" />
              إضافة منتج
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/40 rounded-xl border border-dashed border-border/50">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-medium">لا توجد منتجات</h3>
            <p className="text-muted-foreground mt-1 text-sm mb-6">أضف أول منتج لك الآن.</p>
            <Button asChild>
              <Link href="/products/new">
                <Plus className="w-4 h-4 ml-2" />
                إضافة منتج
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <Card key={p.id} className="bg-card border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-16 h-16 rounded-lg bg-secondary shrink-0 overflow-hidden">
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="w-6 h-6 opacity-30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base truncate">{p.title}</h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {categoryLabel(p.category)}
                        </Badge>
                        {!p.is_available && (
                          <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                            غير متاح
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{p.price.toLocaleString()} ج.م</span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          الكمية: {p.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/products/${p.id}/edit`}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنتج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
