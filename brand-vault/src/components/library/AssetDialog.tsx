import { useState, type FormEvent } from "react";
import {
  ASSET_TYPES,
  createAsset,
  updateAsset,
  type Asset,
  type AssetTypeId,
  type CreateAssetInput,
} from "../../api/assets";
import { Modal } from "../Modal";
import type { FolderOption } from "./tree-utils";

const NAME_MAX = 200;
const URL_MAX = 2048;

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-invalid:border-red-400";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const TYPE_OPTIONS = Object.entries(ASSET_TYPES).map(([id, name]) => ({
  id: Number(id) as AssetTypeId,
  name,
}));

interface FieldErrors {
  name?: string;
  url?: string;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isAssetTypeId(type: number): type is AssetTypeId {
  return type in ASSET_TYPES;
}

interface AssetDialogProps {
  folderId: number;
  folderName: string;
  folderOptions: FolderOption[];
  /** When set, the dialog edits this asset instead of adding a new one. */
  asset?: Asset;
  onClose: () => void;
  onSaved: (asset: Asset) => void;
}

export function AssetDialog({
  folderId,
  folderName,
  folderOptions,
  asset,
  onClose,
  onSaved,
}: AssetDialogProps) {
  const [name, setName] = useState(asset?.name ?? "");
  const [targetFolderId, setTargetFolderId] = useState(asset?.FolderId ?? folderId);
  const [type, setType] = useState<AssetTypeId>(
    asset && isAssetTypeId(asset.type) ? asset.type : 1,
  );
  const [url, setUrl] = useState(asset?.LogoURL ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const values: CreateAssetInput = {
    name: name.trim(),
    type,
    LogoURL: url.trim(),
    FolderId: targetFolderId,
  };
  const changes: Partial<CreateAssetInput> = {};
  if (asset) {
    if (values.name !== asset.name) changes.name = values.name;
    if (values.type !== asset.type) changes.type = values.type;
    if (values.LogoURL !== asset.LogoURL) changes.LogoURL = values.LogoURL;
    if (values.FolderId !== asset.FolderId) changes.FolderId = values.FolderId;
  }
  const isDirty = !asset || Object.keys(changes).length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: FieldErrors = {};
    if (!values.name) errors.name = "Enter an asset name.";
    if (!isHttpsUrl(values.LogoURL)) errors.url = "Enter a full https:// URL.";
    setFieldErrors(errors);
    if (errors.name || errors.url) return;

    setSubmitting(true);
    setError(null);
    try {
      onSaved(asset ? await updateAsset(asset.id, changes) : await createAsset(values));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the asset.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={asset ? "Edit asset" : "Add asset"}
      description={asset ? `In “${folderName}”` : `To “${folderName}”`}
      onClose={onClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        <div>
          <label htmlFor="assetName" className={labelClass}>
            Name
          </label>
          <input
            id="assetName"
            type="text"
            autoFocus
            maxLength={NAME_MAX}
            value={name}
            aria-invalid={fieldErrors.name ? true : undefined}
            onChange={(e) => {
              setName(e.target.value);
              setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className={inputClass}
            placeholder="Summer campaign banner"
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="assetType" className={labelClass}>
            Type
          </label>
          <select
            id="assetType"
            value={type}
            onChange={(e) => setType(Number(e.target.value) as AssetTypeId)}
            className={`${inputClass} bg-white capitalize`}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id} className="capitalize">
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assetFolder" className={labelClass}>
            Folder
          </label>
          <select
            id="assetFolder"
            value={targetFolderId}
            onChange={(e) => setTargetFolderId(Number(e.target.value))}
            className={`${inputClass} bg-white`}
          >
            {folderOptions.map(({ folder, depth }) => (
              <option key={folder.id} value={folder.id}>
                {"\u00A0\u00A0\u00A0".repeat(depth)}
                {folder.FolderName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assetUrl" className={labelClass}>
            File URL
          </label>
          <input
            id="assetUrl"
            type="url"
            maxLength={URL_MAX}
            value={url}
            aria-invalid={fieldErrors.url ? true : undefined}
            onChange={(e) => {
              setUrl(e.target.value);
              setFieldErrors((prev) => ({ ...prev, url: undefined }));
            }}
            className={inputClass}
            placeholder="https://example.com/banner.png"
          />
          {fieldErrors.url && <p className="mt-1 text-xs text-red-600">{fieldErrors.url}</p>}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !isDirty}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : asset ? "Save changes" : "Add asset"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
