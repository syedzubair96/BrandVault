import { AlertTriangle, Folder as FolderIcon, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/errors";
import {
  deleteFolderPermanently,
  listDeletedFolders,
  restoreFolder,
  type Folder,
} from "../../api/folders";
import { Loader } from "../Loader";
import { Modal } from "../Modal";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; folders: Folder[] };

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

interface DeletedFoldersProps {
  activeFolders: Folder[];
  onRestored: (folder: Folder) => void;
}

export function DeletedFolders({ activeFolders, onRestored }: DeletedFoldersProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Folder | null>(null);

  const getDeletedFolders = () => {
    listDeletedFolders()
      .then((folders) => setState({ status: "ready", folders }))
      .catch((err: unknown) => {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Could not load deleted folders.",
        });
      });
  };

  useEffect(() => {
    getDeletedFolders();
  }, []);

  const deleted = state.status === "ready" ? state.folders : [];

  function folderName(id: number | null) {
    if (id === null) return null;
    return (activeFolders.find((f) => f.id === id) ?? deleted.find((f) => f.id === id))?.FolderName ?? null;
  }

  function removeFromList(id: number) {
    setState((prev) =>
      prev.status === "ready" ? { status: "ready", folders: prev.folders.filter((f) => f.id !== id) } : prev,
    );
  }

  async function handleRestore(folder: Folder) {
    setBusyId(folder.id);
    setActionError(null);
    try {
      const restored = await restoreFolder(folder.id);
      removeFromList(folder.id);
      onRestored(restored);
    } catch (err) {
      const parent = folderName(folder.HeadFolderId);
      setActionError(
        err instanceof ApiError && err.status === 409 && parent
          ? `“${folder.FolderName}” is inside “${parent}”, which is deleted. Restore “${parent}” first.`
          : err instanceof Error
            ? err.message
            : "Could not restore the folder.",
      );
    } finally {
      setBusyId(null);
    }
  }

  function handlePermanentlyDeleted(folder: Folder) {
    setToDelete(null);
    removeFromList(folder.id);
  }

  if (state.status === "loading") {
    return (
      <div className="flex justify-center py-6">
        <Loader />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center px-2 py-6 text-center">
        <AlertTriangle className="size-5 text-red-500" aria-hidden />
        <p className="mt-1 text-xs text-slate-500">{state.message}</p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            getDeletedFolders();
          }}
          className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {actionError && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </p>
      )}

      {deleted.length === 0 ? (
        <p className="px-2 py-4 text-center text-xs text-slate-500">No deleted folders.</p>
      ) : (
        <ul className="space-y-1">
          {deleted.map((folder) => {
            const parent = folderName(folder.HeadFolderId);
            const busy = busyId === folder.id;
            return (
              <li key={folder.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <FolderIcon className="size-4 shrink-0 text-slate-300" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-500 line-through" title={folder.FolderName}>
                    {folder.FolderName}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {parent ? `in ${parent} · ` : ""}
                    {folder.deletedAt && `deleted ${dateFormat.format(new Date(folder.deletedAt))}`}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRestore(folder)}
                  aria-label={`Restore ${folder.FolderName}`}
                  title="Restore"
                  className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                >
                  <RotateCcw className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setActionError(null);
                    setToDelete(folder);
                  }}
                  aria-label={`Delete ${folder.FolderName} forever`}
                  title="Delete forever"
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {toDelete && (
        <PermanentDeleteDialog
          folder={toDelete}
          onClose={() => setToDelete(null)}
          onDeleted={handlePermanentlyDeleted}
        />
      )}
    </div>
  );
}

interface PermanentDeleteDialogProps {
  folder: Folder;
  onClose: () => void;
  onDeleted: (folder: Folder) => void;
}

function PermanentDeleteDialog({ folder, onClose, onDeleted }: PermanentDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await deleteFolderPermanently(folder.id);
      onDeleted(folder);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? /subfolder/i.test(err.message)
            ? "This folder still has subfolders. Delete them forever first."
            : "This folder still has assets. Move or delete them first."
          : err instanceof Error
            ? err.message
            : "Could not delete the folder.",
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Delete forever?"
      description={`“${folder.FolderName}” and any trashed assets inside it will be permanently deleted. This can't be undone.`}
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
          {submitting ? "Deleting…" : "Delete forever"}
        </button>
      </div>
    </Modal>
  );
}
