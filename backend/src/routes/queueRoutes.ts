import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ====================== VUE GLOBALE (Caisse / Labo / etc) ======================
router.get('/waiting', async (req, res) => {
  const hospitalId = req.query.hospitalId as string;
  const queueType = (req.query.queueType as string) || 'consultation';
  try {
    const whereClause: any = { status: 'waiting', queueType };
    if (hospitalId) whereClause.patient = { hospitalId };

    const waiting = await prisma.queueTicket.findMany({
      where: whereClause,
      include: {
        patient: true,
        appointment: { include: { doctor: true } }
      },
      orderBy: { ticketNumber: 'asc' },
    });
    res.json(waiting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur récupération file' });
  }
});

// ====================== PAR MÉDECIN ======================
router.get('/doctor/:doctorId', async (req, res) => {
  const { doctorId } = req.params;
  try {
    const tickets = await prisma.queueTicket.findMany({
      where: {
        status: 'waiting',
        queueType: 'consultation',
        appointment: { doctorId }
      },
      include: {
        patient: true,
        appointment: true
      },
      orderBy: { ticketNumber: 'asc' },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération file du médecin' });
  }
});

router.get('/doctor/:doctorId/count', async (req, res) => {
  const { doctorId } = req.params;
  try {
    const count = await prisma.queueTicket.count({
      where: {
        status: 'waiting',
        queueType: 'consultation',
        appointment: { doctorId }
      },
    });
    res.json({ waitingCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération compteur médecin' });
  }
});

router.get('/count', async (req, res) => {
  const hospitalId = req.query.hospitalId as string;
  const queueType = (req.query.queueType as string) || 'consultation';
  try {
    const whereClause: any = { status: 'waiting', queueType };
    if (hospitalId) whereClause.patient = { hospitalId };
    const count = await prisma.queueTicket.count({ where: whereClause });
    res.json({ waitingCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération nombre total' });
  }
});

// ====================== POSITION PATIENT ======================
router.get('/position/:patientId', async (req, res) => {
  const { patientId } = req.params;

  try {
    const ticket = await prisma.queueTicket.findFirst({
      where: { 
        patientId, 
        status: { in: ['waiting', 'in_progress'] },
        queueType: 'consultation'
      },
      orderBy: { ticketNumber: 'asc' },
      include: {
        appointment: { include: { doctor: true } }
      }
    });

    if (!ticket) {
      return res.status(404).json({ 
        message: 'Aucun ticket en attente pour ce patient',
        position: 0,
        status: 'no_ticket'
      });
    }

    const position = await prisma.queueTicket.count({
      where: {
        status: 'waiting',
        queueType: ticket.queueType,
        ticketNumber: { lt: ticket.ticketNumber }
      }
    });

    res.json({
      position: position + 1,
      status: ticket.status,
      ticketNumber: ticket.ticketNumber,
      queueType: ticket.queueType,
      doctorName: ticket.appointment?.doctor?.name || 'votre médecin'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur récupération position patient' });
  }
});

// ====================== ACTIONS ======================
router.post('/ticket', async (req, res) => {
  const { patientId, appointmentId, queueType = 'consultation' } = req.body;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.queueTicket.count({
      where: { createdAt: { gte: today }, queueType },
    });

    const ticket = await prisma.queueTicket.create({
      data: {
        ticketNumber: count + 1,
        patientId,
        appointmentId,
        status: 'waiting',
        queueType
      },
      include: { 
        patient: true, 
        appointment: { include: { doctor: true } } 
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur création ticket' });
  }
});

router.put('/ticket/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updated = await prisma.queueTicket.update({
      where: { id },
      data: { status },
      include: { patient: true, appointment: { include: { doctor: true } } },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur mise à jour ticket' });
  }
});

router.post('/call-next', async (req, res) => {
  const { doctorId } = req.body;
  try {
    const nextTicket = await prisma.queueTicket.findFirst({
      where: {
        status: 'waiting',
        queueType: 'consultation',
        appointment: { doctorId }
      },
      include: { patient: true, appointment: true },
      orderBy: { ticketNumber: 'asc' },
    });

    if (!nextTicket) {
      return res.status(404).json({ message: 'Aucun patient en attente pour ce médecin' });
    }

    const called = await prisma.queueTicket.update({
      where: { id: nextTicket.id },
      data: { status: 'in_progress' },
      include: { patient: true },
    });

    res.json({
      message: `Patient ${called.patient.firstName} ${called.patient.lastName} appelé !`,
      ticket: called
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'appel du patient' });
  }
});

// Appel pour le laboratoire (n'importe quel patient en file d'attente labo pour cet hôpital)
router.post('/call-next-lab', async (req, res) => {
  const hospitalId = req.body.hospitalId;
  try {
    const whereClause: any = { status: 'waiting', queueType: 'laboratory' };
    if (hospitalId) whereClause.patient = { hospitalId };

    const nextTicket = await prisma.queueTicket.findFirst({
      where: whereClause,
      include: { patient: true },
      orderBy: { ticketNumber: 'asc' },
    });

    if (!nextTicket) {
      return res.status(404).json({ message: 'Aucun patient en attente pour le laboratoire' });
    }

    const called = await prisma.queueTicket.update({
      where: { id: nextTicket.id },
      data: { status: 'in_progress' },
      include: { patient: true },
    });

    res.json({
      message: `Patient ${called.patient.firstName} ${called.patient.lastName} appelé pour prélèvement !`,
      ticket: called
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'appel du patient au labo' });
  }
});

export default router;