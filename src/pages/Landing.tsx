import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Mic, 
  Globe, 
  Zap, 
  Shield, 
  Users, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Upload,
  Settings,
  Download
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "التعرف الذكي على المتحدثين",
      description: "تقنية AI متقدمة تحدد المتحدثين تلقائياً وتحافظ على تميز كل صوت"
    },
    {
      icon: Mic,
      title: "استنساخ الأصوات الأصلية",
      description: "نحافظ على نبرة وخصائص الصوت الأصلي لكل متحدث في اللغة الجديدة"
    },
    {
      icon: Globe,
      title: "ترجمة احترافية بالذكاء الاصطناعي",
      description: "ترجمة دقيقة تحافظ على المعنى والسياق باستخدام GPT-4"
    },
    {
      icon: Zap,
      title: "معالجة سريعة وفعالة",
      description: "تقنيات معالجة متقدمة لإنجاز مشاريعك في أقصر وقت ممكن"
    },
    {
      icon: Shield,
      title: "أمان وخصوصية",
      description: "بياناتك محمية بأعلى معايير الأمان والتشفير"
    },
    {
      icon: Clock,
      title: "مزامنة دقيقة",
      description: "توقيت مثالي بين الصوت والترجمة للحصول على نتائج طبيعية"
    }
  ];

  const steps = [
    {
      icon: Upload,
      title: "رفع الملف",
      description: "قم برفع ملفك الصوتي بسحبه وإفلاته"
    },
    {
      icon: Settings,
      title: "اختر الإعدادات",
      description: "حدد اللغة المصدر والهدف والخيارات المتقدمة"
    },
    {
      icon: Zap,
      title: "المعالجة التلقائية",
      description: "نظامنا يتولى كل شيء: التفريغ، الترجمة، والدبلجة"
    },
    {
      icon: Download,
      title: "احصل على النتيجة",
      description: "حمل ملفك المدبلج الجاهز للاستخدام"
    }
  ];

  const pricing = [
    {
      name: "مجاني",
      price: "0",
      credits: "100",
      features: [
        "100 رصيد مجاني",
        "جودة صوت قياسية",
        "حتى 30 دقيقة",
        "2 متحدثين كحد أقصى",
        "دعم فني أساسي"
      ],
      highlighted: false
    },
    {
      name: "احترافي",
      price: "29",
      credits: "500",
      features: [
        "500 رصيد شهرياً",
        "جودة صوت عالية",
        "حتى 2 ساعة",
        "متحدثين غير محدودين",
        "معالجة أولوية",
        "دعم فني متقدم"
      ],
      highlighted: true
    },
    {
      name: "متقدم",
      price: "99",
      credits: "2000",
      features: [
        "2000 رصيد شهرياً",
        "جودة صوت فائقة",
        "وقت غير محدود",
        "متحدثين غير محدودين",
        "معالجة فورية",
        "دعم فني مخصص",
        "API مخصص"
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">DubAI</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                تسجيل الدخول
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                onClick={() => navigate("/auth?mode=signup")}
              >
                ابدأ مجاناً
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto fade-in">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              دبلجة صوتية احترافية
              <br />
              <span className="gradient-text">بالذكاء الاصطناعي</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              حول ملفاتك الصوتية لأي لغة مع الحفاظ على الأصوات الأصلية
              <br />
              تقنية متقدمة، نتائج احترافية، وقت قياسي
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg px-8 py-6 glow-primary"
                onClick={() => navigate("/dashboard")}
              >
                جرب الآن مجاناً
                <ArrowRight className="mr-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white/20 hover:bg-white/5"
              >
                شاهد كيف يعمل
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>100 رصيد مجاني</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>لا حاجة لبطاقة ائتمان</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>جاهز في دقائق</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              مميزات <span className="gradient-text">استثنائية</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              تقنيات الذكاء الاصطناعي المتقدمة في خدمتك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 glass border-white/10 hover:border-primary/30 transition-all hover-scale"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              كيف <span className="gradient-text">يعمل؟</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              أربع خطوات بسيطة للحصول على دبلجة احترافية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="p-6 glass border-white/10 text-center hover-scale">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 glow-primary">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm text-primary font-semibold mb-2">الخطوة {index + 1}</div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -left-3 w-6 h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              خطط <span className="gradient-text">مرنة</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              اختر الخطة المناسبة لاحتياجاتك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pricing.map((plan, index) => (
              <Card 
                key={index}
                className={`p-8 relative ${
                  plan.highlighted 
                    ? 'glass border-primary/50 glow-primary scale-105' 
                    : 'glass border-white/10'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-sm font-semibold">
                    الأكثر شعبية
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold gradient-text">{plan.price}</span>
                    <span className="text-muted-foreground">$/شهر</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.credits} رصيد</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-primary to-secondary'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  {plan.price === "0" ? "ابدأ مجاناً" : "اشترك الآن"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <Card className="p-12 text-center animated-gradient border-0">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              جاهز للبدء؟
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              انضم لآلاف المستخدمين الذين يثقون في DubAI لدبلجة محتواهم
            </p>
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
              onClick={() => navigate("/auth?mode=signup")}
            >
              ابدأ مجاناً الآن
              <ArrowRight className="mr-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">DubAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                دبلجة صوتية احترافية بتقنية الذكاء الاصطناعي
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">المنتج</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">المميزات</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">الأسعار</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">الشركة</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">من نحن</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">المدونة</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">الوظائف</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">الدعم</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">المساعدة</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">التواصل</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">الشروط</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center text-sm text-muted-foreground">
            <p>© 2025 DubAI. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;