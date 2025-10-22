import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LiveManufacturing from './components/LiveManufacturing';
import ProductCategories from './components/ProductCategories';
import AIFeatures from './components/AIFeatures';
import PlatformFeatures from './components/PlatformFeatures';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

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
