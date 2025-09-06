import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { CustomerData } from '../types/customer';

interface CustomerEditFormProps {
  customer: CustomerData;
  onSave: (updatedCustomer: CustomerData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CustomerEditForm: React.FC<CustomerEditFormProps> = ({
  customer,
  onSave,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<CustomerData>({ ...customer });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CustomerData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }
    if (!formData.petName.trim()) {
      newErrors.petName = 'ペット名は必須です';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '電話番号は必須です';
    }
    if (!formData.address.trim()) {
      newErrors.address = '住所は必須です';
    }
    // 品種は削除されたため、バリデーションから除外
    if (!formData.age || formData.age < 0) {
      newErrors.age = '有効な年齢を入力してください';
    }
    if (!formData.weight || formData.weight < 0) {
      newErrors.weight = '有効な体重を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            顧客情報を編集
          </Typography>
          
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              入力内容を確認してください
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* 基本情報 */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                基本情報
              </Typography>
              
              <TextField
                fullWidth
                label="飼い主名"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="ふりがな"
                value={formData.furigana || ''}
                onChange={(e) => handleChange('furigana', e.target.value)}
                margin="normal"
                placeholder="例: たなかたろう"
              />
              
              <TextField
                fullWidth
                label="ペット名"
                value={formData.petName}
                onChange={(e) => handleChange('petName', e.target.value)}
                error={!!errors.petName}
                helperText={errors.petName}
                margin="normal"
                required
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>犬種</InputLabel>
                <Select
                  value={formData.petType}
                  onChange={(e) => handleChange('petType', e.target.value)}
                  label="犬種"
                >
                  <MenuItem value="犬">犬</MenuItem>
                  <MenuItem value="猫">猫</MenuItem>
                  <MenuItem value="その他">その他</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 連絡先情報 */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                連絡先情報
              </Typography>
              
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="電話番号"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="住所"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                error={!!errors.address}
                helperText={errors.address}
                margin="normal"
                required
                multiline
                rows={2}
              />
            </Grid>

            {/* ペット詳細情報 */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                ペット詳細
              </Typography>
              
              <TextField
                fullWidth
                label="年齢"
                type="number"
                value={formData.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                error={!!errors.age}
                helperText={errors.age}
                margin="normal"
                required
                inputProps={{ min: 0, max: 30 }}
              />
              
              <TextField
                fullWidth
                label="体重 (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                error={!!errors.weight}
                helperText={errors.weight}
                margin="normal"
                required
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>

            {/* その他情報 */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                その他情報
              </Typography>
              
              {/* ステータスは削除 */}
              
              <TextField
                fullWidth
                label="備考"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>

          {/* ボタン */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              {loading ? '保存中...' : '保存'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerEditForm;
