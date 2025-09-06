export interface CustomerData {
  id: string;
  name: string;
  furigana?: string; // ふりがな（新規追加）
  petName: string;
  email: string;
  phone: string;
  address: string;
  petType: '犬' | '猫' | 'その他';
  breed: string;
  age: number;
  weight: number;
  imageUrl?: string;
  notes: string;
  createdAt: string;
  lastVisit?: string;
  status: 'active' | 'inactive';
}

export interface GoogleSheetsResponse {
  values: string[][];
}

export interface FilterOptions {
  petType?: string;
  status?: string;
  search?: string;
}

export interface PetPhoto {
  id: string;
  customerId: string;
  fileName: string;
  dataUrl: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
}

export interface PhotoUploadResult {
  success: boolean;
  photo?: PetPhoto;
  error?: string;
}