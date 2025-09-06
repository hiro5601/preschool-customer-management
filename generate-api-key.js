// セキュアなAPIキーを生成するスクリプト
const crypto = require('crypto');

// 32バイトのランダムなAPIキーを生成
const apiKey = crypto.randomBytes(32).toString('hex');

console.log('生成されたAPIキー:');
console.log(apiKey);
console.log('');
console.log('このキーをGoogle Apps Scriptのスクリプトプロパティに設定してください');
console.log('プロパティ名: API_KEY');
console.log('値: ' + apiKey);
