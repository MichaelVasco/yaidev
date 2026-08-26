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
import { openAIBuilder, readPendingPrompt, clearPendingPrompt } from "@/lib/openBuilder";
import BuildConfirmModal from "@/components/BuildConfirmModal";

const Index = () => {
  const [showAiBuilder, setShowAiBuilder] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string>("");
  const [resumeId, setResumeId] = useState<string | null>(null);
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
    const resume = params.get("resume");
    if (params.get("builder") === "1" && !loading) {
      const next = new URLSearchParams(params);
      next.delete("builder");
      next.delete("resume");
      setParams(next, { replace: true });
      // Anyone can open the builder; authentication is required at submit time.
      setPendingPrompt(readPendingPrompt());
      clearPendingPrompt();
      if (resume) setResumeId(resume);
      setShowAiBuilder(true);
    }
  }, [params, setParams, user, loading, navigate]);

  // Centralized entry point — Navbar, BuildNow prompt/button all funnel here.
  const handleOpenBuilder = (prompt?: string) => {
    if (loading) return;
    openAIBuilder({ prompt, user, navigate });
  };

  if (showAiBuilder) {
    return (
      <AiBuilder
        initialPrompt={pendingPrompt}
        resumeSessionId={resumeId}
        onBack={() => {
          setShowAiBuilder(false);
          setPendingPrompt("");
          setResumeId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar onOpenBuilder={() => handleOpenBuilder()} />
      <Hero />
      <AboutSection />
      <ProductsSection />
      <div id="features" className="scroll-mt-20" aria-hidden="true" />
      <ServicesSection />
      <TeamSection />
      <ProjectsSection />
      <div id="pricing" className="scroll-mt-20" aria-hidden="true" />
      <BuildNowSection onOpenAiBuilder={handleOpenBuilder} />
      <ContactSection />
      <Footer />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
      <BuildConfirmModal
        onConfirm={(p) => openAIBuilder({ prompt: p, user, navigate, skipConfirm: true })}
      />
    </div>
  );
};

export default Index;
