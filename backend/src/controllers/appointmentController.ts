import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ====================== UTILITAIRE ======================
async function generateReceiptNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const lastPayment = await prisma.payment.findFirst({
    where: { receiptNumber: { startsWith: `REC-${dateStr}` } },
    orderBy: { receiptNumber: 'desc' },
  });
  let nextNum = 1;
  if (lastPayment) {
    const match = lastPayment.receiptNumber.match(/\d+$/);
    if (match) nextNum = parseInt(match[0]) + 1;
  }
  return `REC-${dateStr}-${String(nextNum).padStart(4, '0')}`;
}

// Vérification et mise à jour automatique des rendez-vous expirés/non présentés
const checkAndMarkMissedAppointments = async (appointments: any[]) => {
  const now = new Date();
  const toUpdateIds: string[] = [];
  
  const processed = appointments.map(apt => {
    // Ne jamais marquer comme "missed" un rendez-vous déjà consulté ou annulé
    if (apt.status === 'completed' || apt.status === 'cancelled') {
      return apt;
    }
    if ((apt.status === 'scheduled' || apt.status === 'rescheduled') && new Date(apt.date) < now) {
      toUpdateIds.push(apt.id);
      return { ...apt, status: 'missed' };
    }
    return apt;
  });

  if (toUpdateIds.length > 0) {
    prisma.appointment.updateMany({
      where: { id: { in: toUpdateIds } },
      data: { status: 'missed' },
    }).catch(err => console.error("Erreur mise à jour statut 'missed':", err));
  }

  return processed;
};

// ====================== CREATE APPOINTMENT ======================
const createAppointment = async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).patientId || req.body.patientId;
    const { 
      date, 
      doctorId, 
      isEmergency = false, 
      isVip = false, 
      locationType = 'hospital', 
      homeAddress = '',
      paymentMethod = 'on_site'
    } = req.body;

    if (!patientId) {
      return res.status(401).json({ error: 'Patient non authentifié' });
    }
    if (!date || !doctorId) {
      return res.status(400).json({ error: 'Date et médecin sont obligatoires' });
    }

    const appointmentDate = new Date(date);

    // Vérification de la disponibilité du médecin
    const dayOfWeek = appointmentDate.getDay();
    const requestedTime = `${String(appointmentDate.getHours()).padStart(2, '0')}:${String(appointmentDate.getMinutes()).padStart(2, '0')}`;
    
    const availability = await prisma.doctorAvailability.findUnique({
      where: {
        doctorId_dayOfWeek: { doctorId, dayOfWeek }
      }
    });

    if (!availability || requestedTime < availability.startTime || requestedTime >= availability.endTime) {
      return res.status(400).json({ error: "Le médecin n'est pas disponible à cet horaire." });
    }

    // Contrainte 30 minutes entre RDV (même médecin)
    const thirtyMinBefore = new Date(appointmentDate.getTime() - 29 * 60 * 1000);
    const thirtyMinAfter = new Date(appointmentDate.getTime() + 29 * 60 * 1000);
    const overlapping = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: { gte: thirtyMinBefore, lte: thirtyMinAfter },
        status: { notIn: ['cancelled', 'missed'] }
      }
    });
    if (overlapping) {
      return res.status(400).json({
        error: "Un rendez-vous est déjà programmé à cette heure."
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: appointmentDate,
        patientId,
        doctorId,
        status: 'scheduled',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'on_site',
        isEmergency: Boolean(isEmergency),
        isVip: Boolean(isVip),
        locationType: locationType || 'hospital',
        homeAddress: homeAddress || null,
      },
      include: { patient: true, doctor: true },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erreur création rendez-vous' });
  }
};

