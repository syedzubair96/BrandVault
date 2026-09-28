import { useState, type FormEvent } from "react";
import {
  createBrandKit,
  deleteBrandKit,
  updateBrandKit,
  type BrandKit,
  type BrandKitInput,
} from "../../api/brandKit";
import { BrandPreview } from "./BrandPreview";
import { isHexColor, toPickerValue } from "./colors";
import { toast } from "react-hot-toast";

const BRAND_NAME_MAX = 100;

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-invalid:border-red-400";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

type FieldErrors = Partial<Record<keyof BrandKitInput, string>>;

const EMPTY: BrandKitInput = {
  BrandName: "",
  PrimaryColor: "#4F46E5",
  SecondaryColor: "#F1F5F9",
  LogoURL: "",
};

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function validate(values: BrandKitInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.BrandName) errors.BrandName = "Enter a brand name.";
  else if (values.BrandName.length > BRAND_NAME_MAX)
    errors.BrandName = `Brand name can be at most ${BRAND_NAME_MAX} characters.`;
  if (!isHexColor(values.PrimaryColor)) errors.PrimaryColor = "Use a hex color like #1A2B3C.";
  if (!isHexColor(values.SecondaryColor)) errors.SecondaryColor = "Use a hex color like #1A2B3C.";
  if (!isHttpUrl(values.LogoURL)) errors.LogoURL = "Enter a full http(s) URL.";
  return errors;
}

function normalize(values: BrandKitInput): BrandKitInput {
  return {
    BrandName: values.BrandName.trim(),
    PrimaryColor: values.PrimaryColor.trim().toUpperCase(),
    SecondaryColor: values.SecondaryColor.trim().toUpperCase(),
    LogoURL: values.LogoURL.trim(),
  };
}

function changedFields(kit: BrandKit, values: BrandKitInput): Partial<BrandKitInput> {
  const changes: Partial<BrandKitInput> = {};
  if (values.BrandName !== kit.BrandName) changes.BrandName = values.BrandName;
  if (values.PrimaryColor !== kit.PrimaryColor.toUpperCase()) changes.PrimaryColor = values.PrimaryColor;
  if (values.SecondaryColor !== kit.SecondaryColor.toUpperCase())
    changes.SecondaryColor = values.SecondaryColor;
  if (values.LogoURL !== kit.LogoURL) changes.LogoURL = values.LogoURL;
  return changes;
}

interface ColorFieldProps {
  id: "PrimaryColor" | "SecondaryColor";
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function ColorField({ id, label, value, error, onChange }: ColorFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={toPickerValue(value)}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9.5 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        />
        <input
          id={id}
          type="text"
          value={value}
          maxLength={7}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} font-mono uppercase`}
          placeholder="#1A2B3C"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface BrandKitFormProps {
  kit: BrandKit | null;
  onSaved: (kit: BrandKit) => void;
  onDeleted: () => void;
}

export function BrandKitForm({ kit, onSaved, onDeleted }: BrandKitFormProps) {
  const [values, setValues] = useState<BrandKitInput>(() =>
    kit
      ? {
          BrandName: kit.BrandName,
          PrimaryColor: kit.PrimaryColor,
          SecondaryColor: kit.SecondaryColor,
          LogoURL: kit.LogoURL,
        }
      : EMPTY,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"saving" | "deleting" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const normalized = normalize(values);
  const changes = kit ? changedFields(kit, normalized) : null;
  const isDirty = !kit || Object.keys(changes ?? {}).length > 0;

  function setField<K extends keyof BrandKitInput>(key: K, value: BrandKitInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(normalized);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBusy("saving");
    setFormError(null);
    try {
      const saved = kit ? await updateBrandKit(kit.id, changes ?? {}) : await createBrandKit(normalized);
      toast.success('Brand information saved successfully');
      onSaved(saved);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the brand kit.");
      setBusy(null);
      toast.error('Failed to save brand information');
    }
  }

  async function handleDelete() {
    if (!kit) return;
    setBusy("deleting");
    setFormError(null);
    try {
      await deleteBrandKit(kit.id);
      onDeleted();
      toast.success('Brand kit deleted successfully');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete the brand kit.");
      setBusy(null);
      setConfirmingDelete(false);
      toast.error('Failed to delete brand kit');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <div>
          <label htmlFor="BrandName" className={labelClass}>
            Brand name
          </label>
          <input
            id="BrandName"
            type="text"
            maxLength={BRAND_NAME_MAX}
            value={values.BrandName}
            aria-invalid={fieldErrors.BrandName ? true : undefined}
            aria-describedby={fieldErrors.BrandName ? "BrandName-error" : undefined}
            onChange={(e) => setField("BrandName", e.target.value)}
            className={inputClass}
            placeholder="Acme Coffee"
          />
          {fieldErrors.BrandName && (
            <p id="BrandName-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.BrandName}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ColorField
            id="PrimaryColor"
            label="Primary color"
            value={values.PrimaryColor}
            error={fieldErrors.PrimaryColor}
            onChange={(v) => setField("PrimaryColor", v)}
          />
          <ColorField
            id="SecondaryColor"
            label="Secondary color"
            value={values.SecondaryColor}
            error={fieldErrors.SecondaryColor}
            onChange={(v) => setField("SecondaryColor", v)}
          />
        </div>

        <div>
          <label htmlFor="LogoURL" className={labelClass}>
            Logo URL
          </label>
          <input
            id="LogoURL"
            type="url"
            value={values.LogoURL}
            aria-invalid={fieldErrors.LogoURL ? true : undefined}
            aria-describedby={fieldErrors.LogoURL ? "LogoURL-error" : undefined}
            onChange={(e) => setField("LogoURL", e.target.value)}
            className={inputClass}
            placeholder="https://example.com/logo.png"
          />
          {fieldErrors.LogoURL && (
            <p id="LogoURL-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.LogoURL}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={busy !== null || !isDirty}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "saving" ? "Saving…" : kit ? "Save changes" : "Create brand kit"}
          </button>

          {kit && !confirmingDelete && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setConfirmingDelete(true)}
              className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete brand kit
            </button>
          )}

          {kit && confirmingDelete && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-600">Delete this brand kit?</span>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handleDelete()}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {busy === "deleting" ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          )}
        </div>
      </form>

      <BrandPreview
        brandName={values.BrandName}
        primaryColor={values.PrimaryColor}
        secondaryColor={values.SecondaryColor}
        logoUrl={values.LogoURL}
      />
    </div>
  );
}
