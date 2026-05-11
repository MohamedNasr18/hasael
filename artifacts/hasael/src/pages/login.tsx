import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useSignIn } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sprout } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setAuthData } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const signInMutation = useSignIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await signInMutation.mutateAsync({ data: { email, password } });
      setAuthData(response.token, response.user);
      toast({
        title: "مرحباً بعودتك",
        description: "تم تسجيل الدخول إلى حصائل بنجاح.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل تسجيل الدخول",
        description: error.message || "بيانات غير صحيحة. حاول مرة أخرى.",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden" dir="rtl">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-chart-4/10 rounded-full blur-[100px] pointer-events-none" />

      <Link href="/" className="mb-8 flex items-center gap-2 text-primary font-bold text-3xl tracking-tight">
        <Sprout className="w-10 h-10" />
        حصائل
      </Link>

      <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">تسجيل الدخول</CardTitle>
          <CardDescription className="text-muted-foreground">
            أدخل بياناتك للوصول إلى حسابك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="bg-background"
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={signInMutation.isPending}
            >
              {signInMutation.isPending ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 pt-4">
          <div className="text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              أنشئ حساباً
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
