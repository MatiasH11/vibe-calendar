import { Router } from 'express';
import { validate_body } from '../middlewares/validation_middleware';
import { login_schema, register_schema } from '../validations/auth.validation';
import { login_handler, register_handler } from '../controllers/auth.controller';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

// Documentation now centralized in src/docs/openapi.yaml
router.post('/register', authRateLimiter, validate_body(register_schema), register_handler);
router.post('/login', authRateLimiter, validate_body(login_schema), login_handler);

export default router;


