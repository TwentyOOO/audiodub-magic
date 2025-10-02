import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProcessingStage = {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "failed";
};

const Processing = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: "uploading", label: "رفع الملف", status: "completed" },
    { id: "transcribing", label: "تفريغ الصوت", status: "pending" },
    { id: "diarization", label: "تحديد المتحدثين", status: "pending" },
    { id: "translating", label: "ترجمة النص", status: "pending" },
    { id: "synthesizing", label: "توليد الأصوات", status: "pending" },
    { id: "completed", label: "اكتمال المعالجة", status: "pending" },
  ]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Real-time updates
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          const updatedProject = payload.new;
          
          // Update stages based on status
          updateStagesFromStatus(updatedProject.status);

          // Redirect on completion
          if (updatedProject.status === "completed") {
            toast({
              title: "اكتملت المعالجة!",
              description: "جاري الانتقال لصفحة النتائج...",
            });
            setTimeout(() => navigate(`/results/${projectId}`), 1500);
          }

          // Show error on failure
          if (updatedProject.status === "failed") {
            toast({
              title: "فشلت المعالجة",
              description: "حدث خطأ أثناء معالجة المشروع",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, navigate, toast]);

  // Update stages based on project status
  useEffect(() => {
    if (project?.status) {
      updateStagesFromStatus(project.status);
    }
  }, [project?.status]);

  const updateStagesFromStatus = (status: string) => {
    setStages((prev) => {
      const newStages = [...prev];
      
      switch (status) {
        case "uploading":
          newStages[0].status = "active";
          break;
        case "transcribing":
          newStages[0].status = "completed";
          newStages[1].status = "active";
          break;
        case "diarization":
          newStages[0].status = "completed";
          newStages[1].status = "completed";
          newStages[2].status = "active";
          break;
        case "translating":
          newStages[0].status = "completed";
          newStages[1].status = "completed";
          newStages[2].status = "completed";
          newStages[3].status = "active";
          break;
        case "synthesizing":
          newStages[0].status = "completed";
          newStages[1].status = "completed";
          newStages[2].status = "completed";
          newStages[3].status = "completed";
          newStages[4].status = "active";
          break;
        case "completed":
          newStages.forEach((stage) => (stage.status = "completed"));
          break;
        case "failed":
          const currentActive = newStages.findIndex((s) => s.status === "active");
          if (currentActive !== -1) {
            newStages[currentActive].status = "failed";
          }
          break;
      }
      
      return newStages;
    });
  };

  const calculateProgress = () => {
    const completed = stages.filter((s) => s.status === "completed").length;
    return (completed / stages.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">المشروع غير موجود</h2>
          <Button onClick={() => navigate("/dashboard")}>
            العودة للوحة التحكم
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">{project.name}</h1>
            <p className="text-muted-foreground mt-1">
              {project.source_language} → {project.target_language}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            العودة
          </Button>
        </div>

        {/* Current Status Card */}
        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">حالة المعالجة</h2>
            {project.status !== "failed" && project.status !== "completed" && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </div>
          
          <Progress value={calculateProgress()} className="h-2 mb-4" />
          
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(calculateProgress())}% مكتمل
          </p>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Progress Timeline */}
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-6">مراحل المعالجة</h3>
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {stage.status === "completed" && (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    )}
                    {stage.status === "active" && (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                    {stage.status === "pending" && (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                    {stage.status === "failed" && (
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    )}
                    {index < stages.length - 1 && (
                      <div className="h-8 w-px bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p
                      className={`font-medium ${
                        stage.status === "active"
                          ? "text-primary"
                          : stage.status === "completed"
                          ? "text-success"
                          : stage.status === "failed"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Audio Player */}
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4">الملف الصوتي الأصلي</h3>
            {project.original_audio_url ? (
              <div className="space-y-4">
                <audio
                  controls
                  className="w-full"
                  src={project.original_audio_url}
                >
                  متصفحك لا يدعم تشغيل الصوت
                </audio>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>المدة: {project.duration_seconds}s</p>
                  <p>اللغة المصدر: {project.source_language}</p>
                  <p>اللغة الهدف: {project.target_language}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>لا يوجد ملف صوتي متاح</p>
              </div>
            )}
          </Card>
        </div>

        {/* Error Message */}
        {project.status === "failed" && (
          <Card className="glass p-6 border-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  فشلت المعالجة
                </h3>
                <p className="text-muted-foreground mb-4">
                  حدث خطأ أثناء معالجة المشروع. يرجى المحاولة مرة أخرى.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  العودة للوحة التحكم
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Processing;
