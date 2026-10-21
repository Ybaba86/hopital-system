import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
} from '../controllers/adminController';

const router = Router();

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;