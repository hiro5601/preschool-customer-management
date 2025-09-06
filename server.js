const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// データファイルのパス
const DATA_FILE = path.join(__dirname, 'data', 'customers.json');

// データディレクトリの作成
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// 顧客データの読み込み
function loadCustomers() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('データ読み込みエラー:', error);
  }
  return [];
}

// 顧客データの保存
function saveCustomers(customers) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(customers, null, 2));
    return true;
  } catch (error) {
    console.error('データ保存エラー:', error);
    return false;
  }
}

// 顧客IDの生成
function generateCustomerId() {
  const customers = loadCustomers();
  const maxId = customers.reduce((max, customer) => {
    const idNum = parseInt(customer.id.replace('C', ''));
    return Math.max(max, idNum);
  }, 0);
  return `C${String(maxId + 1).padStart(3, '0')}`;
}

// APIキー認証ミドルウェア
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  const validApiKey = process.env.API_KEY || 'b422bf4afe29ff33fd2fca593bdb858974c0273a01d127d91574437d5c1ec922';
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

// 顧客一覧取得
app.get('/api/customers', (req, res) => {
  try {
    const customers = loadCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: '顧客データの取得に失敗しました' });
  }
});

// 顧客詳細取得
app.get('/api/customers/:id', (req, res) => {
  try {
    const customers = loadCustomers();
    const customer = customers.find(c => c.id === req.params.id);
    
    if (!customer) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: '顧客データの取得に失敗しました' });
  }
});

// 顧客作成（Googleフォームからの送信）
app.post('/api/customers', authenticateApiKey, (req, res) => {
  try {
    const customers = loadCustomers();
    
    // 入力データの検証
    const requiredFields = ['name', 'email', 'phone', 'petName'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field}は必須です` });
      }
    }
    
    // 顧客データの作成
    const customerData = {
      id: generateCustomerId(),
      name: req.body.name,
      furigana: req.body.furigana || '',
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address || '',
      petName: req.body.petName,
      petType: req.body.petType || 'その他',
      breed: '', // 品種は削除
      age: parseInt(req.body.age) || 0,
      weight: parseFloat(req.body.weight) || 0,
      imageUrl: '', // 画像URLは削除
      notes: req.body.notes || '',
      createdAt: new Date().toISOString().split('T')[0],
      lastVisit: '',
      status: 'active'
    };
    
    // 顧客データを追加
    customers.push(customerData);
    
    // データを保存
    if (saveCustomers(customers)) {
      console.log(`新しい顧客が追加されました: ${customerData.id} - ${customerData.name}`);
      res.json({ 
        success: true, 
        id: customerData.id,
        message: '顧客データが正常に作成されました'
      });
    } else {
      res.status(500).json({ error: 'データの保存に失敗しました' });
    }
  } catch (error) {
    console.error('顧客作成エラー:', error);
    res.status(500).json({ error: '顧客データの作成に失敗しました' });
  }
});

// 顧客更新
app.put('/api/customers/:id', authenticateApiKey, (req, res) => {
  try {
    const customers = loadCustomers();
    const customerIndex = customers.findIndex(c => c.id === req.params.id);
    
    if (customerIndex === -1) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }
    
    // 顧客データを更新
    customers[customerIndex] = {
      ...customers[customerIndex],
      ...req.body,
      id: req.params.id // IDは変更不可
    };
    
    if (saveCustomers(customers)) {
      res.json({ success: true, message: '顧客データが更新されました' });
    } else {
      res.status(500).json({ error: 'データの保存に失敗しました' });
    }
  } catch (error) {
    console.error('顧客更新エラー:', error);
    res.status(500).json({ error: '顧客データの更新に失敗しました' });
  }
});

// 顧客削除
app.delete('/api/customers/:id', authenticateApiKey, (req, res) => {
  try {
    const customers = loadCustomers();
    const customerIndex = customers.findIndex(c => c.id === req.params.id);
    
    if (customerIndex === -1) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }
    
    // 顧客を削除
    const deletedCustomer = customers.splice(customerIndex, 1)[0];
    
    if (saveCustomers(customers)) {
      console.log(`顧客が削除されました: ${deletedCustomer.id} - ${deletedCustomer.name}`);
      res.json({ success: true, message: '顧客データが削除されました' });
    } else {
      res.status(500).json({ error: 'データの保存に失敗しました' });
    }
  } catch (error) {
    console.error('顧客削除エラー:', error);
    res.status(500).json({ error: '顧客データの削除に失敗しました' });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`APIサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`APIキー: ${process.env.API_KEY || 'your-secure-api-key'}`);
});

module.exports = app;
