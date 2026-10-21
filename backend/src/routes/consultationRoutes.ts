import { Router } from 'express';
import {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultation,
  deleteConsultation,
  addPrescription,
  getPrescriptionByQr,
} from '../controllers/consultationController';

const router = Router();
router.post('/', createConsultation);
router.get('/', getConsultations);
router.get('/:id', getConsultationById);
router.put('/:id', updateConsultation);
router.delete('/:id', deleteConsultation);
router.post('/:consultationId/prescription', addPrescription);
router.get('/prescription/qr/:qrCode', getPrescriptionByQr);

export default router;