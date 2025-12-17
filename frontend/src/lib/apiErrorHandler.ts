import { toast } from 'sonner';

export class APIError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    // Handle specific error statuses
    switch (error.status) {
      case 401:
        // Handle unauthorized (e.g., redirect to login)
        toast.error('Session expired. Please log in again.');
        // Redirect to login or refresh token logic here
        break;
      case 403:
        // Handle forbidden access
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        // Handle not found
        toast.error('The requested resource was not found.');
        break;
      case 422:
        // Handle validation errors
        if (error.details?.errors) {
          Object.values(error.details.errors).forEach((err: any) => {
            toast.error(err.message || 'Validation error');
          });
        } else {
          toast.error(error.message || 'Validation error');
        }
        break;
      case 500:
        // Handle server errors
        toast.error('An unexpected error occurred. Please try again later.');
        break;
      default:
        // Handle other errors
        toast.error(error.message || 'An error occurred');
    }
    
    // Return the error to be handled by the component if needed
    return error;
  }
  
  // Handle network errors or other unexpected errors
  toast.error('A network error occurred. Please check your connection.');
  return new Error('Network error');
};

// Helper function to handle API responses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleResponse = async (response: Response): Promise<any> => {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new APIError(
      data.message || `HTTP error! status: ${response.status}`,
      response.status,
      data
    );
  }
  
  return data;
};

// Wrapper for fetch with error handling
export const fetchWithErrorHandling = async (
  input: RequestInfo | URL,
  init?: RequestInit
) => {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    
    return await handleResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};
