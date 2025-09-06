import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Pets as PetsIcon,
  Cake as CakeIcon,
  Scale as ScaleIcon,
  Notes as NotesIcon,
  CalendarToday as CalendarIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { CustomerData, PetPhoto } from '../types/customer';
import apiService from '../services/apiService';
import PhotoService from '../services/photoService';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';
import CustomerEditForm from './CustomerEditForm';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const photoService = new PhotoService();


  const loadCustomer = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // APIから顧客データを取得
      const data = await apiService.getCustomerById(customerId);
      
      if (data) {
        setCustomer(data);
      } else {
        setError('顧客が見つかりません');
      }
    } catch (err) {
      setError('顧客データの読み込みに失敗しました');
      console.error('Error loading customer:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadCustomer(id);
      // 写真を読み込み
      const customerPhotos = photoService.getPhotosByCustomerId(id);
      setPhotos(customerPhotos);
    }
  }, [id, loadCustomer, photoService]);

  const handlePhotoUploaded = (photo: PetPhoto) => {
    setPhotos(prev => [...prev, photo]);
  };

  const handlePhotoDeleted = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handlePhotoUpdated = (updatedPhoto: PetPhoto) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === updatedPhoto.id ? updatedPhoto : photo
    ));
  };

  // 顧客データを更新
  const handleUpdateCustomer = async (updatedCustomer: CustomerData) => {
    try {
      setUpdateLoading(true);
      
      // APIで更新
      await apiService.updateCustomer(updatedCustomer.id, updatedCustomer);
      
      // ローカル状態を更新
      setCustomer(updatedCustomer);
      setIsEditing(false);
      
      console.log('顧客データが更新されました');
    } catch (error) {
      console.error('更新エラー:', error);
      setError('顧客データの更新に失敗しました');
    } finally {
      setUpdateLoading(false);
    }
  };

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const getPetTypeColor = (petType: string) => {
    switch (petType) {
      case '犬': return 'primary';
      case '猫': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          一覧に戻る
        </Button>
        <Alert severity="error">
          {error || '顧客が見つかりません'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          一覧に戻る
        </Button>
        <Button
          variant="contained"
          onClick={() => setIsEditing(true)}
          disabled={isEditing}
        >
          編集
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          顧客詳細
        </Typography>
        <Button
          startIcon={<PhotoCameraIcon />}
          variant="contained"
          color="primary"
          onClick={() => setUploadDialogOpen(true)}
        >
          写真を追加
        </Button>
      </Box>

      {/* 編集フォーム */}
      {isEditing && customer && (
        <Box sx={{ mb: 3 }}>
          <CustomerEditForm
            customer={customer}
            onSave={handleUpdateCustomer}
            onCancel={handleCancelEdit}
            loading={updateLoading}
          />
        </Box>
      )}

      {/* メインコンテンツ */}
      {!isEditing && (
        <Grid container spacing={3}>
        {/* 基本情報 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={customer.imageUrl}
                  alt={customer.petName}
                  sx={{ width: 120, height: 120, mb: 2 }}
                >
                  {customer.petName.charAt(0)}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {customer.petName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={customer.petType}
                    color={getPetTypeColor(customer.petType)}
                    size="small"
                  />
                  <Chip
                    label={customer.status === 'active' ? 'アクティブ' : '非アクティブ'}
                    color={getStatusColor(customer.status)}
                    size="small"
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <PetsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="品種"
                    secondary={customer.breed}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CakeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="年齢"
                    secondary={`${customer.age}歳`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScaleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="体重"
                    secondary={`${customer.weight}kg`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 飼い主情報 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                飼い主情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="お名前"
                    secondary={customer.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="電話番号"
                    secondary={customer.phone}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="メールアドレス"
                    secondary={customer.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="住所"
                    secondary={customer.address}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* その他情報 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                その他情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="登録日"
                    secondary={new Date(customer.createdAt).toLocaleDateString('ja-JP')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="最終来店"
                    secondary={customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('ja-JP') : '未設定'}
                  />
                </ListItem>
              </List>

              {customer.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotesIcon />
                      備考
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {customer.notes}
                      </Typography>
                    </Paper>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* タブコンテンツ */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab
                  icon={<PersonIcon />}
                  label="基本情報"
                  iconPosition="start"
                />
                <Tab
                  icon={<PhotoCameraIcon />}
                  label={`写真 (${photos.length}枚)`}
                  iconPosition="start"
                />
              </Tabs>

              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    来店履歴
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography color="text.secondary">
                    来店履歴機能は今後実装予定です。
                  </Typography>
                </Box>
              )}

              {activeTab === 1 && customer && (
                <PhotoGallery
                  photos={photos}
                  customerId={customer.id}
                  onPhotoDeleted={handlePhotoDeleted}
                  onPhotoUpdated={handlePhotoUpdated}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* 写真アップロードダイアログ */}
      {customer && (
        <PhotoUpload
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          customerId={customer.id}
          customerName={customer.name}
          petName={customer.petName}
          onPhotoUploaded={handlePhotoUploaded}
        />
      )}
    </Box>
  );
};

export default CustomerDetail;
