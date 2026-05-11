import { useState } from "react";
import { useGetMyServices, useCreateService } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Briefcase, MapPin, Plus, Wrench, Droplet, Truck, Lightbulb } from "lucide-react";
import type { ServiceInputCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function MyServices() {
  const { data: services, isLoading } = useGetMyServices();
  const createService = useCreateService();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "machinery" as ServiceInputCategory,
    price_per_unit: "",
    unit: "hour",
    governorate: "",
    is_available: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createService.mutateAsync({
        data: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price_per_unit: Number(formData.price_per_unit),
          unit: formData.unit,
          governorate: formData.governorate || undefined,
          is_available: formData.is_available
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/services/my"] });
      setIsOpen(false);
      setFormData({
        title: "", description: "", category: "machinery", price_per_unit: "", unit: "hour", governorate: "", is_available: true
      });
      
      toast({ title: "تم إنشاء الخدمة", description: "خدمتك الآن مدرجة في السوق." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: error.message || "فشل إنشاء الخدمة." });
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'machinery': return <Wrench className="w-5 h-5" />;
      case 'irrigation': return <Droplet className="w-5 h-5" />;
      case 'logistics': return <Truck className="w-5 h-5" />;
      case 'consultancy': return <Lightbulb className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">خدماتي</h1>
            <p className="text-muted-foreground mt-1">أدر الخدمات الزراعية التي تقدّمها.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" /> إضافة خدمة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>إدراج خدمة جديدة</DialogTitle>
                <DialogDescription>أدخل تفاصيل الخدمة الزراعية التي تقدّمها.</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الخدمة</Label>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required minLength={3} placeholder="مثال: حرث بالجرار" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="اوصف خدمتك ومعداتك وخبرتك..." rows={3} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الفئة</Label>
                    <Select value={formData.category} onValueChange={(v: any) => setFormData({...formData, category: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="machinery">آليات</SelectItem>
                        <SelectItem value="irrigation">ري</SelectItem>
                        <SelectItem value="logistics">لوجستيات</SelectItem>
                        <SelectItem value="consultancy">استشارات</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="governorate">المحافظة (اختياري)</Label>
                    <Input 
                      id="governorate" 
                      value={formData.governorate} 
                      onChange={e => setFormData({...formData, governorate: e.target.value})} 
                      placeholder="مثال: الشرقية أو اتركه فارغاً للكل" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_unit">السعر (ج.م)</Label>
                    <Input 
                      id="price_per_unit" type="number" min="0" 
                      value={formData.price_per_unit} 
                      onChange={e => setFormData({...formData, price_per_unit: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">لكل</Label>
                    <Input 
                      id="unit" 
                      value={formData.unit} 
                      onChange={e => setFormData({...formData, unit: e.target.value})} 
                      required placeholder="مثال: ساعة، فدان، يوم" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>متاح للتأجير</Label>
                  </div>
                  <Switch 
                    checked={formData.is_available} 
                    onCheckedChange={v => setFormData({...formData, is_available: v})} 
                  />
                </div>

                <div className="flex justify-start gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createService.isPending}>
                    {createService.isPending ? "جارٍ الحفظ..." : "إضافة الخدمة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-secondary animate-pulse rounded-xl"></div>)}
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="bg-card border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {getCategoryIcon(service.category)}
                    </div>
                    <Badge variant={service.is_available ? "default" : "secondary"}>
                      {service.is_available ? "متاح" : "مشغول"}
                    </Badge>
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-border/50 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">السعر</p>
                      <p className="font-bold text-primary">{service.price_per_unit.toLocaleString()} ج.م <span className="font-normal text-muted-foreground">/{service.unit}</span></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">الموقع</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {service.governorate || "كل المناطق"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                    <Button variant="outline" className="flex-1">تعديل</Button>
                    <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10">حذف</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary/50 rounded-xl border border-dashed border-border/50">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">لا توجد خدمات مدرجة</h3>
            <p className="text-muted-foreground mt-2 mb-4">لم تُدرج أي خدمات زراعية بعد.</p>
            <Button onClick={() => setIsOpen(true)}>أضف خدمتك الأولى</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
