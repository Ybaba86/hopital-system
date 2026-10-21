import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { 
  payLabPrescription, 
  submitLabResult, 
  getPendingResultsForDoctor, 
  validateLabResult,
  getPaidLabPrescriptionsByPatient,
  getLabResultsByPatient,
  getAllLabResults,
  getPrescriptionByQr
} from '../controllers/labController';

const router = Router();

// Configuration multer pour l'upload des PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/lab-results'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lab-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 1. Caisse
router.post('/pay-prescription', payLabPrescription);

// 2. Labo
router.post('/submit-result', upload.single('resultFile'), submitLabResult);
router.get('/prescriptions/patient/:patientId', getPaidLabPrescriptionsByPatient);
router.get('/all-results', getAllLabResults);
router.get('/prescription/qr/:qrCode', getPrescriptionByQr);

// 3. Médecin
router.get('/pending/:doctorId', getPendingResultsForDoctor);
router.post('/validate/:resultId', validateLabResult);
router.get('/results/patient/:patientId', getLabResultsByPatient);

export default router;
