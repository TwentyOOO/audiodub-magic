import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload as UploadIcon, 
  File, 
  X, 
  Music,
  ArrowLeft,
  Play,
  Pause
} from "lucide-react";

const SUPPORTED_FORMATS = [".mp3", ".wav", ".m4a", ".ogg", ".flac"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const LANGUAGES = [
  { code: "ar", name: "العربية" },
  { code: "en", name: "الإنجليزية" },
  { code: "fr", name: "الفرنسية" },
  { code: "es", name: "الإسبانية" },
  { code: "de", name: "الألمانية" },
  { code: "it", name: "الإيطالية" },
  { code: "tr", name: "التركية" },
  { code: "ru", name: "الروسية" },
  { code: "zh", name: "الصينية" },
  { code: "ja", name: "اليابانية" }
];

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const [formData, setFormData] = useState({
    projectName: "",
    sourceLanguage: "",
    targetLanguage: "",
    numberOfSpeakers: "2",
    audioQuality: "standard"
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioUrl, audioElement]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      toast({
        title: "صيغة غير مدعومة",
        description: `الصيغ المدعومة: ${SUPPORTED_FORMATS.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "الملف كبير جداً",
        description: "الحد الأقصى لحجم الملف هو 500 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    setFile(file);
    
    // Create audio URL for preview
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // Set project name from file name
    if (!formData.projectName) {
      const nameWithoutExt = file.name.split(".").slice(0, -1).join(".");
      setFormData({ ...formData, projectName: nameWithoutExt });
    }

    toast({
      title: "تم رفع الملف!",
      description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    });
  };

  const togglePlayPause = () => {
    if (!audioUrl) return;

    if (!audioElement) {
      const audio = new Audio(audioUrl);
      audio.addEventListener("ended", () => setIsPlaying(false));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const removeFile = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setFile(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setAudioElement(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف صوتي",
        variant: "destructive"
      });
      return;
    }

    if (!formData.projectName || !formData.sourceLanguage || !formData.targetLanguage) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مصرح");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      setUploadProgress(10);

      const { error: uploadError } = await supabase.storage
        .from("audio-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      
      setUploadProgress(80);

      const { data: urlData } = supabase.storage
        .from("audio-files")
        .getPublicUrl(fileName);

      setUploadProgress(95);

      // Create project in database
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: formData.projectName,
          status: "uploading",
          source_language: formData.sourceLanguage,
          target_language: formData.targetLanguage,
          original_audio_url: urlData.publicUrl
        })
        .select()
        .single();

      if (projectError) throw projectError;

      setUploadProgress(100);

      toast({
        title: "تم رفع الملف!",
        description: "سيتم بدء المعالجة قريباً"
      });

      // Navigate to processing page
      setTimeout(() => {
        navigate(`/processing/${project.id}`);
      }, 1000);

    } catch (error: any) {
      toast({
        title: "خطأ في الرفع",
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            رفع <span className="gradient-text">ملف صوتي</span>
          </h1>
          <p className="text-muted-foreground">
            ارفع ملفك الصوتي واختر اللغة المصدر والهدف
          </p>
        </div>

        <Card className="p-8 glass border-white/10 space-y-6">
          {/* Upload Area */}
          {!file ? (
            <div
              className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <UploadIcon className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                اسحب الملف وأفلته هنا
              </h3>
              <p className="text-muted-foreground mb-4">
                أو انقر لاختيار ملف
              </p>
              <p className="text-sm text-muted-foreground">
                الصيغ المدعومة: MP3, WAV, M4A, OGG, FLAC (حد أقصى 500 ميجابايت)
              </p>
              <input
                id="file-input"
                type="file"
                accept={SUPPORTED_FORMATS.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">اسم المشروع *</Label>
              <Input
                id="projectName"
                placeholder="مثال: فيديو تعليمي - الدرس الأول"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sourceLanguage">اللغة المصدر *</Label>
                <Select
                  value={formData.sourceLanguage}
                  onValueChange={(value) => setFormData({ ...formData, sourceLanguage: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="اختر اللغة" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetLanguage">اللغة الهدف *</Label>
                <Select
                  value={formData.targetLanguage}
                  onValueChange={(value) => setFormData({ ...formData, targetLanguage: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="اختر اللغة" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfSpeakers">عدد المتحدثين</Label>
                <Select
                  value={formData.numberOfSpeakers}
                  onValueChange={(value) => setFormData({ ...formData, numberOfSpeakers: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 متحدث</SelectItem>
                    <SelectItem value="2">2 متحدثين</SelectItem>
                    <SelectItem value="3">3 متحدثين</SelectItem>
                    <SelectItem value="4">4 متحدثين</SelectItem>
                    <SelectItem value="5">5 متحدثين</SelectItem>
                    <SelectItem value="auto">تحديد تلقائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioQuality">جودة الصوت</Label>
                <Select
                  value={formData.audioQuality}
                  onValueChange={(value) => setFormData({ ...formData, audioQuality: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">قياسية</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>جاري الرفع...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg py-6"
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading ? "جاري الرفع..." : "بدء المعالجة"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Upload;