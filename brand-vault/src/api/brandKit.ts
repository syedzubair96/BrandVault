import { apiRequest } from "./client";

export interface BrandKit {
  id: number;
  BrandName: string;
  PrimaryColor: string;
  SecondaryColor: string;
  LogoURL: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandKitInput {
  BrandName: string;
  PrimaryColor: string;
  SecondaryColor: string;
  LogoURL: string;
}

export function listBrandKits() {
  return apiRequest<BrandKit[]>("/brand-kit");
}

export function createBrandKit(input: BrandKitInput) {
  return apiRequest<BrandKit>("/brand-kit", { method: "POST", body: input });
}

export function updateBrandKit(id: number, input: Partial<BrandKitInput>) {
  return apiRequest<BrandKit>(`/brand-kit/${id}`, { method: "PATCH", body: input });
}

export function deleteBrandKit(id: number) {
  return apiRequest<BrandKit>(`/brand-kit/${id}`, { method: "DELETE" });
}