// ====================== REPROGRAMMER UN RENDEZ-VOUS ======================
const rescheduleAppointment = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { date, time } = req.body;

  if (!id) return res.status(400).json({ error: 'ID manquant' });
  if (!date) return res.status(400).json({ error: 'Nouvelle date requise' });

  try {
    const existing = await prisma.appointment.findUnique({ 
      where: { id },
      include: { patient: true, doctor: true }
    });
    if (!existing) return res.status(404).json({ error: 'Rendez-vous introuvable' });

    // Règle 1 : Si la personne a été consultée par le médecin, impossible de reprogrammer
    if (existing.status === 'completed') {
      return res.status(400).json({ 
        error: "Ce rendez-vous a déjà été honoré et la consultation a été réalisée par le médecin. Il ne peut plus être reprogrammé." 
      });
    }

    // Règle 2 : Règle des 7 jours (Validité de consultation)
    // Si la consultation n'est pas arrivée à 7 jours depuis la date prévue initiale, le patient peut reprogrammer.
    // Sinon (> 7 jours), un nouveau paiement de consultation est obligatoire !
    const now = new Date();
    const originalDate = new Date(existing.date);
    const diffTime = now.getTime() - originalDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

    if (diffDays > 7) {
      return res.status(400).json({ 
        error: "Le délai de validité de 7 jours est dépassé. Vous ne pouvez plus reprogrammer ce rendez-vous sans effectuer un nouveau paiement." 
      });
    }

    const newDate = time ? new Date(`${date}T${time}:00`) : new Date(date);

    // Vérifier que la nouvelle date n'est pas dans le passé
    if (newDate < now) {
      return res.status(400).json({ 
        error: "Impossible de reprogrammer à une heure déjà passée. Veuillez choisir un créneau à venir." 
      });
    }

    // Vérifier si le créneau est déjà réservé par un autre patient
    const thirtyMinBefore = new Date(newDate.getTime() - 29 * 60 * 1000);
    const thirtyMinAfter = new Date(newDate.getTime() + 29 * 60 * 1000);
    const overlapping = await prisma.appointment.findFirst({
      where: {
        doctorId: existing.doctorId,
        id: { not: id },
        date: { gte: thirtyMinBefore, lte: thirtyMinAfter },
        status: { notIn: ['cancelled', 'missed'] }
      }
    });
    if (overlapping) {
      return res.status(400).json({
        error: "Ce créneau horaire est déjà réservé par un autre patient. Veuillez en sélectionner un autre."
      });
    }

    // Mise à jour de l'appointment avec le statut 'rescheduled'
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        date: newDate,
        status: 'rescheduled',
      },
      include: { patient: true, doctor: true }
    });

    // Mettre à jour ou créer le ticket de file d'attente (QueueTicket) pour le médecin
    const existingTicket = await prisma.queueTicket.findFirst({
      where: { appointmentId: id }
    });

    if (existingTicket) {
      await prisma.queueTicket.update({
        where: { id: existingTicket.id },
        data: {
          status: 'waiting',
          updatedAt: new Date()
        }
      });
    } else {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const count = await prisma.queueTicket.count({ where: { createdAt: { gte: startOfToday } } });
      await prisma.queueTicket.create({
        data: {
          ticketNumber: count + 1,
          patientId: existing.patientId,
          appointmentId: id,
          status: 'waiting',
          queueType: 'consultation',
          isEmergency: existing.isEmergency || false
        }
      });
    }

    res.json({ message: 'Rendez-vous reprogrammé avec succès', appointment: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la reprogrammation' });
  }
};

