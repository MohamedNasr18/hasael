import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useCreateFarm } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { FarmInputCropType } from "@workspace/api-client-react";
import { Switch } from "@/components/ui/switch";
import { Camera } from "lucide-react";

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

export default function NewFarm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createFarmMutation = useCreateFarm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    crop_type: "wheat" as FarmInputCropType,
    size_feddan: "",
    governorate: "",
    district: "",
    min_investment: "",
    expected_roi: "",
    duration_months: "",
    profit_split: "",
    is_published: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let cover_image: string | undefined;
      if (imageFile) {
        cover_image = await uploadImage(imageFile, token);
      }

      const result = await createFarmMutation.mutateAsync({
        data: {
          name: formData.name,
          description: formData.description,
          crop_type: formData.crop_type,
          size_feddan: Number(formData.size_feddan),
          location: {
            governorate: formData.governorate,
            district: formData.district || null,
          },
          cover_image,
          investment_terms: {
            min_investment: Number(formData.min_investment),
            expected_roi: Number(formData.expected_roi),
            duration_months: Number(formData.duration_months),
            profit_split: formData.profit_split ? Number(formData.profit_split) : undefined,
          },
          is_published: formData.is_published,
        },
      });

      toast({
        title: "تم إنشاء المزرعة",
        description: "تم إدراج مزرعتك بنجاح.",
      });

      setLocation(`/farms/${result.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message || "فشل إنشاء المزرعة.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدراج مزرعة جديدة</h1>
          <p className="text-muted-foreground mt-1">أدخل تفاصيل مزرعتك وشروط الاستثمار.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Image */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>صورة الغلاف</CardTitle>
              <CardDescription>أضف صورة تجذب المستثمرين وتعكس جمال أرضك.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="relative h-48 rounded-xl border-2 border-dashed border-border bg-secondary/40 overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="معاينة الصورة" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Camera className="w-10 h-10" />
                    <p className="text-sm font-medium">انقر لاختيار صورة الغلاف</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WebP — أقصى حجم 5 ميجابايت</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3">
                    <Camera className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-muted-foreground"
                  onClick={() => { setImageFile(null); setImagePreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                >
                  إزالة الصورة
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
              <CardDescription>تفاصيل عامة عن عقارك الزراعي.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المزرعة</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="مثال: مزرعة الوادي"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="اوصف جودة التربة ومصادر المياه والتاريخ الزراعي..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نوع المحصول الرئيسي</Label>
                  <Select
                    value={formData.crop_type}
                    onValueChange={(v) => handleSelectChange(v, "crop_type")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المحصول" />
                    </SelectTrigger>
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
                  <Label htmlFor="size_feddan">المساحة (فدان)</Label>
                  <Input
                    id="size_feddan"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.size_feddan}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="governorate">المحافظة</Label>
                  <Input
                    id="governorate"
                    value={formData.governorate}
                    onChange={handleChange}
                    required
                    placeholder="مثال: البحيرة"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">المركز (اختياري)</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>شروط الاستثمار</CardTitle>
              <CardDescription>حدد التوقعات المالية للمستثمرين المحتملين.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_investment">أدنى استثمار (ج.م)</Label>
                  <Input
                    id="min_investment"
                    type="number"
                    min="0"
                    value={formData.min_investment}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_roi">العائد المتوقع (%)</Label>
                  <Input
                    id="expected_roi"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.expected_roi}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_months">المدة (بالأشهر)</Label>
                  <Input
                    id="duration_months"
                    type="number"
                    min="1"
                    value={formData.duration_months}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profit_split">نسبة توزيع الأرباح % (اختياري)</Label>
                  <Input
                    id="profit_split"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.profit_split}
                    onChange={handleChange}
                    placeholder="مثال: 50 لتوزيع 50/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">نشر القائمة</Label>
                  <p className="text-sm text-muted-foreground">اجعل هذه القائمة مرئية للمستثمرين فوراً.</p>
                </div>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_published: c }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-start gap-4">
            <Button variant="outline" type="button" onClick={() => setLocation("/farms")}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createFarmMutation.isPending || isUploading}>
              {(createFarmMutation.isPending || isUploading) ? "جارٍ الحفظ..." : "إنشاء قائمة المزرعة"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
