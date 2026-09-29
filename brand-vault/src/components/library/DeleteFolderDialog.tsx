import { useState } from "react";
import { ApiError } from "../../api/errors";
import { deleteFolder, type Folder } from "../../api/folders";
import { Modal } from "../Modal";

interface DeleteFolderDialogProps {
  folder: Folder;
  subfolderCount: number;
  onClose: () => void;
  onDeleted: (folder: Folder) => void;
}

function friendlyError(err: unknown) {
  if (err instanceof ApiError && err.status === 409) {
    return /subfolder/i.test(err.message)
      ? "This folder still has subfolders. Delete them first."
      : "This folder still has assets. Move or delete them first.";
  }
  return err instanceof Error ? err.message : "Could not delete the folder.";
}

export function DeleteFolderDialog({ folder, subfolderCount, onClose, onDeleted }: DeleteFolderDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const blocked = subfolderCount > 0;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await deleteFolder(folder.id);
      onDeleted(folder);
    } catch (err) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Delete folder?"
      description={
        blocked
          ? `“${folder.FolderName}” has ${subfolderCount} ${subfolderCount === 1 ? "subfolder" : "subfolders"}. Delete ${subfolderCount === 1 ? "it" : "them"} first.`
          : `“${folder.FolderName}” will be deleted. It must be empty first.`
      }
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
          {blocked ? "OK" : "Cancel"}
        </button>
        {!blocked && (
          <button
            type="button"
            autoFocus
            disabled={submitting}
            onClick={() => void handleConfirm()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Deleting…" : "Delete folder"}
          </button>
        )}
      </div>
    </Modal>
  );
}
