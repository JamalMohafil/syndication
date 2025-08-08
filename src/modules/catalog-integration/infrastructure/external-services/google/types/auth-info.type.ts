export interface AuthInfo {
  accountIdentifiers: Array<{
    merchantId: string;
    aggregatorId?: string;
  }>;
}