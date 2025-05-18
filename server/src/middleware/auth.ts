import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface UserPayload extends JwtPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      req.user = decoded;
      next();
    } catch (error) {
      // If token is expired but not invalid, allow the request
      if (error instanceof jwt.TokenExpiredError) {
        const decoded = jwt.decode(token) as UserPayload;
        if (decoded) {
          req.user = decoded;
          next();
          return;
        }
      }
      throw error;
    }
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '14d' });
}; 