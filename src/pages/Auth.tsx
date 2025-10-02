import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
});

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة")
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(
    (searchParams.get("mode") as "login" | "signup") || "login"
  );
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleLogin = async () => {
    try {
      loginSchema.parse(formData);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "مرحباً بك!",
          description: "تم تسجيل الدخول بنجاح"
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "خطأ في البيانات",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message || "تحقق من البريد الإلكتروني وكلمة المرور",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      signupSchema.parse(formData);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "تم إنشاء الحساب!",
          description: "مرحباً بك في DubAI"
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "خطأ في البيانات",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: error.message || "حدث خطأ أثناء إنشاء الحساب",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate("/landing")}
        >
          <ArrowLeft className="ml-2 w-4 h-4" />
          العودة للرئيسية
        </Button>

        <Card className="p-8 glass border-white/10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 glow-primary">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "login" 
                ? "أدخل بياناتك للوصول لحسابك" 
                : "ابدأ رحلتك مع DubAI مجاناً"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  الاسم الكامل
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading 
                ? "جاري المعالجة..." 
                : mode === "login" 
                  ? "تسجيل الدخول" 
                  : "إنشاء حساب"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "login" 
                ? "ليس لديك حساب؟" 
                : "لديك حساب بالفعل؟"}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary hover:underline mr-1"
              >
                {mode === "login" ? "سجل الآن" : "سجل الدخول"}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;