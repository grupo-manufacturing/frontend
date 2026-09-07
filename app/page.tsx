import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import GlobalReach from './components/landing/GlobalReach';
import AboutGrupo from './components/landing/AboutGrupo';
import ProductRange from './components/landing/ProductRange';
import HowWeManufacture from './components/landing/HowWeManufacture';
import WhyGrupo from './components/landing/WhyGrupo';
import Footer from './components/landing/Footer';
import ScrollChrome from './components/landing/ScrollChrome';

export default function Home() {
  return (
    <main className="min-h-screen bg-surface">
      <ScrollChrome />
      <Navbar variant="dark" />
      <Hero />
      <GlobalReach />
      <AboutGrupo />
      <ProductRange />
      <HowWeManufacture />
      <WhyGrupo />
      <Footer />
    </main>
  );
}
