import { Router } from 'express';
import { register, login, adminForgotPassword, adminResetPassword } from '../controllers/authController';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/admin/forgot-password', adminForgotPassword);
router.post('/admin/reset-password', adminResetPassword);

export default router;