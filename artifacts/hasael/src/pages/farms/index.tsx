import { useRef, useState } from "react";
import { useGetMyFarms, useUpdateFarm, useDeleteFarm } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MapPin, Plus, Sprout, Pencil, Trash2, Camera } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Farm } from "@workspace/api-client-react";

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

export default function MyFarms() {
  const { data: farmsData, isLoading } = useGetMyFarms();
  const { user, token } = useAuth();
  const updateFarm = useUpdateFarm();
  const deleteFarm = useDeleteFarm();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editFarm, setEditFarm] = useState<Farm | null>(null);
  const [deleteFarmId, setDeleteFarmId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    crop_type: "wheat",
    size_feddan: "",
    governorate: "",
    district: "",
    is_published: false,
    min_investment: "",
    expected_roi: "",
    duration_months: "",
    profit_split: "",
  });

  const farms = farmsData?.data || [];

  const openEdit = (farm: Farm) => {
    setEditFarm(farm);
    setImageFile(null);
    setImagePreview(farm.cover_image ?? "");
    setEditForm({
      name: farm.name,
      description: farm.description ?? "",
      crop_type: farm.crop_type,
      size_feddan: String(farm.size_feddan),
      governorate: farm.location.governorate,
      district: farm.location.district ?? "",
      is_published: farm.is_published,
      min_investment: String(farm.investment_terms.min_investment),
      expected_roi: String(farm.investment_terms.expected_roi),
      duration_months: String(farm.investment_terms.duration_months),
      profit_split: String(farm.investment_terms.profit_split ?? ""),
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFarm) return;
    setIsUploading(true);
    try {
      let cover_image = editFarm.cover_image;
      if (imageFile) {
        cover_image = await uploadImage(imageFile, token);
      }
      await updateFarm.mutateAsync({
        farmId: editFarm.id,
        data: {
          name: editForm.name,
          description: editForm.description,
          crop_type: editForm.crop_type as any,
          size_feddan: Number(editForm.size_feddan),
          location: {
            governorate: editForm.governorate,
            district: editForm.district || null,
          },
          is_published: editForm.is_published,
          cover_image: cover_image ?? undefined,
          investment_terms: {
            min_investment: Number(editForm.min_investment),
            expected_roi: Number(editForm.expected_roi),
            duration_months: Number(editForm.duration_months),
            profit_split: editForm.profit_split ? Number(editForm.profit_split) : undefined,
          },
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/farms/my"] });
      setEditFarm(null);
      toast({ title: "تم التحديث", description: "تم تحديث بيانات المزرعة بنجاح." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message || "فشل تحديث المزرعة." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFarmId) return;
    try {
      await deleteFarm.mutateAsync({ farmId: deleteFarmId });
      queryClient.invalidateQueries({ queryKey: ["/api/farms/my"] });
      setDeleteFarmId(null);
      toast({ title: "تم الحذف", description: "تم حذف المزرعة بنجاح." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "خطأ", description: err.message || "فشل حذف المزرعة." });
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">مزارعي</h1>
            <p className="text-muted-foreground mt-1">أدر عقاراتك الزراعية وقوائم الاستثمار.</p>
          </div>
          <Button asChild>
            <Link href="/farms/new">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مزرعة جديدة
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-secondary animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : farms.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {farms.map((farm) => (
              <Card key={farm.id} className="overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-colors">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-48 md:h-auto bg-muted relative shrink-0">
                    {farm.cover_image ? (
                      <img src={farm.cover_image} alt={farm.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                        <Sprout className="w-12 h-12 opacity-20" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-xl font-bold">{farm.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {farm.location.governorate}{farm.location.district ? `، ${farm.location.district}` : ''}
                            <span className="mx-2 text-border">•</span>
                            <span>{farm.size_feddan} فدان</span>
                          </div>
                        </div>
                        <Badge variant={farm.is_published ? "default" : "secondary"}>
                          {farm.is_published ? "منشور" : "مسودة"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <Badge variant="outline" className="capitalize">{farm.crop_type}</Badge>
                        <Badge variant="outline" className="capitalize">{statusLabel(farm.status)}</Badge>
                        <Badge variant="outline" className="text-chart-2 border-chart-2/30 bg-chart-2/10">
                          {farm.interest_count} مهتم
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/investments/farm/${farm.id}`}>طلبات الاستثمار</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/farms/${farm.id}`}>عرض</Link>
                      </Button>
                      {user && farm.owner_id === user.id && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEdit(farm)}>
                            <Pencil className="w-4 h-4 ml-1" />
                            تعديل
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => setDeleteFarmId(farm.id)}
                          >
                            <Trash2 className="w-4 h-4 ml-1" />
                            حذف
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-secondary/50 rounded-xl border border-dashed border-border/50">
            <Sprout className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold">لا توجد مزارع مدرجة</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">أدرج مزرعتك الأولى لبدء استقطاب المستثمرين وتنمية أعمالك الزراعية.</p>
            <Button asChild size="lg">
              <Link href="/farms/new">
                <Plus className="w-5 h-5 ml-2" />
                أضف مزرعتك الأولى
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Dialog open={!!editFarm} onOpenChange={(open) => !open && setEditFarm(null)}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المزرعة</DialogTitle>
            <DialogDescription>عدّل بيانات مزرعتك ثم احفظ التغييرات.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">

            {/* Cover image */}
            <div className="space-y-2">
              <Label>صورة الغلاف</Label>
              <div
                className="relative h-36 rounded-lg border border-dashed border-border bg-secondary/40 overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" alt="معاينة" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Camera className="w-8 h-8" />
                    <span className="text-sm">انقر لاختيار صورة</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم المزرعة</Label>
              <Input id="edit-name" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">الوصف</Label>
              <Textarea id="edit-desc" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نوع المحصول</Label>
                <Select value={editForm.crop_type} onValueChange={v => setEditForm(p => ({ ...p, crop_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wheat">قمح</SelectItem>
                    <SelectItem value="corn">ذرة</SelectItem>
                    <SelectItem value="rice">أرز</SelectItem>
                    <SelectItem value="vegetables">خضروات</SelectItem>
                    <SelectItem value="fruits">فاكهة</SelectItem>
                    <SelectItem value="cotton">قطن</SelectItem>
                    <SelectItem value="sugarcane">قصب السكر</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-size">المساحة (فدان)</Label>
                <Input id="edit-size" type="number" step="0.1" min="0.1" value={editForm.size_feddan} onChange={e => setEditForm(p => ({ ...p, size_feddan: e.target.value }))} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-gov">المحافظة</Label>
                <Input id="edit-gov" value={editForm.governorate} onChange={e => setEditForm(p => ({ ...p, governorate: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dist">المركز (اختياري)</Label>
                <Input id="edit-dist" value={editForm.district} onChange={e => setEditForm(p => ({ ...p, district: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-min">أدنى استثمار (ج.م)</Label>
                <Input id="edit-min" type="number" min="0" value={editForm.min_investment} onChange={e => setEditForm(p => ({ ...p, min_investment: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-roi">العائد (%)</Label>
                <Input id="edit-roi" type="number" step="0.1" min="0" value={editForm.expected_roi} onChange={e => setEditForm(p => ({ ...p, expected_roi: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dur">المدة (شهر)</Label>
                <Input id="edit-dur" type="number" min="1" value={editForm.duration_months} onChange={e => setEditForm(p => ({ ...p, duration_months: e.target.value }))} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-split">توزيع الأرباح % (اختياري)</Label>
              <Input id="edit-split" type="number" min="0" max="100" value={editForm.profit_split} onChange={e => setEditForm(p => ({ ...p, profit_split: e.target.value }))} placeholder="مثال: 50" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label>نشر القائمة</Label>
              <Switch checked={editForm.is_published} onCheckedChange={v => setEditForm(p => ({ ...p, is_published: v }))} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditFarm(null)}>إلغاء</Button>
              <Button type="submit" disabled={updateFarm.isPending || isUploading}>
                {(updateFarm.isPending || isUploading) ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteFarmId} onOpenChange={(open) => !open && setDeleteFarmId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه المزرعة؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف المزرعة وجميع بياناتها بشكل دائم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteFarmId(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFarm.isPending}
            >
              {deleteFarm.isPending ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
