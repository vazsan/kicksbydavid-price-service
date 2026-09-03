"use client";

import { useState } from "react";
import { PRODUCT } from "@/lib/nb740-data";
import { ProductNav } from "@/components/product/ProductNav";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductDetails } from "@/components/product/ProductDetails";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductFooter } from "@/components/product/ProductFooter";
import { MobileBuyBar } from "@/components/product/MobileBuyBar";

export default function NB740Page() {
  const [selectedSize, setSelectedSize] = useState<string | null>(PRODUCT.urlSize);

  return (
    <main className="min-h-screen bg-[#f7f4ec] text-[#1f2318]">
      <ProductNav />

      <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-8 md:px-10">
        <nav className="mb-6 flex items-center gap-2 text-xs text-[#8a8870]">
          <a href="/" className="hover:text-[#1f2318]">Főoldal</a>
          <span>/</span>
          <a href="#" className="hover:text-[#1f2318]">Férfi cipők</a>
          <span>/</span>
          <span className="text-[#1f2318]">{PRODUCT.name}</span>
        </nav>

        <div id="buy-box" className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery />
          <BuyBox onSizeChange={setSelectedSize} />
        </div>

        <ProductDetails />
        <ReviewsSection />
        <RelatedProducts />
      </div>

      <ProductFooter />
      <MobileBuyBar selectedSize={selectedSize} />
    </main>
  );
}
