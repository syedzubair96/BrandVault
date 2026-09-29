import { apiRequest } from "./client";

export interface Folder {
  id: number;
  FolderName: string;
  HeadFolderId: number | null;
  createdBy: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreateFolderInput {
  FolderName: string;
  HeadFolderId: number | null;
}

export function listFolders() {
  return apiRequest<Folder[]>("/brand-folder");
}

export function createFolder(input: CreateFolderInput) {
  return apiRequest<Folder>("/brand-folder", { method: "POST", body: input });
}

export function deleteFolder(id: number) {
  return apiRequest<Folder>(`/brand-folder/${id}`, { method: "DELETE" });
}

export function listDeletedFolders() {
  return apiRequest<Folder[]>("/brand-folder?trash=true");
}

export function restoreFolder(id: number) {
  return apiRequest<Folder>(`/brand-folder/${id}/restore`, { method: "POST" });
}

export function deleteFolderPermanently(id: number) {
  return apiRequest<Folder>(`/brand-folder/${id}/permanent`, { method: "DELETE" });
}
