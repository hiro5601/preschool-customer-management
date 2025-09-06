import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { CustomerData, FilterOptions } from '../types/customer';
import apiService from '../services/apiService';

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, filters]);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // APIからデータを取得
      const data = await apiService.getCustomers();
      
      setCustomers(data);
    } catch (err) {
      setError('顧客データの読み込みに失敗しました');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...customers];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.furigana?.toLowerCase().includes(searchLower) ||
        customer.petName.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.includes(searchLower)
      );
    }

    if (filters.petType) {
      filtered = filtered.filter(customer => customer.petType === filters.petType);
    }

    if (filters.status) {
      filtered = filtered.filter(customer => customer.status === filters.status);
    }

    setFilteredCustomers(filtered);
  }, [customers, filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleRowClick = (params: GridRowParams) => {
    navigate(`/customer/${params.id}`);
  };

  const handleDeleteClick = (event: React.MouseEvent, customer: CustomerData) => {
    event.stopPropagation(); // 行クリックイベントを防ぐ
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (customerToDelete) {
      try {
        // APIから削除
        await apiService.deleteCustomer(customerToDelete.id);
        
        // 状態からも削除
        setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
        
        setDeleteDialogOpen(false);
        setCustomerToDelete(null);
        
        console.log('顧客データを削除しました');
      } catch (error) {
        console.error('削除エラー:', error);
        setError('顧客の削除に失敗しました');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const columns: GridColDef[] = [
    {
      field: 'imageUrl',
      headerName: '写真',
      width: 80,
      renderCell: (params) => (
        <Avatar
          src={params.value}
          alt={params.row.petName}
          sx={{ width: 40, height: 40 }}
        >
          {params.row.petName.charAt(0)}
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: '飼い主名',
      width: 150,
    },
    {
      field: 'petName',
      headerName: 'ペット名',
      width: 120,
    },
    {
      field: 'petType',
      headerName: '犬種',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === '犬' ? 'primary' : params.value === '猫' ? 'secondary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'age',
      headerName: '年齢',
      width: 80,
      renderCell: (params) => `${params.value}歳`,
    },
    {
      field: 'phone',
      headerName: '電話番号',
      width: 150,
    },
    {
      field: 'lastVisit',
      headerName: '最終来店',
      width: 120,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('ja-JP') : '-',
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={(e) => handleDeleteClick(e, params.row)}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={loadCustomers} sx={{ ml: 2 }}>
          再試行
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        顧客一覧
      </Typography>

      {/* フィルター */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="検索"
              placeholder="名前、ペット名、メール、電話番号で検索"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>ペットの種類</InputLabel>
              <Select
                value={filters.petType || ''}
                onChange={(e) => handleFilterChange('petType', e.target.value)}
                label="ペットの種類"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="犬">犬</MenuItem>
                <MenuItem value="猫">猫</MenuItem>
                <MenuItem value="その他">その他</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>ステータス</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="ステータス"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="active">アクティブ</MenuItem>
                <MenuItem value="inactive">非アクティブ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilters({})}
            >
              リセット
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* データグリッド */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredCustomers}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: rowsPerPage },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          onPaginationModelChange={(model) => setRowsPerPage(model.pageSize)}
          onRowClick={handleRowClick}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>

      {/* 統計情報 */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              総顧客数
            </Typography>
            <Typography variant="h5">
              {customers.length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              アクティブ顧客
            </Typography>
            <Typography variant="h5">
              {customers.filter(c => c.status === 'active').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              犬の顧客
            </Typography>
            <Typography variant="h5">
              {customers.filter(c => c.petType === '犬').length}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              猫の顧客
            </Typography>
            <Typography variant="h5">
              {customers.filter(c => c.petType === '猫').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          顧客データの削除
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {customerToDelete && (
              <>
                <strong>{customerToDelete.name}</strong> さん（ペット: {customerToDelete.petName}）のデータを削除しますか？
                <br />
                この操作は取り消せません。
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            キャンセル
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
