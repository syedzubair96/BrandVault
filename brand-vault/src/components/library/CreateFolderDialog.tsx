import { useState, type FormEvent } from "react";
import { createFolder, type Folder } from "../../api/folders";
import { Modal } from "../Modal";

const FOLDER_NAME_MAX = 100;

interface CreateFolderDialogProps {
  parent: Folder | null;
  onClose: () => void;
  onCreated: (folder: Folder) => void;
}

export function CreateFolderDialog({ parent, onClose, onCreated }: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const folderName = name.trim();
    if (!folderName) {
      setError("Enter a folder name.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      onCreated(await createFolder({ FolderName: folderName, HeadFolderId: parent?.id ?? null }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the folder.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={parent ? "New subfolder" : "New folder"}
      description={parent ? `Inside “${parent.FolderName}”` : "At the top level of your library"}
      onClose={onClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        <div>
          <label htmlFor="folderName" className="mb-1 block text-sm font-medium text-slate-700">
            Folder name
          </label>
          <input
            id="folderName"
            type="text"
            autoFocus
            maxLength={FOLDER_NAME_MAX}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="Social Media"
          />
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
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create folder"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
