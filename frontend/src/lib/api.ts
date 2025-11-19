// Get API base URL - use environment variable or detect from current host
function getApiBaseUrl(): string {
  // Use environment variable if set
  if (typeof window !== "undefined" && (window as any).__NEXT_PUBLIC_BACKEND_URL__) {
    return (window as any).__NEXT_PUBLIC_BACKEND_URL__;
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  
  // In browser, use the same host as the frontend but with port 4000
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    // If accessing from localhost, use localhost for backend
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000";
    }
    // Otherwise use the same host (for network access)
    return `${protocol}//${host}:4000`;
  }
  
  // Server-side default
  return "http://localhost:4000";
}

type TemplateItem = {
  title: string;
  description: string;
  slug: string;
};

type HealthResponse = {
  ok: boolean;
  status?: string;
  database_version?: string;
  timestamp?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const apiBaseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
      cache: init?.cache ?? "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Unable to connect to the server. Please make sure the backend is running at ${apiBaseUrl}`
      );
    }
    // Re-throw other errors
    throw error;
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export async function fetchTemplates(): Promise<TemplateItem[]> {
  const data = await request<{ items: TemplateItem[] }>("/api/templates", {
    cache: "reload",
  });

  return data.items;
}

// Food inventory types
export type FoodInventoryItem = {
  id: number;
  item_name: string;
  category: string;
  expiration_days: number;
  cost_per_unit: number;
};

export async function fetchFoodInventory(): Promise<FoodInventoryItem[]> {
  const data = await request<{ items: FoodInventoryItem[] }>("/api/inventory", {
    cache: "reload",
  });

  return data.items;
}

// Authentication types
export type AuthResponse = {
  message: string;
  user: {
    id: number;
    email: string;
    name: string;
    avatarUrl?: string;
  };
  token: string;
};

export type SignupData = {
  name: string;
  email: string;
  password: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type GoogleAuthData = {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

// Authentication functions
export async function signup(data: SignupData): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function googleAuth(data: GoogleAuthData): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

// User types
export type User = {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  budgetPreferences?: "low" | "medium" | "high";
  dietaryNeeds?: string;
};

export type UserResponse = {
  user: User;
};

export type UpdateProfileData = {
  name?: string;
  budgetPreferences?: "low" | "medium" | "high";
  dietaryNeeds?: string;
};

// Fetch current user
export async function getCurrentUser(): Promise<User> {
  const data = await request<UserResponse>("/api/auth/me");
  return data.user;
}

// Update user profile
export async function updateProfile(data: UpdateProfileData): Promise<User> {
  const response = await request<UserResponse>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.user;
}

// Food usage types
export type FoodUsageLog = {
  id: number;
  itemName: string;
  quantity: number;
  category: string;
  usageDate: string;
  createdAt: string;
};

export type FoodUsageLogData = {
  itemName: string;
  quantity: number;
  category: string;
  usageDate?: string;
};

export type FoodUsageLogResponse = {
  message: string;
  log: FoodUsageLog;
};

export type BulkFoodUsageResponse = {
  message: string;
  logs: FoodUsageLog[];
};

export type FoodUsageLogsResponse = {
  logs: FoodUsageLog[];
};

// Create a single food usage log
export async function createFoodUsageLog(
  data: FoodUsageLogData
): Promise<FoodUsageLog> {
  const response = await request<FoodUsageLogResponse>("/api/food-usage", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.log;
}

// Bulk create food usage logs
export async function bulkCreateFoodUsageLogs(
  logs: FoodUsageLogData[]
): Promise<FoodUsageLog[]> {
  const response = await request<BulkFoodUsageResponse>("/api/food-usage/bulk", {
    method: "POST",
    body: JSON.stringify({ logs }),
  });
  return response.logs;
}

// Get food usage logs for a specific date (defaults to today)
export async function getFoodUsageLogs(date?: string): Promise<FoodUsageLog[]> {
  const url = date
    ? `/api/food-usage?date=${encodeURIComponent(date)}`
    : "/api/food-usage";
  const response = await request<FoodUsageLogsResponse>(url);
  return response.logs;
}

// User inventory types
export type UserInventoryItem = {
  id: number;
  itemName: string;
  quantity: number;
  category: string;
  purchaseDate?: string | null;
  expirationDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserInventoryItemData = {
  itemName: string;
  quantity: number;
  category: string;
  purchaseDate?: string;
  expirationDate?: string;
  notes?: string;
};

export type UserInventoryItemResponse = {
  message: string;
  item: UserInventoryItem;
};

export type BulkUserInventoryResponse = {
  message: string;
  items: UserInventoryItem[];
};

export type UserInventoryItemsResponse = {
  items: UserInventoryItem[];
};

// Get user inventory items
export async function getUserInventory(): Promise<UserInventoryItem[]> {
  const response = await request<UserInventoryItemsResponse>("/api/user-inventory");
  return response.items;
}

// Create a single inventory item
export async function createUserInventoryItem(
  data: UserInventoryItemData
): Promise<UserInventoryItem> {
  const response = await request<UserInventoryItemResponse>("/api/user-inventory", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.item;
}

// Bulk create inventory items
export async function bulkCreateUserInventoryItems(
  items: UserInventoryItemData[]
): Promise<UserInventoryItem[]> {
  const response = await request<BulkUserInventoryResponse>("/api/user-inventory/bulk", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return response.items;
}

// Update an inventory item
export async function updateUserInventoryItem(
  id: number,
  data: Partial<UserInventoryItemData>
): Promise<UserInventoryItem> {
  const response = await request<UserInventoryItemResponse>(`/api/user-inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.item;
}

// Delete an inventory item
export async function deleteUserInventoryItem(id: number): Promise<void> {
  await request<{ message: string }>(`/api/user-inventory/${id}`, {
    method: "DELETE",
  });
}

