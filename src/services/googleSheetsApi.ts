import { CustomerData } from '../types/customer';

// Google API の型定義
declare global {
  interface Window {
    gapi: any;
  }
}

class GoogleSheetsService {
  private spreadsheetId: string;
  private apiKey: string;
  private clientEmail: string;
  private privateKey: string;
  private gapi: any; // Google API インスタンス
  // キャッシュ機能を削除（都度取得に変更）
  private readonly MAX_RETRIES = 3; // リトライ回数を増加
  private readonly RETRY_DELAY = 2000; // 2秒待機に短縮
  private lastApiCall: number = 0;
  private readonly MIN_API_INTERVAL = 1000; // 1秒間隔でAPI呼び出し

  constructor() {
    this.spreadsheetId = (process.env.REACT_APP_SPREADSHEET_ID || '').trim();
    this.apiKey = (process.env.REACT_APP_GOOGLE_API_KEY || '').trim();
    this.clientEmail = (process.env.REACT_APP_GOOGLE_CLIENT_EMAIL || '').trim();
    this.privateKey = (process.env.REACT_APP_GOOGLE_PRIVATE_KEY || '').trim();
  }

  async getCustomers(): Promise<CustomerData[]> {
    // 本番環境では常にGoogle Sheets APIから最新データを取得
    if (process.env.NODE_ENV === 'production' && this.spreadsheetId && this.apiKey) {
      try {
        console.log('Google Sheetsから最新データを取得中...');
        const data = await this.fetchFromGoogleSheetsWithRetry();
        // ローカルストレージに保存（同期のため）
        this.saveLocalCustomers(data);
        console.log('Google Sheetsから取得完了:', data.length, '件');
        return data;
      } catch (error) {
        console.error('Google Sheets API エラー:', error);
        // エラーの場合はローカルストレージから取得
        const localData = this.getLocalCustomers();
        if (localData.length > 0) {
          console.log('エラーのためローカルストレージから取得:', localData.length, '件');
          return localData;
        }
        console.log('ローカルストレージも空のため、空の配列を返します');
        return [];
      }
    }
    
    // 開発環境でもGoogle Sheetsから取得
    return await this.fetchFromGoogleSheetsWithRetry();
  }

