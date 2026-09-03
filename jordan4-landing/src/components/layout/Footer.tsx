import { PRODUCT } from "@/lib/data";

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-obsidian px-6 pb-32 pt-20 md:px-12 md:pb-20">
      <div className="mx-auto grid max-w-[1600px] gap-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-3xl tracking-wide text-bone">AIR JORDAN IV</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-fog">
            A limited, museum-grade reissue of the silhouette that changed
            basketball footwear forever. Engineered in 1989. Reintroduced for
            those who collect the culture.
          </p>
          <p className="mt-6 text-xs uppercase tracking-widest2 text-gold">
            {PRODUCT.edition}
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Explore</p>
          <ul className="space-y-3 text-sm text-fog">
            <li><a href="#heritage" className="hover:text-bone">Heritage</a></li>
            <li><a href="#craft" className="hover:text-bone">Craft &amp; Materials</a></li>
            <li><a href="#colorways" className="hover:text-bone">Colorways</a></li>
            <li><a href="#reviews" className="hover:text-bone">Reviews</a></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Support</p>
          <ul className="space-y-3 text-sm text-fog">
            <li><a href="#faq" className="hover:text-bone">FAQ</a></li>
            <li><a href="#faq" className="hover:text-bone">Size Guide</a></li>
            <li><a href="#faq" className="hover:text-bone">Shipping &amp; Returns</a></li>
            <li><a href="#faq" className="hover:text-bone">Authentication</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-16 flex max-w-[1600px] flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-fog/70 md:flex-row md:items-center">
        <p>&copy; {new Date().getFullYear()} Air Jordan Archive. Not an official Nike, Inc. property — concept build.</p>
        <p className="uppercase tracking-widest2">Designed for the culture</p>
      </div>
    </footer>
  );
}
