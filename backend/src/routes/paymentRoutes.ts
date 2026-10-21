import { Router } from 'express';
import {
  createPayment,
  getPayments,
  getPaymentById,
  getDailyReport,
  getMonthlyReport,
  getReportByInterval,
} from '../controllers/paymentController';

const router = Router();
router.post('/', createPayment);
router.get('/', getPayments);
router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/report', getReportByInterval);
router.get('/:id', getPaymentById);

export default router;