// ====================== PAIEMENT EN LIGNE ======================
const payOnlineAppointment = async (req: Request, res: Response) => {
  const { appointmentId, paymentType = 'wave', amount = 5000 } = req.body;
  if (!appointmentId) return res.status(400).json({ error: 'appointmentId manquant' });

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    });

    if (!appointment) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Ce rendez-vous a déjà été réglé' });
    }

    const receiptNumber = await generateReceiptNumber();

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: parseFloat(amount) || 5000,
          paymentType: paymentType || 'online',
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          description: `Paiement en ligne consultation (${paymentType.toUpperCase()})`,
          receiptNumber,
          status: 'completed',
        },
      });

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { 
          paymentStatus: 'paid', 
          paymentMethod: 'online',
          status: appointment.status === 'missed' ? 'scheduled' : appointment.status 
        },
      });

      let ticket = await tx.queueTicket.findFirst({ where: { appointmentId } });
      if (!ticket) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await tx.queueTicket.count({ where: { createdAt: { gte: today } } });
        ticket = await tx.queueTicket.create({
          data: {
            ticketNumber: count + 1,
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            status: 'waiting',
            isEmergency: appointment.isEmergency || false,
          },
        });
      }

      return { payment, ticket, appointment: updatedAppointment };
    });

    res.json({
      message: 'Paiement en ligne validé avec succès !',
      payment: result.payment,
      ticket: result.ticket,
      appointment: result.appointment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du paiement en ligne' });
  }
};

// ====================== AUTRES FONCTIONS ======================
const getAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { patient: true, doctor: true },
      orderBy: { date: 'asc' },
    });
    const checked = await checkAndMarkMissedAppointments(appointments);
    res.json(checked);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération rendez-vous' });
  }
};

const getAppointmentById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });
    if (!appointment) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    
    // Vérifier si expiré
    if (appointment.status === 'scheduled' && new Date(appointment.date) < new Date()) {
      appointment.status = 'missed';
      await prisma.appointment.update({ where: { id }, data: { status: 'missed' } }).catch(console.error);
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateAppointment = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const { date, status, patientId, doctorId, paymentStatus, isVip, locationType, homeAddress, paymentMethod } = req.body;
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        status,
        paymentStatus,
        paymentMethod,
        isVip,
        locationType,
        homeAddress,
        patientId,
        doctorId,
      },
    });
    res.json(appointment);
  } catch {
    res.status(404).json({ error: 'Rendez-vous non trouvé' });
  }
};

const deleteAppointment = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  try {
    await prisma.appointment.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Rendez-vous non trouvé' });
  }
};

