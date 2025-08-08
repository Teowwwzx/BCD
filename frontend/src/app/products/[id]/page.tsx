import React from 'react';
import ProductDetailClient from '../../../components/ProductDetailClient';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  // We can safely access params.id here because this is a Server Component
  const { id } = params;

  return (
    <div className="min-h-screen bg-[#0d0221] text-[#00f5c3] font-mono-pixel">
      <Header />
      <ProductDetailClient id={id} />
      <Footer />
    </div>
  );
}