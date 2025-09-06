import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  TextField,
  Alert,
  Paper,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { PetPhoto } from '../types/customer';
import PhotoService from '../services/photoService';

interface PhotoGalleryProps {
  photos: PetPhoto[];
  customerId: string;
  onPhotoDeleted: (photoId: string) => void;
  onPhotoUpdated: (photo: PetPhoto) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  customerId,
  onPhotoDeleted,
  onPhotoUpdated,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PetPhoto | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const photoService = new PhotoService();

  const handlePhotoClick = (photo: PetPhoto) => {
    setSelectedPhoto(photo);
    setEditDescription(photo.description || '');
  };

  const handleCloseDialog = () => {
    setSelectedPhoto(null);
    setEditingDescription(false);
    setEditDescription('');
  };

  const handleDeletePhoto = async (photoId: string) => {
    setDeletingPhoto(photoId);
    try {
      const success = photoService.deletePhoto(photoId);
      if (success) {
        onPhotoDeleted(photoId);
        handleCloseDialog();
      }
    } catch (error) {
      console.error('写真削除エラー:', error);
    } finally {
      setDeletingPhoto(null);
    }
  };

  const handleUpdateDescription = async () => {
    if (!selectedPhoto) return;

    try {
      const success = photoService.updatePhotoDescription(selectedPhoto.id, editDescription);
      if (success) {
        const updatedPhoto = { ...selectedPhoto, description: editDescription };
        onPhotoUpdated(updatedPhoto);
        setEditingDescription(false);
      }
    } catch (error) {
      console.error('説明更新エラー:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (photos.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'grey.50',
          border: '2px dashed #ccc',
        }}
      >
        <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          まだ写真がありません
        </Typography>
        <Typography variant="body2" color="text.secondary">
          右上の「編集」ボタンから写真をアップロードできます
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          写真ギャラリー ({photos.length}枚)
        </Typography>
        <Chip
          label={`${photos.length}/50枚`}
          color={photos.length >= 50 ? 'error' : 'primary'}
          size="small"
        />
      </Box>

      <Grid container spacing={2}>
        {photos.map((photo) => (
          <Grid item xs={6} sm={4} md={3} key={photo.id}>
            <Card
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3,
                },
              }}
              onClick={() => handlePhotoClick(photo)}
            >
              <CardMedia
                component="img"
                height="150"
                image={photo.dataUrl}
                alt={photo.description || 'ペットの写真'}
                sx={{
                  objectFit: 'cover',
                }}
              />
              <CardContent sx={{ p: 1 }}>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {photo.description || '説明なし'}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  {formatDate(photo.uploadedAt)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 写真詳細ダイアログ */}
      <Dialog
        open={!!selectedPhoto}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedPhoto && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  {selectedPhoto.fileName}
                </Typography>
                <Box>
                  <IconButton
                    onClick={() => setEditingDescription(!editingDescription)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeletePhoto(selectedPhoto.id)}
                    size="small"
                    color="error"
                    disabled={deletingPhoto === selectedPhoto.id}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton onClick={handleCloseDialog} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <img
                  src={selectedPhoto.dataUrl}
                  alt={selectedPhoto.description || 'ペットの写真'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    objectFit: 'contain',
                  }}
                />
              </Box>

              {editingDescription ? (
                <Box>
                  <TextField
                    fullWidth
                    label="写真の説明"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleUpdateDescription}
                      size="small"
                    >
                      保存
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setEditingDescription(false)}
                      size="small"
                    >
                      キャンセル
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>説明：</strong>
                    {selectedPhoto.description || '説明なし'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>ファイル名：</strong>
                    {selectedPhoto.fileName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>ファイルサイズ：</strong>
                    {formatFileSize(selectedPhoto.fileSize)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>アップロード日時：</strong>
                    {formatDate(selectedPhoto.uploadedAt)}
                  </Typography>
                </Box>
              )}

              {deletingPhoto === selectedPhoto.id && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  写真を削除しています...
                </Alert>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseDialog}>
                閉じる
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PhotoGallery;
