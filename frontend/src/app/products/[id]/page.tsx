// frontend/src/app/products/[id]/page.tsx

'use client'; // 1. Convert this page to a Client Component

import { useParams } from 'next/navigation'; // 2. Import the useParams hook
import ProductDetailClient from '../../../components/ProductDetailClient';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

// 3. This is now a standard (non-async) Client Component
export default function ProductDetailPage() {
  const params = useParams();
  
  // 4. Safely get the ID from the hook's result. It can be a string or string[].
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  // console.log('PAGE COMPONENT (/products/[id]/page.tsx): Received id:', id);

  return (
    <div className="min-h-screen bg-[#0d0221]">
      <Header />
      <main>
        {/* We render the detail component only if we have a valid ID */}
        {id ? <ProductDetailClient id={id} /> : <div>Loading...</div>}
      </main>
      <Footer />
    </div>
  );
}