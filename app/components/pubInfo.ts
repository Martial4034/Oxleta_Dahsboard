// app/dashboard/pub/types.ts

export type OfferType =
  | "Premium 1"
  | "Gold 1"
  | "Gold 2"
  | "Silver 1"
  | "Silver 2"
  | "Silver 3";

export type PositionCode =
  | `P-1-1-${1 | 2 | 3 | 4 | 5 | 6}`
  | `P-1-2-${1 | 2 | 3 | 4 | 5 | 6}`
  | `G-1-1-${1 | 2 | 3}`
  | `G-1-2-${1 | 2 | 3}`
  | `G-2-1-${1 | 2 | 3}`
  | `G-2-2-${1 | 2 | 3}`
  | `S-1-1-${1 | 2 | 3 | 4}`
  | `S-1-2-${1 | 2 | 3}`
  | `S-2-1-${1 | 2 | 3 | 4}`
  | `S-2-2-${1 | 2 | 3}`
  | `S-3-1-${1 | 2 | 3 | 4}`
  | `S-3-2-${1 | 2 | 3}`;

export const POSITIONS: Record<OfferType, PositionCode[]> = {
  "Premium 1": [
    "P-1-1-1",
    "P-1-1-2",
    "P-1-1-3",
    "P-1-1-4",
    "P-1-1-5",
    "P-1-1-6",
    "P-1-2-1",
    "P-1-2-2",
    "P-1-2-3",
    "P-1-2-4",
    "P-1-2-5",
    "P-1-2-6",
  ],
  "Gold 1": ["G-1-1-1", "G-1-1-2", "G-1-1-3", "G-1-2-1", "G-1-2-2", "G-1-2-3"],
  "Gold 2": ["G-2-1-1", "G-2-1-2", "G-2-1-3", "G-2-2-1", "G-2-2-2", "G-2-2-3"],
  "Silver 1": [
    "S-1-1-1",
    "S-1-1-2",
    "S-1-1-3",
    "S-1-1-4",
    "S-1-2-1",
    "S-1-2-2",
    "S-1-2-3",
  ],
  "Silver 2": [
    "S-2-1-1",
    "S-2-1-2",
    "S-2-1-3",
    "S-2-1-4",
    "S-2-2-1",
    "S-2-2-2",
    "S-2-2-3",
  ],
  "Silver 3": [
    "S-3-1-1",
    "S-3-1-2",
    "S-3-1-3",
    "S-3-1-4",
    "S-3-2-1",
    "S-3-2-2",
    "S-3-2-3",
  ],
} as const;

export const POSITION_FORMATS: Record<PositionCode, string> = {
  // Format catégorie Premium 1
  "P-1-1-1": "1:1",
  "P-1-1-2": "3:9",
  "P-1-1-3": "1:1",
  "P-1-1-4": "16:9",
  "P-1-1-5": "9:3",
  "P-1-1-6": "1:1",
  "P-1-2-1": "9:16",
  "P-1-2-2": "1:1",
  "P-1-2-3": "1:1",
  "P-1-2-4": "9:3",
  "P-1-2-5": "16:9",
  "P-1-2-6": "3:9",
  // Format catégorie Gold 1
  "G-1-1-1": "3:9",
  "G-1-1-2": "9:16",
  "G-1-1-3": "16:9",
  "G-1-2-1": "9:3",
  "G-1-2-2": "16:9",
  "G-1-2-3": "1:1",
  // Format catégorie Gold 2
  "G-2-1-1": "9:3",
  "G-2-1-2": "1:1",
  "G-2-1-3": "9:16",
  "G-2-2-1": "3:9",
  "G-2-2-2": "1:1",
  "G-2-2-3": "9:16",
  // Format catégorie Silver 1
  "S-1-1-1": "9:3",
  "S-1-1-2": "1:1",
  "S-1-1-3": "1:1",
  "S-1-1-4": "3:9",
  "S-1-2-1": "1:1",
  "S-1-2-2": "3:9",
  "S-1-2-3": "9:3",
  // Format catégorie Silver 2
  "S-2-1-1": "1:1",
  "S-2-1-2": "16:9",
  "S-2-1-3": "3:9",
  "S-2-1-4": "9:3",
  "S-2-2-1": "9:3",
  "S-2-2-2": "1:1",
  "S-2-2-3": "9:3",
  // Format catégorie Silver 3
  "S-3-1-1": "1:1",
  "S-3-1-2": "3:9",
  "S-3-1-3": "9:3",
  "S-3-1-4": "9:16",
  "S-3-2-1": "3:9",
  "S-3-2-2": "9:3",
  "S-3-2-3": "1:1",
};

export interface ImageData {
  id: string;
  imageUrl: string;
  offerType: OfferType;
  position: PositionCode;
  weekNumber: number;
  createdAt: Date;
  selectedFile?: File;
  company_name: string;
  country: string;
  format: string;
}
