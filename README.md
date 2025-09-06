# プリスクール顧客管理システム

ペットのプリスクール（保育園）向けの顧客管理システムです。Google Formsと連携して顧客情報を効率的に管理できます。

## 機能

- 📋 **顧客一覧表示**: データグリッド形式で顧客情報を一覧表示
- 🔍 **検索・フィルタリング**: 名前、ペット名、種類、ステータスで検索・フィルタリング
- 👤 **顧客詳細表示**: 個別の顧客情報を詳細表示
- 📊 **統計情報**: 顧客数、アクティブ顧客数、ペット種類別の統計
- 🔗 **Google Sheets連携**: Google Formsから送信されたデータを自動取得
- 📱 **レスポンシブデザイン**: モバイル・タブレット対応

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **UI フレームワーク**: Material-UI (MUI)
- **データグリッド**: MUI X Data Grid
- **ルーティング**: React Router
- **API連携**: Google Sheets API
- **開発環境**: Create React App

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# Google Sheets API設定
REACT_APP_SPREADSHEET_ID=your_spreadsheet_id_here
REACT_APP_GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
REACT_APP_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# アプリケーション設定
REACT_APP_APP_NAME=プリスクール顧客管理システム
REACT_APP_VERSION=1.0.0
```

### 3. Google Sheets API の設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Google Sheets API を有効化
3. サービスアカウントを作成し、JSON キーをダウンロード
4. スプレッドシートをサービスアカウントと共有
5. 環境変数に必要な情報を設定

### 4. 開発サーバーの起動

```bash
npm start
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## プロジェクト構造

```
src/
├── components/          # React コンポーネント
│   ├── CustomerList.tsx    # 顧客一覧コンポーネント
│   └── CustomerDetail.tsx  # 顧客詳細コンポーネント
├── services/           # API サービス
│   └── googleSheetsApi.ts  # Google Sheets API 連携
├── types/              # TypeScript 型定義
│   └── customer.ts        # 顧客データの型定義
├── App.tsx             # メインアプリケーション
└── index.tsx           # エントリーポイント
```

## データ構造

### 顧客データ (CustomerData)

```typescript
interface CustomerData {
  id: string;                    // 顧客ID
  name: string;                  // 飼い主名
  petName: string;               // ペット名
  email: string;                 // メールアドレス
  phone: string;                 // 電話番号
  address: string;               // 住所
  petType: '犬' | '猫' | 'その他'; // ペットの種類
  breed: string;                 // 品種
  age: number;                   // 年齢
  weight: number;                // 体重
  imageUrl?: string;             // 画像URL
  notes: string;                 // 備考
  createdAt: string;             // 登録日
  lastVisit?: string;            // 最終来店日
  status: 'active' | 'inactive'; // ステータス
}
```

## 開発用モックデータ

開発環境では、Google Sheets API の代わりにモックデータが使用されます。本番環境では実際の Google Sheets からデータを取得します。

## ビルド

```bash
npm run build
```

ビルドされたファイルは `build/` フォルダに生成されます。

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## サポート

質問や問題がある場合は、プロジェクトの Issue ページでお知らせください。
