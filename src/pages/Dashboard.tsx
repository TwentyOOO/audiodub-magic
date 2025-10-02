import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  Trash2,
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  source_language: string;
  target_language: string;
  duration_seconds: number | null;
  created_at: string;
  dubbed_audio_url: string | null;
}

interface Profile {
  full_name: string;
  credits_balance: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    hours: 0
  });

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Calculate stats
      const total = projectsData?.length || 0;
      const completed = projectsData?.filter(p => p.status === "completed").length || 0;
      const processing = projectsData?.filter(p => p.status === "processing").length || 0;
      const totalSeconds = projectsData?.reduce((acc, p) => acc + (p.duration_seconds || 0), 0) || 0;
      const hours = Math.round((totalSeconds / 3600) * 10) / 10;

      setStats({ total, completed, processing, hours });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/landing");
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المشروع بنجاح"
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "processing":
        return <Clock className="w-5 h-5 text-warning animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل";
      case "processing":
        return "جاري المعالجة";
      case "failed":
        return "فشل";
      default:
        return "في الانتظار";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">DubAI</h1>
                <p className="text-xs text-muted-foreground">لوحة التحكم</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{profile?.full_name || "مستخدم"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-warning" />
                  {profile?.credits_balance || 0} رصيد
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 glass border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي المشاريع</p>
                <p className="text-3xl font-bold gradient-text">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Mic className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">مكتملة</p>
                <p className="text-3xl font-bold text-success">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">قيد المعالجة</p>
                <p className="text-3xl font-bold text-warning">{stats.processing}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">ساعات معالجة</p>
                <p className="text-3xl font-bold gradient-text">{stats.hours}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>
        </div>

        {/* New Project Button */}
        <div className="mb-8">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity glow-primary"
            onClick={() => navigate("/upload")}
          >
            <Plus className="ml-2 w-5 h-5" />
            مشروع جديد
          </Button>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">مشاريعي</h2>
          
          {projects.length === 0 ? (
            <Card className="p-12 glass border-white/10 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد مشاريع بعد</h3>
              <p className="text-muted-foreground mb-6">
                ابدأ مشروعك الأول الآن ودع الذكاء الاصطناعي يقوم بالدبلجة
              </p>
              <Button
                className="bg-gradient-to-r from-primary to-secondary"
                onClick={() => navigate("/upload")}
              >
                <Plus className="ml-2 w-5 h-5" />
                إنشاء مشروع جديد
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="p-6 glass border-white/10 hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(project.status)}
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {getStatusText(project.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{project.source_language} → {project.target_language}</span>
                        <span>•</span>
                        <span>{new Date(project.created_at).toLocaleDateString("ar")}</span>
                        {project.duration_seconds && (
                          <>
                            <span>•</span>
                            <span>{Math.round(project.duration_seconds / 60)} دقيقة</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {project.status === "completed" && project.dubbed_audio_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/results/${project.id}`)}
                        >
                          <Download className="w-5 h-5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;