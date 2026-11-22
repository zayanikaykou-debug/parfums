import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminPage } from './pages/AdminPage';
import { BoutiquePage } from './pages/BoutiquePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';

function AppRouter() {
  const { currentPath } = useStore();
  const pathname = currentPath.split('?')[0] || '/';

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <AdminPage />;
  }

  let page = <HomePage />;
  if (pathname === '/boutique') {
    page = <BoutiquePage />;
  } else if (pathname.startsWith('/parfum/')) {
    const slug = decodeURIComponent(pathname.replace('/parfum/', ''));
    page = <ProductDetailPage slug={slug} />;
  } else if (pathname === '/panier') {
    page = <CartPage />;
  } else if (pathname === '/checkout') {
    page = <CheckoutPage />;
  } else if (pathname.startsWith('/confirmation/')) {
    const orderNumber = decodeURIComponent(pathname.replace('/confirmation/', ''));
    page = <ConfirmationPage orderNumber={orderNumber} />;
  } else if (pathname === '/contact') {
    page = <ContactPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#060B17] text-[#F7F4EE]">
      <Navbar />
      <CartDrawer />
      <div className="flex-1">{page}</div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}
