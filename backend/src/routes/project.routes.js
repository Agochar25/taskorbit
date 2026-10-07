import { Router } from 'express';
import { validateListQuery, validateProject } from '@taskorbit/shared';
import { asyncHandler } from '../utils/errors.js';
import { validate, validateId } from '../middleware/validate.js';
import * as c from '../controllers/project.controller.js';

const r = Router(); // mounted behind authenticate in routes/index.js
r.get('/', validate(validateListQuery, 'query', 'project'), asyncHandler(c.list));
r.post('/', validate(validateProject), asyncHandler(c.create));
r.get('/:id', validateId, asyncHandler(c.getOne));
r.put('/:id', validateId, validate(validateProject, 'body', { partial: true }), asyncHandler(c.update));
r.delete('/:id', validateId, asyncHandler(c.remove));
export default r;
