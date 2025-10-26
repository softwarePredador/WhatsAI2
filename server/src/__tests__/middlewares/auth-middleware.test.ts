import { Request, Response, NextFunction } from 'express';
import { authMiddleware, adminMiddleware } from '../../api/middlewares/auth-middleware';
import { authService } from '../../services/auth-service';

// Mock do authService
jest.mock('@/services/auth-service', () => ({
  authService: {
    verifyToken: jest.fn()
  }
}));

describe('Auth Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    test('should return 401 when no authorization header is provided', async () => {
      mockRequest.headers = {};

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No authorization token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic token123'
      };

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when Bearer token is empty', async () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when token verification fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(authService.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should attach user info to request and call next when token is valid', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'USER'
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockUser);

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.userId).toBe('user-123');
      expect(mockRequest.userEmail).toBe('user@example.com');
      expect(mockRequest.userRole).toBe('USER');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should return 401 with generic message when unknown error occurs', async () => {
      mockRequest.headers = {
        authorization: 'Bearer some-token'
      };

      (authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw 'Unknown error';
      });

      await authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('adminMiddleware', () => {
    test('should return 403 when user role is not ADMIN', () => {
      mockRequest.userRole = 'USER';

      adminMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next when user role is ADMIN', () => {
      mockRequest.userRole = 'ADMIN';

      adminMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('should return 403 when user role is undefined', () => {
      mockRequest.userRole = undefined;

      adminMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});