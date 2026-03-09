import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import ApparelCategories from './components/landing/ApparelCategories';
// import LiveManufacturing from './components/landing/LiveManufacturing';
import ProductCategories from './components/landing/ProductCategories';
import AIFeatures from './components/landing/AIFeatures';
// import Pricing from './components/landing/Pricing';
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
      {/* <LiveManufacturing /> */}
      <ProductCategories />
      <AIFeatures />
      {/* <Pricing /> */}
      <PlatformFeatures />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}
