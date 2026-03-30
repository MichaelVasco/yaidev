import { useState } from "react";
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

const Index = () => {
  const [showAiBuilder, setShowAiBuilder] = useState(false);

  if (showAiBuilder) {
    return <AiBuilder onBack={() => setShowAiBuilder(false)} />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <AboutSection />
      <ProductsSection />
      <ServicesSection />
      <TeamSection />
      <ProjectsSection />
      <BuildNowSection onOpenAiBuilder={() => setShowAiBuilder(true)} />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
