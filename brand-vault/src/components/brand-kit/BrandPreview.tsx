import { ImageOff } from "lucide-react";
import { useState } from "react";
import { isHexColor, readableTextOn } from "./colors";

interface BrandPreviewProps {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
}

function Swatch({ label, color }: { label: string; color: string }) {
  const valid = isHexColor(color);
  return (
    <div className="flex-1">
      <div
        className="flex h-24 items-end rounded-xl p-3 ring-1 ring-slate-200"
        style={valid ? { backgroundColor: color, color: readableTextOn(color) } : undefined}
      >
        {!valid && <span className="text-xs text-slate-400">Invalid color</span>}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>
      <p className="font-mono text-sm text-slate-900">{valid ? color.toUpperCase() : "—"}</p>
    </div>
  );
}

export function BrandPreview({ brandName, primaryColor, secondaryColor, logoUrl }: BrandPreviewProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const url = logoUrl.trim();
  const showLogo = url !== "" && failedUrl !== url;
  const primary = isHexColor(primaryColor) ? primaryColor : "#e2e8f0";

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Preview</h2>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">
          {showLogo ? (
            <img
              src={url}
              alt={`${brandName || "Brand"} logo`}
              className="size-full object-contain"
              onError={() => setFailedUrl(url)}
            />
          ) : (
            <ImageOff className="size-6 text-slate-300" aria-label="No logo" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold text-slate-900">{brandName.trim() || "Your brand"}</p>
          {url !== "" && !showLogo && <p className="text-xs text-amber-600">Logo couldn't be loaded</p>}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Swatch label="Primary" color={primaryColor} />
        <Swatch label="Secondary" color={secondaryColor} />
      </div>

      <div
        aria-hidden
        className="mt-6 w-full rounded-lg px-4 py-2 text-center text-sm font-semibold"
        style={{ backgroundColor: primary, color: readableTextOn(primary) }}
      >
        Sample button
      </div>
    </section>
  );
}
