import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import ProductsSection from "@/components/ProductsSection";
import ServicesSection from "@/components/ServicesSection";
import TeamSection from "@/components/TeamSection";
import ProjectsSection from "@/components/ProjectsSection";
import BuildNowSection from "@/components/BuildNowSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import AiBuilder from "@/components/AiBuilder";
import PaywallModal from "@/components/PaywallModal";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [showAiBuilder, setShowAiBuilder] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    if (params.get("upgrade") === "1") {
      setShowPaywall(true);
      const next = new URLSearchParams(params);
      next.delete("upgrade");
      setParams(next, { replace: true });
    }
    if (params.get("builder") === "1") {
      if (!loading) {
        const next = new URLSearchParams(params);
        next.delete("builder");
        setParams(next, { replace: true });
        if (!user) navigate("/auth?redirect=/?builder=1");
        else setShowAiBuilder(true);
      }
    }
  }, [params, setParams, user, loading, navigate]);

  const openBuilder = () => {
    if (loading) return;
    if (!user) { navigate("/auth?redirect=/?builder=1"); return; }
    setShowAiBuilder(true);
  };

  if (showAiBuilder) return <AiBuilder onBack={() => setShowAiBuilder(false)} />;

  return (
    <div className="min-h-screen">
      <Navbar onOpenBuilder={openBuilder} />
      <Hero />
      <AboutSection />
      <ProductsSection />
      <ServicesSection />
      <TeamSection />
      <ProjectsSection />
      <BuildNowSection onOpenAiBuilder={openBuilder} />
      <ContactSection />
      <Footer />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
};

export default Index;
