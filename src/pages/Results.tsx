import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Download, 
  Share2, 
  RefreshCw, 
  Trash2,
  Music,
  FileText,
  Clock,
  Users,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const Results = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: project, isLoading: projectLoading } = useQuery({
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

  const { data: speakers, isLoading: speakersLoading } = useQuery({
    queryKey: ["speakers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speakers")
        .select("*")
        .eq("project_id", projectId)
        .order("speaker_number", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: transcriptions, isLoading: transcriptionsLoading } = useQuery({
    queryKey: ["transcriptions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transcriptions")
        .select("*")
        .eq("project_id", projectId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const handleDownload = async (type: "audio" | "original" | "translation" | "srt") => {
    try {
      if (type === "audio" && project?.dubbed_audio_url) {
        window.open(project.dubbed_audio_url, "_blank");
      } else if (type === "original" && transcriptions) {
        const text = transcriptions.map(t => t.original_text).join("\n\n");
        downloadTextFile(text, `${project?.name}_original.txt`);
      } else if (type === "translation" && transcriptions) {
        const text = transcriptions.map(t => t.translated_text).join("\n\n");
        downloadTextFile(text, `${project?.name}_translation.txt`);
      } else if (type === "srt" && transcriptions) {
        const srt = generateSRT(transcriptions);
        downloadTextFile(srt, `${project?.name}.srt`);
      }

      toast({
        title: "تم التحميل",
        description: "تم تحميل الملف بنجاح",
      });
    } catch (error) {
      toast({
        title: "فشل التحميل",
        description: "حدث خطأ أثناء تحميل الملف",
        variant: "destructive",
      });
    }
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateSRT = (transcriptions: any[]) => {
    return transcriptions
      .map((t, index) => {
        const startTime = formatSRTTime(t.start_time);
        const endTime = formatSRTTime(t.end_time);
        return `${index + 1}\n${startTime} --> ${endTime}\n${t.translated_text || t.original_text}\n`;
      })
      .join("\n");
  };

  const formatSRTTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
  };

  const handleShare = () => {
    if (navigator.share && project?.dubbed_audio_url) {
      navigator.share({
        title: project.name,
        text: `استمع إلى الدبلجة: ${project.name}`,
        url: project.dubbed_audio_url,
      }).catch(() => {
        toast({
          title: "المشاركة غير متاحة",
          description: "يرجى نسخ الرابط يدوياً",
          variant: "destructive",
        });
      });
    } else {
      navigator.clipboard.writeText(project?.dubbed_audio_url || "");
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرابط إلى الحافظة",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المشروع؟")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المشروع بنجاح",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "فشل الحذف",
        description: "حدث خطأ أثناء حذف المشروع",
        variant: "destructive",
      });
    }
  };

  const totalWords = transcriptions?.reduce(
    (acc, t) => acc + (t.original_text?.split(" ").length || 0),
    0
  ) || 0;

  if (projectLoading || speakersLoading || transcriptionsLoading) {
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
          <h2 className="text-xl font-bold mb-4">المشروع غير موجود</h2>
          <Button onClick={() => navigate("/dashboard")}>
            العودة للوحة التحكم
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">{project.name}</h1>
            <p className="text-muted-foreground">
              اكتمل في {format(new Date(project.processing_completed_at || project.created_at), "dd MMMM yyyy، HH:mm", { locale: ar })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
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

        {/* Audio Comparison */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original Audio */}
          <Card className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">الصوت الأصلي</h3>
            </div>
            {project.original_audio_url ? (
              <div className="space-y-4">
                <audio controls className="w-full" src={project.original_audio_url}>
                  متصفحك لا يدعم تشغيل الصوت
                </audio>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>اللغة: {project.source_language}</p>
                  <p>المدة: {project.duration_seconds}s</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                لا يوجد ملف صوتي متاح
              </p>
            )}
          </Card>

          {/* Dubbed Audio */}
          <Card className="glass p-6 border-primary">
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">الصوت المدبلج</h3>
            </div>
            {project.dubbed_audio_url ? (
              <div className="space-y-4">
                <audio controls className="w-full" src={project.dubbed_audio_url}>
                  متصفحك لا يدعم تشغيل الصوت
                </audio>
                <div className="text-sm text-muted-foreground space-y-1 mb-4">
                  <p>اللغة: {project.target_language}</p>
                  <p>المدة: {project.duration_seconds}s</p>
                </div>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => handleDownload("audio")}
                >
                  <Download className="h-5 w-5" />
                  تحميل الصوت المدبلج
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                لا يوجد ملف مدبلج متاح
              </p>
            )}
          </Card>
        </div>

        {/* Statistics */}
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4">إحصائيات</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{speakers?.length || 0}</p>
                <p className="text-sm text-muted-foreground">متحدثين</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalWords}</p>
                <p className="text-sm text-muted-foreground">كلمة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{project.duration_seconds}s</p>
                <p className="text-sm text-muted-foreground">المدة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{transcriptions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">مقطع</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Download Section */}
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4">تحميل الملفات</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleDownload("audio")}
            >
              <Download className="h-4 w-4" />
              الصوت المدبلج
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleDownload("original")}
            >
              <Download className="h-4 w-4" />
              النص الأصلي
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleDownload("translation")}
            >
              <Download className="h-4 w-4" />
              الترجمة
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleDownload("srt")}
            >
              <Download className="h-4 w-4" />
              SRT ملف
            </Button>
          </div>
        </Card>

        {/* Speakers Section */}
        {speakers && speakers.length > 0 && (
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4">المتحدثون</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {speakers.map((speaker) => {
                const speakerTranscriptions = transcriptions?.filter(
                  (t) => t.speaker_id === speaker.id
                ) || [];

                return (
                  <Card key={speaker.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">متحدث {speaker.speaker_number}</h4>
                      <span className="text-sm text-muted-foreground">
                        {speakerTranscriptions.length} مقطع
                      </span>
                    </div>
                    {speaker.voice_sample_url && (
                      <audio
                        controls
                        className="w-full mb-2"
                        src={speaker.voice_sample_url}
                      >
                        متصفحك لا يدعم تشغيل الصوت
                      </audio>
                    )}
                    <p className="text-sm text-muted-foreground">
                      المدة الإجمالية: {speaker.total_duration || 0}s
                    </p>
                  </Card>
                );
              })}
            </div>
          </Card>
        )}

        {/* Transcription Tabs */}
        {transcriptions && transcriptions.length > 0 && (
          <Card className="glass p-6">
            <Tabs defaultValue="original" dir="rtl">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="original">النص الأصلي</TabsTrigger>
                <TabsTrigger value="translation">الترجمة</TabsTrigger>
                <TabsTrigger value="comparison">مقارنة</TabsTrigger>
              </TabsList>

              <TabsContent value="original" className="space-y-4 mt-4">
                {transcriptions.map((t, index) => (
                  <div key={t.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.start_time.toFixed(2)}s - {t.end_time.toFixed(2)}s
                      </span>
                    </div>
                    <p className="text-sm">{t.original_text}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="translation" className="space-y-4 mt-4">
                {transcriptions.map((t, index) => (
                  <div key={t.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.start_time.toFixed(2)}s - {t.end_time.toFixed(2)}s
                      </span>
                    </div>
                    <p className="text-sm">{t.translated_text || "لا توجد ترجمة"}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4 mt-4">
                {transcriptions.map((t, index) => (
                  <div key={t.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.start_time.toFixed(2)}s - {t.end_time.toFixed(2)}s
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          الأصلي
                        </p>
                        <p className="text-sm">{t.original_text}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          الترجمة
                        </p>
                        <p className="text-sm">{t.translated_text || "لا توجد ترجمة"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        )}

        {/* Actions */}
        <Card className="glass p-6">
          <h3 className="text-lg font-semibold mb-4">إجراءات</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" className="gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              مشاركة
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/upload")}
            >
              <RefreshCw className="h-4 w-4" />
              معالجة جديدة
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              حذف المشروع
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Results;
