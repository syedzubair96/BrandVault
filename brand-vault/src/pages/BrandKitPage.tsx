import { AlertTriangle, CheckCircle2, Palette } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { listBrandKits, type BrandKit } from "../api/brandKit";
import { BrandKitForm } from "../components/brand-kit/BrandKitForm";
import { Loader } from "../components/Loader";
import { Toaster } from "react-hot-toast";

export function BrandKitPage() {
  const [kit, setKit] = useState<BrandKit | null>();

  useEffect(() => {
    getBrandKit();
  }, []);

  const getBrandKit = () => {
    listBrandKits()
      .then((kits) => setKit(kits[0] ?? null))
      .catch((err: unknown) => {
        console.error("Error fetching brand kit:", err);
      });
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="mx-auto max-w-5xl p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Brand Kit</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your brand's name, colors and logo in one place.
            </p>
          </div>
        </header>

        {kit === undefined ? (
          <Loader />
        ) : (
          <>
            {!kit && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4">
                <Palette
                  className="size-5 shrink-0 text-indigo-500"
                  aria-hidden
                />
                <p className="text-sm text-slate-600">
                  You don't have a brand kit yet. Fill in the details below to
                  create one.
                </p>
              </div>
            )}
            <BrandKitForm
              key={kit ? `${kit.id}-${kit.updatedAt}` : "new"}
              kit={kit}
              onSaved={(saved) => {
                setKit(saved);
              }}
              onDeleted={() => {
                setKit(null);
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
