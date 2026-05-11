import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetProduct, useUpdateProduct } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Package, X } from "lucide-react";

const CATEGORIES = [
  { value: "seeds", label: "بذور" },
  { value: "fertilizers", label: "أسمدة" },
  { value: "tools", label: "أدوات" },
  { value: "equipment", label: "معدات" },
  { value: "livestock", label: "مواشي" },
  { value: "crops", label: "محاصيل" },
  { value: "food", label: "غذاء" },
  { value: "other", label: "أخرى" },
];

async function uploadImage(file: File, token: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) throw new Error("فشل رفع الصورة");
  const data = await res.json();
  return data.url as string;
}

export default function EditProduct() {
  const [, params] = useRoute("/products/:id/edit");
  const productId = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateProduct();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading } = useGetProduct(productId);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "seeds",
    quantity: "1",
    is_available: true,
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (product && !initialized) {
      setForm({
        title: product.title,
        description: product.description ?? "",
        price: String(product.price),
        category: product.category,
        quantity: String(product.quantity),
        is_available: product.is_available,
      });
      setImages(product.images ?? []);
      setInitialized(true);
    }
  }, [product, initialized]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f, token ?? "")));
      setImages((prev) => [...prev, ...urls]);
    } catch {
      toast({ variant: "destructive", title: "خطأ", description: "فشل رفع الصورة." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        productId,
        data: {
          title: form.title,
          description: form.description || undefined,
          price: parseFloat(form.price),
          category: form.category as any,
          quantity: parseInt(form.quantity, 10),
          images,
          is_available: form.is_available,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      toast({ title: "تم التحديث", description: "تم تحديث المنتج بنجاح." });
      setLocation("/products/my");
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message || "فشل تحديث المنتج." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/3" />
          <div className="h-64 bg-secondary rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!product || (user && product.owner_id !== user.id)) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">غير مصرح</h2>
          <p className="text-muted-foreground mt-2">لا يمكنك تعديل هذا المنتج.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            تعديل المنتج
          </h1>
          <p className="text-muted-foreground mt-1">حدّث بيانات منتجك.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">معلومات المنتج</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">اسم المنتج *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">السعر (ج.م) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    dir="ltr"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">الكمية *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    dir="ltr"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>الفئة *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_available}
                  onCheckedChange={(v) => setForm({ ...form, is_available: v })}
                />
                <Label>متاح للبيع</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">صور المنتج</CardTitle>
              <CardDescription>أضف أو احذف صور المنتج.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border/50 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, j) => j !== i))}
                      className="absolute top-1 left-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs">{uploading ? "جارٍ..." : "إضافة"}</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImagePick}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || uploading} className="flex-1">
              {isSubmitting ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation("/products/my")}>
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
