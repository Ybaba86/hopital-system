import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getReportsData,
  updateUser,
  createAppointmentByAdmin,
} from '../controllers/adminController';

const router = Router();

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/reports', getReportsData);

// Users
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Appointments
router.post('/appointments', createAppointmentByAdmin);

export default router;