const getAppointmentsByDoctor = async (req: Request, res: Response) => {
  const doctorId = req.params.doctorId as string;
  if (!doctorId) return res.status(400).json({ error: 'doctorId manquant' });
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: { patient: true },
      orderBy: { date: 'asc' },
    });
    const checked = await checkAndMarkMissedAppointments(appointments);
    const now = new Date();
    const enriched = checked.map(apt => {
      const aptDate = new Date(apt.date);
      const diffTime = now.getTime() - aptDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      const isPast7Days = diffDays > 7;
      const daysRemaining = Math.max(0, 7 - diffDays);
      const isRescheduled = apt.status === 'rescheduled';
      return {
        ...apt,
        diffDays,
        isPast7Days,
        daysRemaining,
        isRescheduled,
        canReschedule: !isPast7Days && apt.status !== 'completed' && apt.status !== 'cancelled'
      };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getAppointmentsByPatient = async (req: Request, res: Response) => {
  const patientId = req.params.patientId || (req as any).patientId;
  if (!patientId) return res.status(400).json({ error: 'patientId manquant' });
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: true },
      orderBy: { date: 'asc' },
    });
    const checked = await checkAndMarkMissedAppointments(appointments);
    const now = new Date();
    const enriched = checked.map(apt => {
      const aptDate = new Date(apt.date);
      const diffTime = now.getTime() - aptDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      const isPast7Days = diffDays > 7;
      const daysRemaining = Math.max(0, 7 - diffDays);
      const isRescheduled = apt.status === 'rescheduled';
      return {
        ...apt,
        diffDays,
        isPast7Days,
        daysRemaining,
        isRescheduled,
        canReschedule: !isPast7Days && apt.status !== 'completed' && apt.status !== 'cancelled'
      };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getPendingPayments = async (req: Request, res: Response) => {
  const hospitalId = req.query.hospitalId as string;
  try {
    const whereClause: any = { paymentStatus: 'pending' };
    if (hospitalId) {
      whereClause.patient = { hospitalId };
    }
    const pending = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        doctor: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Enrichir avec isFreeRenewal
    const enrichedPending = await Promise.all(
      pending.map(async (apt) => {
        const lastPaid = await prisma.appointment.findFirst({
          where: {
            patientId: apt.patientId,
            paymentStatus: 'paid',
            date: { gte: fiveDaysAgo },
          },
          orderBy: { date: 'desc' },
        });

        return {
          ...apt,
          isFreeRenewal: !!lastPaid,
        };
      })
    );

    res.json(enrichedPending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur de récupération' });
  }
};

const markAsPaidAndCreateTicket = async (req: Request, res: Response) => {
  const { appointmentId, patientId, amount, paymentType } = req.body;
  if (!appointmentId || !patientId || amount === undefined || amount === null || !paymentType) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    if (appointment.paymentStatus !== 'pending') {
      return res.status(400).json({ error: 'Ce rendez-vous a déjà été payé' });
    }
    const receiptNumber = await generateReceiptNumber();
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: parseFloat(amount) || 0,
          paymentType,
          patientId,
          appointmentId,
          description: parseFloat(amount) === 0 ? 'Renouvellement gratuit' : 'Paiement consultation',
          receiptNumber,
          status: 'completed',
        },
      });
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { paymentStatus: 'paid', status: 'scheduled' },
      });
      let ticket = await tx.queueTicket.findFirst({ where: { appointmentId } });
      if (!ticket) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const count = await tx.queueTicket.count({ where: { createdAt: { gte: today } } });
        ticket = await tx.queueTicket.create({
          data: {
            ticketNumber: count + 1,
            patientId,
            appointmentId,
            status: 'waiting',
            isEmergency: appointment.isEmergency || false,
          },
        });
      }
      return { payment, ticket };
    });
    res.status(201).json({
      message: 'Paiement et ticket générés avec succès',
      payment: result.payment,
      ticket: result.ticket
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du paiement' });
  }
};

const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId et date sont requis' });
    }

    const requestedDate = new Date(date as string);
    const dayOfWeek = requestedDate.getDay();

    const availability = await prisma.doctorAvailability.findUnique({
      where: {
        doctorId_dayOfWeek: { doctorId: doctorId as string, dayOfWeek }
      }
    });

    if (!availability) {
      return res.json([]); // Pas de disponibilité ce jour
    }

    // Générer tous les créneaux de 30 mins entre startTime et endTime
    const slots = [];
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    
    let currentMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    while (currentMins + 30 <= endMins) { // un rdv dure 30 minutes
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      currentMins += 30;
    }

    // Récupérer les rendez-vous existants pour ce jour
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId as string,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'cancelled' }
      }
    });

    const takenSlots = existingAppointments.map(a => {
      const h = String(a.date.getHours()).padStart(2, '0');
      const m = String(a.date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    });

    // Calcul de la date du jour et de l'heure courante pour griser les périodes passées
    const now = new Date();
    const dateStr = String(date).split('T')[0];
    const [reqY, reqM, reqD] = dateStr.split('-').map(Number);
    const isToday = (
      reqY === now.getFullYear() &&
      reqM === (now.getMonth() + 1) &&
      reqD === now.getDate()
    );
    const isPastDate = new Date(reqY, reqM - 1, reqD, 23, 59, 59) < now;
    const currentMinsNow = now.getHours() * 60 + now.getMinutes();

    const slotItems = slots.map(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotMins = h * 60 + m;
      const isReserved = takenSlots.includes(slot);
      const isPast = isPastDate || (isToday && slotMins <= currentMinsNow);
      return {
        time: slot,
        isReserved,
        isPast,
        isAvailable: !isReserved && !isPast
      };
    });

    res.json(slotItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la génération des créneaux' });
  }
};

// ====================== EXPORTS ======================
export {
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
};