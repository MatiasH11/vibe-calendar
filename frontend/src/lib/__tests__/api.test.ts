/**
 * ApiClient Tests
 * Tests for the enhanced API client with HTTP methods, retry logic, and error handling
 */

import { apiClient, ApiResponse, BatchRequest, BatchResponse } from '../api';
import { ApiError } from '../errors';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any stored tokens
    apiClient.clearToken();
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      const token = 'test-token-123';
      apiClient.setToken(token);
      expect(apiClient.getToken()).toBe(token);
    });

    it('should clear token', () => {
      apiClient.setToken('test-token');
      apiClient.clearToken();
      expect(apiClient.getToken()).toBeNull();
    });

    it('should include token in Authorization header when set', async () => {
      const token = 'test-token-123';
      apiClient.setToken(token);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 1 } }),
      });

      await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('should not include Authorization header when token is not set', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 1 } }),
      });

      await apiClient.get('/test');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['Authorization']).toBeUndefined();
    });
  });

  describe('GET Method', () => {
    it('should successfully fetch data', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockData }),
      });

      const response = await apiClient.get<typeof mockData>('/test');

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle query parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.get('/test', {
        params: { page: '1', limit: '10', search: 'test' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&limit=10&search=test'),
        expect.any(Object)
      );
    });

    it('should throw ApiError on error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Not found',
          statusCode: 404,
        }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    });
  });

  describe('POST Method', () => {
    it('should successfully post data', async () => {
      const postData = { name: 'New Item' };
      const mockResponse = { id: 1, ...postData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const response = await apiClient.post<typeof mockResponse>('/test', postData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
    });

    it('should handle validation errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Validation failed',
          statusCode: 400,
          metadata: {
            validationErrors: [
              { field: 'name', message: 'Name is required' },
            ],
          },
        }),
      });

      await expect(apiClient.post('/test', {})).rejects.toThrow(ApiError);
    });
  });

  describe('PUT Method', () => {
    it('should successfully update data', async () => {
      const updateData = { name: 'Updated Item' };
      const mockResponse = { id: 1, ...updateData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const response = await apiClient.put<typeof mockResponse>('/test/1', updateData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('PATCH Method', () => {
    it('should successfully patch data', async () => {
      const patchData = { name: 'Patched' };
      const mockResponse = { id: 1, name: 'Patched', status: 'active' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const response = await apiClient.patch<typeof mockResponse>('/test/1', patchData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('DELETE Method', () => {
    it('should successfully delete data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({ success: true }),
      });

      const response = await apiClient.delete('/test/1');

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network error', async () => {
      // First two calls fail, third succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 1 } }),
        });

      const response = await apiClient.get('/test', { retryCount: 3 });

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on 5xx server errors', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 1 } }),
        });

      const response = await apiClient.get('/test', { retryCount: 2 });

      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx client errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Bad request',
          statusCode: 400,
        }),
      });

      await expect(apiClient.get('/test', { retryCount: 3 })).rejects.toThrow();

      // Should only be called once, no retries
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should respect exponential backoff between retries', async () => {
      const startTime = Date.now();

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 1 } }),
        });

      await apiClient.get('/test', { retryCount: 2, retryDelay: 100 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should wait at least 100ms (first retry delay)
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should throw error after max retries exceeded', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(apiClient.get('/test', { retryCount: 2 })).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel request using AbortController', async () => {
      const abortController = new AbortController();

      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            if (abortController.signal.aborted) {
              reject(new DOMException('Aborted', 'AbortError'));
            }
          }, 100);
        });
      });

      const requestPromise = apiClient.get('/test', {
        signal: abortController.signal,
      });

      // Cancel after 50ms
      setTimeout(() => abortController.abort(), 50);

      await expect(requestPromise).rejects.toThrow();
    });

    it('should respect timeout option', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        return new Promise((resolve) => {
          // Simulate slow response (2 seconds)
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: async () => ({ success: true, data: {} }),
            });
          }, 2000);
        });
      });

      // Set timeout to 100ms
      await expect(
        apiClient.get('/test', { timeout: 100 })
      ).rejects.toThrow();
    });
  });

  describe('Batch Operations', () => {
    it('should execute batch requests successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 1 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 2 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 3 } }),
        });

      const requests: BatchRequest[] = [
        { method: 'GET', endpoint: '/test/1' },
        { method: 'GET', endpoint: '/test/2' },
        { method: 'GET', endpoint: '/test/3' },
      ];

      const responses = await apiClient.batch(requests);

      expect(responses).toHaveLength(3);
      expect(responses[0].success).toBe(true);
      expect(responses[1].success).toBe(true);
      expect(responses[2].success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure in batch', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 1 } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ success: false, error: 'Not found', statusCode: 404 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 3 } }),
        });

      const requests: BatchRequest[] = [
        { method: 'GET', endpoint: '/test/1' },
        { method: 'GET', endpoint: '/test/2' },
        { method: 'GET', endpoint: '/test/3' },
      ];

      const responses = await apiClient.batch(requests);

      expect(responses).toHaveLength(3);
      expect(responses[0].success).toBe(true);
      expect(responses[1].success).toBe(false);
      expect(responses[2].success).toBe(true);
    });
  });

  describe('File Upload', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockResponse = {
        fileId: 'file-123',
        fileName: 'test.txt',
        fileSize: 12,
        url: 'https://example.com/files/test.txt',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const response = await apiClient.uploadFile('/upload', mockFile, {
        description: 'Test file',
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockResponse);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.method).toBe('POST');
      expect(callArgs.body).toBeInstanceOf(FormData);
    });

    it('should include metadata in file upload', async () => {
      const mockFile = new File(['content'], 'doc.pdf', { type: 'application/pdf' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.uploadFile('/upload', mockFile, {
        category: 'documents',
        tags: ['important', 'contract'],
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const formData = callArgs.body as FormData;

      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('metadata')).toBe(
        JSON.stringify({ category: 'documents', tags: ['important', 'contract'] })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test', { retryCount: 1 })).rejects.toThrow();
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiClient.get('/test')).rejects.toThrow();
    });

    it('should handle empty response body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      });

      const response = await apiClient.delete('/test/1');

      expect(response.success).toBe(true);
    });
  });

  describe('Custom Headers', () => {
    it('should allow custom headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.get('/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
          'Accept-Language': 'es',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
            'Accept-Language': 'es',
          }),
        })
      );
    });

    it('should merge custom headers with default headers', async () => {
      apiClient.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.get('/test', {
        headers: { 'X-Custom': 'value' },
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/json');
      expect(callArgs.headers['Authorization']).toBe('Bearer test-token');
      expect(callArgs.headers['X-Custom']).toBe('value');
    });
  });
});
