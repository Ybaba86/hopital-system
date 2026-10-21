import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Générer un QR code unique (simple UUID pour l'instant)
function generateQrCode(): string {
  return crypto.randomUUID();
}

export const createConsultation = async (req: Request, res: Response) => {
  try {
    const { symptoms, diagnosis, treatment, sickLeave, referralNote, patientId, doctorId } = req.body;
    const consultation = await prisma.consultation.create({
      data: {
        symptoms,
        diagnosis,
        treatment,
        sickLeave: sickLeave || false,
        referralNote,
        patientId,
        doctorId,
      },
      include: { patient: true, doctor: true },
    });

    // Marquer automatiquement le ou les tickets de file d'attente du patient comme terminés
    const activeTickets = await prisma.queueTicket.findMany({
      where: {
        patientId,
        queueType: 'consultation',
        status: { in: ['waiting', 'in_progress'] }
      }
    });

    const appointmentIds = activeTickets.map(t => t.appointmentId).filter(Boolean) as string[];
    if (appointmentIds.length > 0) {
      await prisma.appointment.updateMany({
        where: { id: { in: appointmentIds } },
        data: { status: 'completed' }
      });
    }

    // Marquer également les rendez-vous en cours du patient avec ce médecin comme 'completed'
    await prisma.appointment.updateMany({
      where: {
        patientId,
        doctorId,
        status: { notIn: ['cancelled', 'completed'] }
      },
      data: { status: 'completed' }
    });

    await prisma.queueTicket.updateMany({
      where: {
        patientId,
        queueType: 'consultation',
        status: { in: ['waiting', 'in_progress'] }
      },
      data: { status: 'completed' }
    });

    res.status(201).json(consultation);
  } catch (error) {
    res.status(400).json({ error: 'Erreur création consultation' });
  }
};

export const getConsultations = async (req: Request, res: Response) => {
  const { patientId, hospitalId } = req.query;
  const whereClause: any = {};
  if (patientId) whereClause.patientId = String(patientId);
  if (hospitalId) whereClause.patient = { hospitalId: String(hospitalId) };
  
  const consultations = await prisma.consultation.findMany({
    where: whereClause,
    include: { patient: true, doctor: { include: { hospital: true } }, prescriptions: true },
    orderBy: { date: 'desc' },
  });
  res.json(consultations);
};

export const getConsultationById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: { patient: true, doctor: true, prescriptions: true },
  });
  if (!consultation) return res.status(404).json({ error: 'Consultation non trouvée' });
  res.json(consultation);
};

export const updateConsultation = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const { symptoms, diagnosis, treatment, sickLeave, referralNote } = req.body;
  try {
    const consultation = await prisma.consultation.update({
      where: { id },
      data: { symptoms, diagnosis, treatment, sickLeave, referralNote },
      include: { patient: true, doctor: true },
    });

    // Marquer automatiquement le ou les tickets de file d'attente du patient comme terminés
    const activeTickets = await prisma.queueTicket.findMany({
      where: {
        patientId: consultation.patientId,
        queueType: 'consultation',
        status: { in: ['waiting', 'in_progress'] }
      }
    });

    const appointmentIds = activeTickets.map(t => t.appointmentId).filter(Boolean) as string[];
    if (appointmentIds.length > 0) {
      await prisma.appointment.updateMany({
        where: { id: { in: appointmentIds } },
        data: { status: 'completed' }
      });
    }

    await prisma.appointment.updateMany({
      where: {
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        status: { notIn: ['cancelled', 'completed'] }
      },
      data: { status: 'completed' }
    });

    await prisma.queueTicket.updateMany({
      where: {
        patientId: consultation.patientId,
        queueType: 'consultation',
        status: { in: ['waiting', 'in_progress'] }
      },
      data: { status: 'completed' }
    });

    res.json(consultation);
  } catch {
    res.status(404).json({ error: 'Consultation non trouvée' });
  }
};

export const deleteConsultation = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  try {
    await prisma.consultation.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Consultation non trouvée' });
  }
};

// Ajouter une prescription à une consultation
export const addPrescription = async (req: Request, res: Response) => {
  const consultationId = req.params.consultationId as string;
  if (!consultationId) return res.status(400).json({ error: 'consultationId manquant' });
  const { type, content } = req.body; // type = "medication" ou "lab"
  try {
    const qrCode = generateQrCode();
    const prescription = await prisma.prescription.create({
      data: {
        type,
        content,
        qrCode,
        consultationId,
      },
    });
    res.status(201).json(prescription);
  } catch (error) {
    res.status(400).json({ error: 'Erreur création prescription' });
  }
};

// Récupérer une prescription par son QR code (pour le patient/pharmacie)
export const getPrescriptionByQr = async (req: Request, res: Response) => {
  const qrCode = req.params.qrCode as string;
  if (!qrCode) return res.status(400).json({ error: 'QR code manquant' });
  const prescription = await prisma.prescription.findUnique({
    where: { qrCode },
    include: { consultation: { include: { patient: true, doctor: true } } },
  });
  if (!prescription) return res.status(404).json({ error: 'Prescription non trouvée' });
  res.json(prescription);
};