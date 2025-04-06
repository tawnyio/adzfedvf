import { apiRequest } from "./queryClient";
import { AuthResponse } from "@shared/types";

// Login function
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const res = await apiRequest('POST', '/api/login', { username, password });
    return await res.json();
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    };
  }
};

// Logout function
export const logout = async (): Promise<boolean> => {
  try {
    await apiRequest('POST', '/api/logout');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

// Get current user function
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const res = await apiRequest('GET', '/api/user');
    return await res.json();
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get current user'
    };
  }
};
