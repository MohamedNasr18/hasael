import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useSignUp } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Sprout, Tractor, Banknote, Briefcase, ShoppingBag } from "lucide-react";
import { SignUpInputRolesItem } from "@workspace/api-client-react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<SignUpInputRolesItem[]>([]);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const signUpMutation = useSignUp();

  const handleRoleToggle = (role: SignUpInputRolesItem) => {
    setRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roles.length === 0) {
      toast({
        variant: "destructive",
        title: "الدور مطلوب",
        description: "يرجى اختيار دور واحد على الأقل للمتابعة.",
      });
      return;
    }

    try {
      await signUpMutation.mutateAsync({
        data: {
          full_name: fullName,
          email,
          password,
          roles
        }
      });
      toast({
        title: "تم إنشاء الحساب",
        description: "مرحباً بك في حصائل. يرجى تسجيل الدخول.",
      });
      setLocation("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل إنشاء الحساب",
        description: error.message || "تعذّر إنشاء الحساب.",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden py-12" dir="rtl">
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Link href="/" className="mb-8 flex items-center gap-2 text-primary font-bold text-3xl tracking-tight">
        <Sprout className="w-10 h-10" />
        حصائل
      </Link>

      <Card className="w-full max-w-xl border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-muted-foreground">
            انضم إلى منظومة الاستثمار الزراعي الرائدة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input
                  id="fullName"
                  placeholder="أحمد حسن"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={3}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base font-semibold">اختر دورك (يمكن اختيار أكثر من دور)</Label>
              
              <div className="grid grid-cols-1 gap-3">
                <label className={`
                  flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
                  ${roles.includes(SignUpInputRolesItem.investor) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-secondary'}
                `}>
                  <Checkbox 
                    checked={roles.includes(SignUpInputRolesItem.investor)}
                    onCheckedChange={() => handleRoleToggle(SignUpInputRolesItem.investor)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <Banknote className="w-4 h-4 text-primary" />
                      مستثمر
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">أريد استثمار رأس المال في مشاريع زراعية</p>
                  </div>
                </label>

                <label className={`
                  flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
                  ${roles.includes(SignUpInputRolesItem.farm_owner) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-secondary'}
                `}>
                  <Checkbox 
                    checked={roles.includes(SignUpInputRolesItem.farm_owner)}
                    onCheckedChange={() => handleRoleToggle(SignUpInputRolesItem.farm_owner)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <Tractor className="w-4 h-4 text-primary" />
                      صاحب أرض
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">أملك أرضاً وأبحث عن استثمار أو خدمات</p>
                  </div>
                </label>

                <label className={`
                  flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
                  ${roles.includes(SignUpInputRolesItem.service_provider) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-secondary'}
                `}>
                  <Checkbox 
                    checked={roles.includes(SignUpInputRolesItem.service_provider)}
                    onCheckedChange={() => handleRoleToggle(SignUpInputRolesItem.service_provider)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <Briefcase className="w-4 h-4 text-primary" />
                      مزود خدمة
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">أقدم خدمات آليات أو لوجستيات أو استشارات زراعية</p>
                  </div>
                </label>

                <label className={`
                  flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors
                  ${roles.includes(SignUpInputRolesItem.user) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-secondary'}
                `}>
                  <Checkbox 
                    checked={roles.includes(SignUpInputRolesItem.user)}
                    onCheckedChange={() => handleRoleToggle(SignUpInputRolesItem.user)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      بائع منتجات
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">أريد بيع منتجات زراعية كالبذور والأسمدة والمعدات</p>
                  </div>
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={signUpMutation.isPending}
            >
              {signUpMutation.isPending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 pt-6">
          <div className="text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              سجّل الدخول
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
