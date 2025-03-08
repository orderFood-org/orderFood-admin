import { http } from "@/utils/http";

// 餐品类型接口
export interface DishCategory {
  id: number;
  name: string;
  createTime?: string;
  updateTime?: string;
}

// 餐品接口
export interface Dish {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  image: string;
  description: string;
  status: number;
  saleNum: number;
  createTime?: string;
  updateTime?: string;
}

// 餐品查询参数
export interface DishQueryParams {
  page: number;
  pageSize: number;
  name?: string;
  categoryId?: number | null;
  status?: number | null;
}

// 餐品列表响应
export interface DishListResponse {
  list: Dish[];
  total: number;
}

// 获取餐品列表
export const getDishList = (params: DishQueryParams) => {
  return http.request<DishListResponse>("get", "/dishes", { params });
};

// 获取餐品详情
export const getDishDetail = (id: number) => {
  return http.request<Dish>("get", `/dishes/${id}`);
};

// 添加餐品
export const addDish = (data: Omit<Dish, "id">) => {
  return http.request<Dish>("post", "/dishes", { data });
};

// 更新餐品
export const updateDish = (id: number, data: Partial<Dish>) => {
  return http.request<Dish>("put", `/dishes/${id}`, { data });
};

// 删除餐品
export const deleteDish = (id: number) => {
  return http.request<any>("delete", `/dishes/${id}`);
};

// 修改餐品状态
export const changeDishStatus = (id: number, status: number) => {
  return http.request<any>("patch", `/dishes/${id}/status`, {
    data: { status }
  });
};

// 获取餐品分类列表
export const getDishCategories = () => {
  return http.request<DishCategory[]>("get", "/dish-categories");
};

// 添加餐品分类
export const addDishCategory = (data: { name: string }) => {
  return http.request<DishCategory>("post", "/dish-categories", { data });
};

// 更新餐品分类
export const updateDishCategory = (id: number, data: { name: string }) => {
  return http.request<DishCategory>("put", `/dish-categories/${id}`, { data });
};

// 删除餐品分类
export const deleteDishCategory = (id: number) => {
  return http.request<any>("delete", `/dish-categories/${id}`);
};
