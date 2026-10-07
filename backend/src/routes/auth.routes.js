import { Router } from 'express';
import { validateLogin, validateRegister } from '@taskorbit/shared';
import { asyncHandler } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import * as c from '../controllers/auth.controller.js';

const r = Router();
r.post('/register', authLimiter, validate(validateRegister), asyncHandler(c.register));
r.post('/login', authLimiter, validate(validateLogin), asyncHandler(c.login));
r.post('/refresh', authLimiter, asyncHandler(c.refresh));
r.post('/logout', asyncHandler(c.logout));
r.get('/me', authenticate, c.me);
export default r;
