import { PetPhoto, PhotoUploadResult } from '../types/customer';

class PhotoService {
  private readonly STORAGE_KEY = 'pet_photos';
  private readonly MAX_PHOTOS_PER_CUSTOMER = 50;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (スマホ撮影サイズ)

  // 全写真を取得
  getAllPhotos(): PetPhoto[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('写真データの読み込みエラー:', error);
      return [];
    }
  }

  // 特定の顧客の写真を取得
  getPhotosByCustomerId(customerId: string): PetPhoto[] {
    const allPhotos = this.getAllPhotos();
    return allPhotos.filter(photo => photo.customerId === customerId);
  }

  // 写真をアップロード
  async uploadPhoto(
    customerId: string, 
    file: File, 
    description?: string
  ): Promise<PhotoUploadResult> {
    try {
      // ファイルサイズチェック
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `ファイルサイズが大きすぎます。最大${this.MAX_FILE_SIZE / (1024 * 1024)}MBまでです。`
        };
      }

      // 顧客の写真数をチェック
      const customerPhotos = this.getPhotosByCustomerId(customerId);
      if (customerPhotos.length >= this.MAX_PHOTOS_PER_CUSTOMER) {
        return {
          success: false,
          error: `1顧客あたり最大${this.MAX_PHOTOS_PER_CUSTOMER}枚までです。`
        };
      }

      // ファイルをBase64に変換
      const dataUrl = await this.fileToDataUrl(file);
      
      // 写真オブジェクトを作成
      const photo: PetPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId,
        fileName: file.name,
        dataUrl,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        description
      };

      // ローカルストレージに保存
      const allPhotos = this.getAllPhotos();
      allPhotos.push(photo);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allPhotos));

      return {
        success: true,
        photo
      };
    } catch (error) {
      console.error('写真アップロードエラー:', error);
      return {
        success: false,
        error: '写真のアップロードに失敗しました。'
      };
    }
  }

  // 写真を削除
  deletePhoto(photoId: string): boolean {
    try {
      const allPhotos = this.getAllPhotos();
      const filteredPhotos = allPhotos.filter(photo => photo.id !== photoId);
      
      if (filteredPhotos.length === allPhotos.length) {
        return false; // 写真が見つからない
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPhotos));
      return true;
    } catch (error) {
      console.error('写真削除エラー:', error);
      return false;
    }
  }

  // 顧客の全写真を削除
  deletePhotosByCustomerId(customerId: string): number {
    try {
      const allPhotos = this.getAllPhotos();
      const filteredPhotos = allPhotos.filter(photo => photo.customerId !== customerId);
      const deletedCount = allPhotos.length - filteredPhotos.length;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredPhotos));
      return deletedCount;
    } catch (error) {
      console.error('顧客写真一括削除エラー:', error);
      return 0;
    }
  }

  // ファイルをBase64に変換
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ストレージ使用量を取得（MB単位）
  getStorageUsage(): number {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return 0;
      
      const photos: PetPhoto[] = JSON.parse(stored);
      const totalSize = photos.reduce((sum, photo) => sum + photo.fileSize, 0);
      return totalSize / (1024 * 1024); // MB単位
    } catch (error) {
      console.error('ストレージ使用量計算エラー:', error);
      return 0;
    }
  }

  // ストレージをクリア（全写真削除）
  clearAllPhotos(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('全写真削除エラー:', error);
      return false;
    }
  }

  // 写真の詳細を更新
  updatePhotoDescription(photoId: string, description: string): boolean {
    try {
      const allPhotos = this.getAllPhotos();
      const photoIndex = allPhotos.findIndex(photo => photo.id === photoId);
      
      if (photoIndex === -1) return false;
      
      allPhotos[photoIndex].description = description;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allPhotos));
      return true;
    } catch (error) {
      console.error('写真詳細更新エラー:', error);
      return false;
    }
  }
}

export default PhotoService;
