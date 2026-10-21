import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByDoctor,
  getAppointmentsByPatient,
  getPendingPayments,
  markAsPaidAndCreateTicket,
  getAvailableSlots,
  rescheduleAppointment,
  payOnlineAppointment
} from '../controllers/appointmentController';
import { authPatient } from '../middleware/authPatient';

const router = Router();

// Routes Patient (protégées)
router.post('/', authPatient, createAppointment);           // ← Patient peut créer un RDV
router.get('/my', authPatient, getAppointmentsByPatient);   // Mes rendez-vous
router.post('/pay-online', payOnlineAppointment);          // Paiement en ligne (Wave, OM, Carte)
router.post('/:id/reschedule', rescheduleAppointment);      // Reprogrammer un rendez-vous expiré ou manqué

// Routes générales / Médecin / Caisse
router.get('/', getAppointments);
router.get('/available-slots', getAvailableSlots);
router.get('/doctor/:doctorId', getAppointmentsByDoctor);
router.get('/patient/:patientId', getAppointmentsByPatient);
router.get('/:id', getAppointmentById);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);
router.get('/pending-payments', getPendingPayments);
router.post('/pay', markAsPaidAndCreateTicket);

export default router;