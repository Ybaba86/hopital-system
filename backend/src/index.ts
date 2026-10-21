import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';

// Import des routes
import authRoutes from './routes/authRoutes';
import hospitalRoutes from './routes/hospitalRoutes';
import serviceRoutes from './routes/serviceRoutes';
import userRoutes from './routes/userRoutes';
import patientRoutes from './routes/patientRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import consultationRoutes from './routes/consultationRoutes';
import medicineRoutes from './routes/medicineRoutes';
import saleRoutes from './routes/saleRoutes';
import paymentRoutes from './routes/paymentRoutes';
import queueRoutes from './routes/queueRoutes';
import adminRoutes from './routes/adminRoutes';
import labRoutes from './routes/labRoutes';
import pharmacyRoutes from './routes/pharmacyRoutes';
import laboratoryRoutes from './routes/laboratoryRoutes';
import doctorRoutes from './routes/doctorRoutes';

// Controllers spéciaux
import { patientLogin } from './controllers/patientAuthController';
import { authPatient } from './middleware/authPatient';
import { getPatientProfile, getPatientAppointments, getPatientPrescriptions, getPatientLabResults } from './controllers/patientDataController';
import { getPendingPayments, markAsPaidAndCreateTicket } from './controllers/appointmentController';

const app = express();

app.use(cors());
app.use(express.json());

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => res.send('API Hospitalière fonctionne ✅'));

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);

// === ROUTES CAISSE (à mettre AVANT le router appointments) ===
app.get('/api/appointments/pending-payments', getPendingPayments);
app.post('/api/appointments/pay', markAsPaidAndCreateTicket);

// Routes restantes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes); //Routes admin
app.use('/api/lab', labRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/laboratories', laboratoryRoutes);

// Routes Patient
app.post('/api/patient/login', patientLogin);
app.get('/api/patient/profile', authPatient, getPatientProfile);
app.get('/api/patient/appointments', authPatient, getPatientAppointments);
app.get('/api/patient/prescriptions', authPatient, getPatientPrescriptions);
app.get('/api/patient/lab-results', authPatient, getPatientLabResults);
app.use('/api/doctors', doctorRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});