  private async fetchFromGoogleSheetsWithRetry(): Promise<CustomerData[]> {
    // API呼び出し間隔を制御
    const timeSinceLastCall = Date.now() - this.lastApiCall;
    if (timeSinceLastCall < this.MIN_API_INTERVAL) {
      const waitTime = this.MIN_API_INTERVAL - timeSinceLastCall;
      console.log(`${waitTime}ms 待機してからAPI呼び出し...`);
      await this.sleep(waitTime);
    }

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`Google Sheets API 呼び出し (試行 ${attempt}/${this.MAX_RETRIES})`);
        this.lastApiCall = Date.now();
        return await this.fetchFromGoogleSheets();
      } catch (error: any) {
        console.error(`試行 ${attempt} 失敗:`, error);
        
        // レート制限エラーの場合、待機時間を増やす
        if (error.message.includes('429') || error.message.includes('RATE_LIMIT_EXCEEDED')) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1); // 指数バックオフ
          console.log(`${delay}ms 待機してから再試行...`);
          await this.sleep(delay);
          continue;
        }
        
        // 最後の試行でも失敗した場合、ローカルストレージから取得
        if (attempt === this.MAX_RETRIES) {
          console.log('Google Sheets API が利用できないため、ローカルストレージから取得します');
          const localData = this.getLocalCustomers();
          if (localData.length > 0) {
            return localData;
          }
          // ローカルストレージも空の場合は空の配列を返す
          return [];
        }
        
        // その他のエラーは即座に失敗
        throw error;
      }
    }
    
    throw new Error('最大リトライ回数に達しました');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Google API を初期化
  private async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('ブラウザ環境で実行してください'));
        return;
      }

      // Google API スクリプトが既に読み込まれているかチェック
      if (window.gapi) {
        this.gapi = window.gapi;
        resolve();
        return;
      }

      // Google API スクリプトを動的に読み込み
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.apiKey,
              discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            this.gapi = window.gapi;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = () => reject(new Error('Google API スクリプトの読み込みに失敗しました'));
      document.head.appendChild(script);
    });
  }

  // サービスアカウント認証でJWTトークンを取得
  private async getServiceAccountToken(): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };

      const payload = {
        iss: this.clientEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600, // 1時間有効
        sub: this.clientEmail
      };

      // JWTトークンを生成（簡略化された実装）
      const encodedHeader = btoa(JSON.stringify(header));
      const encodedPayload = btoa(JSON.stringify(payload));
      const signature = await this.signJWT(`${encodedHeader}.${encodedPayload}`);
      
      return `${encodedHeader}.${encodedPayload}.${signature}`;
    } catch (error) {
      console.error('JWTトークン生成エラー:', error);
      throw error;
    }
  }

  // JWT署名を生成（簡略化）
  private async signJWT(data: string): Promise<string> {
    // 実際の実装では、Web Crypto APIを使用してRS256署名を生成する必要があります
    // ここでは簡略化のため、空の文字列を返します
    console.warn('JWT署名の実装が必要です');
    return '';
  }

  private async fetchFromGoogleSheets(): Promise<CustomerData[]> {
    try {
      console.log('Google Sheets API 設定:', {
        spreadsheetId: this.spreadsheetId,
        apiKey: this.apiKey ? '設定済み' : '未設定',
        environment: process.env.NODE_ENV
      });

      // 一般公開されたスプレッドシートにAPIキーでアクセス
      // まず、スプレッドシートの情報を取得してシート名を確認
      const spreadsheetInfoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId.trim()}?key=${this.apiKey}`;
      console.log('スプレッドシート情報取得URL:', spreadsheetInfoUrl);
      
      const infoResponse = await fetch(spreadsheetInfoUrl);
      if (!infoResponse.ok) {
        throw new Error(`Spreadsheet info request failed: ${infoResponse.status}`);
      }
      
      const spreadsheetInfo = await infoResponse.json();
      console.log('スプレッドシート情報:', spreadsheetInfo);
      
      // 「フォームの回答」シートを取得
      const sheetName = 'フォームの回答';
      console.log('使用するシート名:', sheetName);
      
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId.trim()}/values/${encodeURIComponent(sheetName)}?key=${this.apiKey}`;
      console.log('API URL:', url);
      
      const response = await fetch(url);
      
      console.log('API レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API エラーレスポンス:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('取得したデータ:', data);
      
      const parsedData = this.parseSheetData(data.values || []);
      console.log('解析されたデータ:', parsedData);
      
      return parsedData;
    } catch (error) {
      console.error('Google Sheets データ取得エラー:', error);
      throw error;
    }
  }

  private parseSheetData(values: string[][]): CustomerData[] {
    if (values.length < 2) {
      return [];
    }

    // ヘッダー行をスキップしてデータを解析
    const headers = values[0];
    const dataRows = values.slice(1);

    console.log('ヘッダー:', headers);
    console.log('データ行数:', dataRows.length);

    return dataRows.map((row, index) => {
      console.log(`行 ${index + 1}:`, row);
      
      // ヘッダーに基づいてデータをマッピング
      const getValue = (headerName: string) => {
        const headerIndex = headers.findIndex(h => h && h.toLowerCase().includes(headerName.toLowerCase()));
        return headerIndex >= 0 ? (row[headerIndex] || '').trim() : '';
      };

      // フォーム回答の列構造に基づいてデータを解析
      // フォーム回答の列順序: タイムスタンプ, お名前, ふりがな, メール, 電話, 住所, ペット名, 犬種, 年齢, 体重, 備考, 登録日, 最終来店
      const customer = {
        id: `C${String(index + 1).padStart(3, '0')}`, // 管理システム側で自動付与
        name: row[1] || '', // お名前（B列）
        furigana: row[2] || '', // ふりがな（C列）
        email: row[3] || '', // メール（D列）
        phone: row[4] || '', // 電話（E列）
        address: row[5] || '', // 住所（F列）
        petName: row[6] || '', // ペット名（G列）
        petType: (row[7] || 'その他') as '犬' | '猫' | 'その他', // 犬種（H列）
        breed: '', // 品種は削除
        age: parseInt(row[8] || '0') || 0, // 年齢（I列）
        weight: parseFloat(row[9] || '0') || 0, // 体重（J列）
        imageUrl: '', // 画像URLは削除
        notes: row[10] || '', // 備考（K列）
        createdAt: row[11] || new Date().toISOString().split('T')[0], // 登録日（L列）
        lastVisit: row[12] || '', // 最終来店（M列）
        status: 'active' as 'active' | 'inactive' // デフォルトでアクティブ
      };

      console.log(`解析された顧客 ${index + 1}:`, customer);
      return customer;
    }).filter(customer => customer.name && customer.petName); // 名前とペット名があるもののみ
  }

  async getCustomerById(id: string): Promise<CustomerData | null> {
    const customers = await this.getCustomers();
    return customers.find(customer => customer.id === id) || null;
  }

  // ローカルストレージから顧客データを取得
  private getLocalCustomers(): CustomerData[] {
    try {
      const stored = localStorage.getItem('かんりしすてむpreschool_customers');
      if (stored) {
        const data = JSON.parse(stored);
        console.log('ローカルストレージから取得したデータ:', data);
        return data;
      }
    } catch (error) {
      console.error('ローカルストレージからのデータ取得エラー:', error);
    }
    return [];
  }

  // ローカルストレージに顧客データを保存
  private saveLocalCustomers(customers: CustomerData[]): void {
    try {
      localStorage.setItem('かんりしすてむpreschool_customers', JSON.stringify(customers));
      console.log('ローカルストレージに保存:', customers.length, '件');
    } catch (error) {
      console.error('ローカルストレージへの保存エラー:', error);
    }
  }

  // ローカルストレージをクリア
  public clearLocalData(): void {
    try {
      localStorage.removeItem('かんりしすてむpreschool_customers');
      console.log('ローカルストレージをクリアしました');
    } catch (error) {
      console.error('ローカルストレージのクリアエラー:', error);
    }
  }

  // 特定の顧客データを削除（ローカルストレージのみ）
  public deleteCustomer(id: string): void {
    try {
      const customers = this.getLocalCustomers();
      const updatedCustomers = customers.filter(customer => customer.id !== id);
      this.saveLocalCustomers(updatedCustomers);
      console.log(`顧客ID ${id} をローカルストレージから削除しました`);
    } catch (error) {
      console.error('顧客データの削除エラー:', error);
    }
  }

  // 顧客データを更新（ローカルストレージとGoogle Sheets両方）
  public async updateCustomer(updatedCustomer: CustomerData): Promise<void> {
    try {
      // ローカルストレージを更新
      const customers = this.getLocalCustomers();
      const customerIndex = customers.findIndex(c => c.id === updatedCustomer.id);
      
      if (customerIndex === -1) {
        throw new Error('顧客が見つかりません');
      }

      customers[customerIndex] = updatedCustomer;
      this.saveLocalCustomers(customers);
      console.log(`顧客ID ${updatedCustomer.id} をローカルストレージで更新しました`);

      // 本番環境の場合、Google Sheetsも更新
      if (process.env.NODE_ENV === 'production') {
        await this.updateCustomerInSheets(updatedCustomer);
      }
    } catch (error) {
      console.error('顧客データの更新エラー:', error);
      throw error;
    }
  }

  // Google Sheetsで顧客データを更新
  private async updateCustomerInSheets(customer: CustomerData): Promise<void> {
    try {
      // 顧客データを取得して行番号を特定
      const customers = await this.getCustomers();
      const customerIndex = customers.findIndex(c => c.id === customer.id);
      
      if (customerIndex === -1) {
        throw new Error('顧客が見つかりません');
      }

      // 行番号を計算（ヘッダー行を考慮して+2）
      const rowNumber = customerIndex + 2;

      // データをGoogle Sheetsの形式に変換（フォーム回答用）
      const rowData = [
        '', // タイムスタンプ（A列）- 更新時は空
        customer.name, // お名前（B列）
        customer.furigana || '', // ふりがな（C列）
        customer.email, // メール（D列）
        customer.phone, // 電話（E列）
        customer.address, // 住所（F列）
        customer.petName, // ペット名（G列）
        customer.petType, // 犬種（H列）
        customer.age, // 年齢（I列）
        customer.weight, // 体重（J列）
        customer.notes, // 備考（K列）
        customer.createdAt, // 登録日（L列）
        customer.lastVisit // 最終来店（M列）
      ];

      // 行を更新
      const requestBody = {
        values: [rowData]
      };

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/A${rowNumber}:M${rowNumber}?valueInputOption=RAW&key=${this.apiKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Sheets API エラー: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      console.log(`顧客 ${customer.id} をGoogle Sheetsで更新しました`);
    } catch (error) {
      console.error('Google Sheetsでの更新に失敗しました:', error);
      throw error;
    }
  }

  // Google Sheetsから顧客を削除（fetch APIを使用）
  public async deleteCustomerFromSheets(id: string): Promise<void> {
    try {
      // 顧客データを取得して行番号を特定
      const customers = await this.getCustomers();
      const customerIndex = customers.findIndex(c => c.id === id);
      
      if (customerIndex === -1) {
        throw new Error('顧客が見つかりません');
      }

      // 行番号を計算（ヘッダー行を考慮して+2）
      const rowNumber = customerIndex + 2;

      // サービスアカウント認証でJWTトークンを取得
      const token = await this.getServiceAccountToken();
      
      // アクセストークンを取得
      const accessToken = await this.getAccessToken(token);

      // 行を削除
      const requestBody = {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber
            }
          }
        }]
      };

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Sheets API エラー: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      console.log(`顧客 ${id} をGoogle Sheetsから削除しました`);
    } catch (error) {
      console.error('Google Sheetsからの削除に失敗しました:', error);
      throw error;
    }
  }

  // アクセストークンを取得
  private async getAccessToken(jwtToken: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken
      })
    });

    if (!response.ok) {
      throw new Error(`アクセストークン取得エラー: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  // 顧客を完全に削除（現在はローカルストレージのみ）
  public async deleteCustomerCompletely(id: string): Promise<void> {
    try {
      // ローカルストレージから削除
      this.deleteCustomer(id);
      
      // TODO: Google Sheetsからの削除は認証の問題で一時的に無効化
      // サービスアカウント認証の実装が必要
      console.log(`顧客 ${id} をローカルストレージから削除しました`);
      console.log('注意: Google Sheetsからの削除は現在無効です');
      
      // 将来的にGoogle Sheetsからも削除する場合のコード
      // if (process.env.NODE_ENV === 'production') {
      //   await this.deleteCustomerFromSheets(id);
      // }
    } catch (error) {
      console.error('顧客の削除に失敗しました:', error);
      throw error;
    }
  }

  // スプレッドシートからデータを再取得してローカルに保存
  public async refreshFromSheets(): Promise<CustomerData[]> {
    console.log('スプレッドシートからデータを再取得します...');
    return await this.getCustomers();
  }

}

export default GoogleSheetsService;