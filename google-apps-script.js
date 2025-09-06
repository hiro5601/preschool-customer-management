/**
 * ウェブアプリ用のGET関数
 * フォーム送信時に呼び出される
 */
function doGet(e) {
  try {
    // フォーム送信時の処理を実行
    onSubmit(e);
    
    // 成功レスポンスを返す
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'データが正常に送信されました' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // エラーレスポンスを返す
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Googleフォーム送信時の処理
 * 管理システムのAPIに直接送信
 */
function onSubmit(e) {
  try {
    // フォームデータを取得
    const formData = e.values;
    
    // フォームの列構造に基づいてデータを解析
    // 列順序: タイムスタンプ, お名前, ふりがな, メール, 電話, 住所, ペット名, 犬種, 年齢, 体重, 備考, 登録日, 最終来店
    const customerData = {
      name: formData[1] || '', // お名前
      furigana: formData[2] || '', // ふりがな
      email: formData[3] || '', // メール
      phone: formData[4] || '', // 電話
      address: formData[5] || '', // 住所
      petName: formData[6] || '', // ペット名
      petType: formData[7] || 'その他', // 犬種
      age: parseInt(formData[8]) || 0, // 年齢
      weight: parseFloat(formData[9]) || 0, // 体重
      notes: formData[10] || '' // 備考
    };
    
    // 必須フィールドの検証
    if (!customerData.name || !customerData.email || !customerData.phone || !customerData.petName) {
      console.error('必須フィールドが不足しています:', customerData);
      return;
    }
    
    // 管理システムのAPIエンドポイント（本番環境）
    const apiUrl = 'https://cf334231.cloudfree.jp/api/customers';
    
    // APIキーを取得（スクリプトプロパティから）
    const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    
    if (!apiKey) {
      console.error('API_KEYが設定されていません');
      return;
    }
    
    // 管理システムに送信
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      payload: JSON.stringify(customerData)
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode === 200) {
      const result = JSON.parse(responseText);
      console.log('顧客データが正常に送信されました:', result);
      
      // 成功通知（オプション）
      // MailApp.sendEmail({
      //   to: 'admin@example.com',
      //   subject: '新しい顧客が登録されました',
      //   body: `顧客名: ${customerData.name}\nペット名: ${customerData.petName}\nID: ${result.id}`
      // });
      
    } else {
      console.error('API送信エラー:', responseCode, responseText);
      
      // エラー通知（オプション）
      // MailApp.sendEmail({
      //   to: 'admin@example.com',
      //   subject: '顧客データ送信エラー',
      //   body: `エラーコード: ${responseCode}\nエラー内容: ${responseText}`
      // });
    }
    
  } catch (error) {
    console.error('フォーム送信処理でエラーが発生しました:', error);
    
    // エラー通知（オプション）
    // MailApp.sendEmail({
    //   to: 'admin@example.com',
    //   subject: 'フォーム送信処理エラー',
    //   body: `エラー詳細: ${error.toString()}`
    // });
  }
}

/**
 * スクリプトの初期設定
 * 初回実行時にAPIキーを設定
 */
function setup() {
  // APIキーを設定（実際のキーに置き換えてください）
  PropertiesService.getScriptProperties().setProperty('API_KEY', 'your-secure-api-key');
  
  console.log('スクリプトの初期設定が完了しました');
}

/**
 * テスト用関数
 * 手動でテストデータを送信
 */
function testSubmit() {
  const testData = {
    values: [
      new Date(), // タイムスタンプ
      'テスト太郎', // お名前
      'てすとたろう', // ふりがな
      'test@example.com', // メール
      '090-1234-5678', // 電話
      '東京都渋谷区', // 住所
      'テストポチ', // ペット名
      '柴犬', // 犬種
      '3', // 年齢
      '8.5', // 体重
      'テスト用データです', // 備考
      '', // 登録日
      '' // 最終来店
    ]
  };
  
  onSubmit(testData);
}
