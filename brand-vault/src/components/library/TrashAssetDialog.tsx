import { useState } from "react";
import { trashAsset, type Asset } from "../../api/assets";
import { Modal } from "../Modal";

interface TrashAssetDialogProps {
  asset: Asset;
  onClose: () => void;
  onTrashed: (asset: Asset) => void;
}

export function TrashAssetDialog({ asset, onClose, onTrashed }: TrashAssetDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      onTrashed(await trashAsset(asset.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the asset.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Delete asset?"
      description={`“${asset.name}” will be moved to the trash. You can restore it later.`}
      onClose={onClose}
    >
      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
          type="button"
          autoFocus
          disabled={submitting}
          onClick={() => void handleConfirm()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Deleting…" : "Move to trash"}
        </button>
      </div>
    </Modal>
  );
}
