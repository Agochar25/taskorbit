import { isUuid } from '@taskorbit/shared';
import { AppError } from '../utils/errors.js';

/**
 * validate(fn, 'body' | 'query', options) runs a shared validator and replaces
 * the input with the cleaned value (trimmed, defaults applied, unknown keys dropped).
 */
export const validate = (fn, source = 'body', ...args) => (req, _res, next) => {
  const { value, errors } = fn(req[source], ...args);
  if (errors) return next(new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', errors));
  req.valid = { ...(req.valid || {}), [source]: value };
  next();
};

export const validateId = (req, _res, next) => {
  if (!isUuid(req.params.id)) return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid id', { id: 'id must be a valid UUID' }));
  next();
};
