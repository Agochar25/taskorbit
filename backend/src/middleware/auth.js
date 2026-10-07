import { prisma } from '../config/prisma.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/tokens.js';

/** Requires a valid Bearer access token and attaches req.user. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication required');
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.');
    }
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication token');
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, fullName: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication token');
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to do that'));
  }
  next();
};
