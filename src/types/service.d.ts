// Type definitions for service module
declare module '*/service' {
  export interface Service {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
    is_online?: boolean;
    price_online_15min?: number;
    price_online_30min?: number;
    price_online_60min?: number;
    price_offline_15min?: number;
    price_offline_30min?: number;
    price_offline_60min?: number;
  }
}
