export function ProductFooter() {
  return (
    <footer className="mt-24 border-t border-[#e2ddc9] bg-[#f1ede1] px-6 py-12 md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <p className="text-lg font-bold text-[#1f2318]">
          KICKS<span className="text-[#7a8a3a]">BY</span>DAVID
        </p>
        <p className="text-xs text-[#7a7a63]">
          &copy; {new Date().getFullYear()} Kicks by David. Minden jog fenntartva.
        </p>
      </div>
    </footer>
  );
}
