import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { PetPhoto, PhotoUploadResult } from '../types/customer';
import PhotoService from '../services/photoService';

interface PhotoUploadProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  petName: string;
  onPhotoUploaded: (photo: PetPhoto) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  open,
  onClose,
  customerId,
  customerName,
  petName,
  onPhotoUploaded,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoService = new PhotoService();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズが大きすぎます。最大5MBまでです。');
        return;
      }

      // 画像ファイルかチェック
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください。');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // プレビュー作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('ファイルを選択してください。');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result: PhotoUploadResult = await photoService.uploadPhoto(
        customerId,
        selectedFile,
        description.trim() || undefined
      );

      if (result.success && result.photo) {
        onPhotoUploaded(result.photo);
        handleClose();
      } else {
        setError(result.error || 'アップロードに失敗しました。');
      }
    } catch (err) {
      setError('アップロード中にエラーが発生しました。');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDescription('');
    setError(null);
    setPreview(null);
    setUploading(false);
    onClose();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // ファイルサイズチェック（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズが大きすぎます。最大5MBまでです。');
        return;
      }

      // 画像ファイルかチェック
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください。');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // プレビュー作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {petName}の写真をアップロード
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* ファイル選択エリア */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              border: '2px dashed #ccc',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {preview ? (
              <Box>
                <img
                  src={preview}
                  alt="プレビュー"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedFile?.name}
                </Typography>
              </Box>
            ) : (
              <Box>
                <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  写真をドラッグ&ドロップまたはクリックして選択
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  最大5MB、JPG/PNG/GIF形式
                </Typography>
              </Box>
            )}
          </Paper>

          {/* 説明入力 */}
          <TextField
            fullWidth
            label="写真の説明（任意）"
            placeholder="例：散歩中の様子、お気に入りのおもちゃで遊んでいる様子など"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            sx={{ mt: 2 }}
          />

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* アップロード進捗 */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                アップロード中...
              </Typography>
            </Box>
          )}

          {/* 制限情報 */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>制限事項：</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 1顧客あたり最大50枚まで
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 1ファイルあたり最大5MBまで
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 写真はローカルストレージに保存されます
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          キャンセル
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          startIcon={<CloudUploadIcon />}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'アップロード中...' : 'アップロード'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoUpload;
