import { useState, useCallback } from 'react';
import { APIError, handleApiError, fetchWithErrorHandling } from '@/lib/apiErrorHandler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error | APIError) => void;
  showToast?: boolean;
}

export function useApi<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | APIError | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(
    async (
      url: string,
      method: HttpMethod = 'GET',
      body?: any,
      options: UseApiOptions<T> = {}
    ) => {
      const { onSuccess, onError, showToast = true } = options;
      
      setLoading(true);
      setError(null);

      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('authToken')
          : null;

        const response = await fetchWithErrorHandling(API_BASE_URL + url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        setData(response);
        onSuccess?.(response);
        return response;
      } catch (err) {
        const error = err as Error | APIError;
        setError(error);
        
        if (showToast) {
          handleApiError(error);
        }
        
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const get = useCallback(
    (url: string, options?: UseApiOptions<T>) => request(url, 'GET', undefined, options),
    [request]
  );

  const post = useCallback(
    (url: string, body?: any, options?: UseApiOptions<T>) =>
      request(url, 'POST', body, options),
    [request]
  );

  const put = useCallback(
    (url: string, body?: any, options?: UseApiOptions<T>) =>
      request(url, 'PUT', body, options),
    [request]
  );

  const patch = useCallback(
    (url: string, body?: any, options?: UseApiOptions<T>) =>
      request(url, 'PATCH', body, options),
    [request]
  );

  const del = useCallback(
    (url: string, options?: UseApiOptions<T>) => request(url, 'DELETE', undefined, options),
    [request]
  );

  return {
    data,
    error,
    loading,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
  };
}

// Example usage:
/*
const MyComponent = () => {
  const { data, loading, error, get } = useApi<User[]>();

  const fetchUsers = async () => {
    try {
      const users = await get('/api/users');
      console.log('Users:', users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
*/
