import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import ApparelCategories from './components/landing/ApparelCategories';
import ProductCategories from './components/landing/ProductCategories';
import AIFeatures from './components/landing/AIFeatures';
import PlatformFeatures from './components/landing/PlatformFeatures';
import GlobalExports from './components/landing/GlobalExports';
import WholesaleShop from './components/landing/WholesaleShop';
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
      <GlobalExports />
      <WholesaleShop />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}
