import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import ShopContent from './components/ShopContent';

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar variant="dark" />
      <ShopContent />
      <Footer />
    </div>
  );
}
