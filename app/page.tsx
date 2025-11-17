import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import LiveManufacturing from './components/landing/LiveManufacturing';
import ProductCategories from './components/landing/ProductCategories';
import AIFeatures from './components/landing/AIFeatures';
import PlatformFeatures from './components/landing/PlatformFeatures';
import HowItWorks from './components/landing/HowItWorks';
import Testimonials from './components/landing/Testimonials';
import CTA from './components/landing/CTA';
import Footer from './components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <LiveManufacturing />
      <ProductCategories />
      <AIFeatures />
      <PlatformFeatures />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
