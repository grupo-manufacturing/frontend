import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import ApparelCategories from './components/landing/ApparelCategories';
import ProductCategories from './components/landing/ProductCategories';
import AIFeatures from './components/landing/AIFeatures';
import PlatformFeatures from './components/landing/PlatformFeatures';
import Testimonials from './components/landing/Testimonials';
import FinalCTA from './components/landing/FinalCTA';
import Footer from './components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ApparelCategories />
      <ProductCategories />
      <AIFeatures />
      <PlatformFeatures />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}
