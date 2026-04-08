export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent';
  name: string;
  state: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
}

export interface InventoryItem {
  agentId: string;
  productId: string;
  quantity: number;
  product?: Product;
  agent?: User;
}

export interface Transfer {
  id: string;
  sourceAgentId: string;
  destinationAgentId: string;
  productId: string;
  quantity: number;
  status: 'Pending' | 'In Transit' | 'Delivered';
  createdAt: string;
  deliveredAt?: string;
  product?: Product;
  sourceAgent?: User;
  destinationAgent?: User;
}
