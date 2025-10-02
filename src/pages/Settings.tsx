import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Lock,
  Sparkles,
  Save
} from "lucide-react";

interface Profile {
  full_name: string;
  credits_balance: number;
}

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    checkAuth();
    loadProfile();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({ ...formData, fullName: data.full_name || "" });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: formData.fullName })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "تم التحديث!",
        description: "تم تحديث معلومات الحساب بنجاح"
      });

      loadProfile();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast({
        title: "تم التحديث!",
        description: "تم تحديث كلمة المرور بنجاح"
      });

      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="ml-2 w-4 h-4" />
            العودة للوحة التحكم
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">الإعدادات</span>
          </h1>
          <p className="text-muted-foreground">
            إدارة حسابك وتفضيلاتك
          </p>
        </div>

        <div className="space-y-6">
          {/* Credits Card */}
          <Card className="p-6 glass border-white/10 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-warning" />
                  رصيدك الحالي
                </h3>
                <p className="text-muted-foreground text-sm">
                  استخدم الرصيد لمعالجة المزيد من الملفات الصوتية
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold gradient-text">
                  {profile?.credits_balance || 0}
                </p>
                <p className="text-sm text-muted-foreground">رصيد متاح</p>
              </div>
            </div>
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-primary to-secondary"
            >
              شراء المزيد من الرصيد
            </Button>
          </Card>

          {/* Account Information */}
          <Card className="p-6 glass border-white/10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              معلومات الحساب
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  لا يمكن تغيير البريد الإلكتروني
                </p>
              </div>

              <Button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <Save className="ml-2 w-4 h-4" />
                حفظ التغييرات
              </Button>
            </div>
          </Card>

          {/* Change Password */}
          <Card className="p-6 glass border-white/10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              تغيير كلمة المرور
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <Button
                onClick={handleUpdatePassword}
                disabled={loading || !formData.newPassword}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                <Lock className="ml-2 w-4 h-4" />
                تحديث كلمة المرور
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;