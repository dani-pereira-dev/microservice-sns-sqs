export interface CreateProductRequest {
  title: string;
  price: number;
}

export interface UpdateProductRequest {
  title?: string;
  price?: number;
  active?: boolean;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
