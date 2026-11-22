import { Suspense, lazy } from 'react';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { StoreProvider, useStore } from './context/StoreContext';
import { HomePage } from './pages/HomePage';

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const BoutiquePage = lazy(() =>
  import('./pages/BoutiquePage').then((m) => ({ default: m.BoutiquePage }))
);
const CartPage = lazy(() =>
  import('./pages/CartPage').then((m) => ({ default: m.CartPage }))
);
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const ConfirmationPage = lazy(() =>
  import('./pages/ConfirmationPage').then((m) => ({ default: m.ConfirmationPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage }))
);

function RouteFallback() {
  return <div className="min-h-[65vh] bg-[#060B17]" />;
}

function AppRouter() {
  const { currentPath } = useStore();
  const pathname = currentPath.split('?')[0] || '/';

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#060B17]" />}>
        <AdminPage />
      </Suspense>
    );
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
      <div className="flex-1">
        <Suspense fallback={<RouteFallback />}>{page}</Suspense>
      </div>
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
