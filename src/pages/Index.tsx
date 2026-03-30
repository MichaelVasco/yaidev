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

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <AboutSection />
    <ProductsSection />
    <ServicesSection />
    <TeamSection />
    <ProjectsSection />
    <BuildNowSection />
    <ContactSection />
    <Footer />
  </div>
);

export default Index;
