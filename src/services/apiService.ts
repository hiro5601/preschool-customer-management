import { CustomerData } from '../types/customer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // 顧客一覧取得
  async getCustomers(): Promise<CustomerData[]> {
    return this.request<CustomerData[]>('/customers');
  }

  // 顧客詳細取得
  async getCustomerById(id: string): Promise<CustomerData | null> {
    try {
      return await this.request<CustomerData>(`/customers/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // 顧客作成
  async createCustomer(customerData: Omit<CustomerData, 'id'>): Promise<CustomerData> {
    return this.request<CustomerData>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  // 顧客更新
  async updateCustomer(id: string, customerData: Partial<CustomerData>): Promise<CustomerData> {
    return this.request<CustomerData>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  // 顧客削除
  async deleteCustomer(id: string): Promise<void> {
    await this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export default new ApiService();
