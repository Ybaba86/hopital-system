import { Router } from 'express';
import {
  getDoctors,
  getDoctorAvailabilities,
  setDoctorAvailabilities
} from '../controllers/doctorController';

const router = Router();

router.get('/', getDoctors);
router.get('/:doctorId/availabilities', getDoctorAvailabilities);
router.post('/:doctorId/availabilities', setDoctorAvailabilities);

export default router;
