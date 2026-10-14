import { Router } from 'express';
import {
  login,
  getMe,
  switchRole,
  getUsers,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/switch', switchRole);
router.get('/users', getUsers);

export default router;
