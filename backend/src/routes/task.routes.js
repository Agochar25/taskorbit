import { Router } from 'express';
import { validateListQuery, validateTask } from '@taskorbit/shared';
import { asyncHandler } from '../utils/errors.js';
import { validate, validateId } from '../middleware/validate.js';
import * as c from '../controllers/task.controller.js';

const r = Router();
r.get('/', validate(validateListQuery, 'query', 'task'), asyncHandler(c.list));
r.post('/', validate(validateTask), asyncHandler(c.create));
r.get('/:id', validateId, asyncHandler(c.getOne));
r.put('/:id', validateId, validate(validateTask, 'body', { partial: true }), asyncHandler(c.update));
r.delete('/:id', validateId, asyncHandler(c.remove));
export default r;
