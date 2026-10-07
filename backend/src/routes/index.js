import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateId } from '../middleware/validate.js';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import { getDashboard } from '../controllers/dashboard.controller.js';
import * as admin from '../controllers/admin.controller.js';

const api = Router();
api.use('/auth', authRoutes);

// Everything below requires a valid access token.
api.use(authenticate);
api.use('/projects', projectRoutes);
api.use('/tasks', taskRoutes);
api.get('/dashboard', asyncHandler(getDashboard));
api.get('/activity', asyncHandler(admin.myActivity));

// Role-based access control: ADMIN only.
api.get('/admin/users', requireRole('ADMIN'), asyncHandler(admin.listUsers));
api.get('/admin/audit-logs', requireRole('ADMIN'), asyncHandler(admin.listAuditLogs));
api.patch('/admin/users/:id/role', requireRole('ADMIN'), validateId, asyncHandler(admin.setRole));

export default api;
