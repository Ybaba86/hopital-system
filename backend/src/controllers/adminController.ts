import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ====================== DASHBOARD ======================
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalPatients = await prisma.patient.count();
    const totalUsers = await prisma.user.count();
    const totalDoctors = await prisma.user.count({ where: { role: 'MEDECIN' } });
    const totalHospitals = await prisma.hospital.count();
    const totalAppointments = await prisma.appointment.count();

    const payments = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'completed' }
    });
    const totalRevenue = payments._sum.amount || 0;

    // Agenda d'aujourd'hui
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayAppointmentsData = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: 'cancelled' }
      },
      include: {
        patient: { select: { firstName: true, lastName: true } }
      },
      orderBy: { date: 'asc' }
    });

    const todayAppointments = todayAppointmentsData.map(app => ({
      id: app.id,
      time: `${String(app.date.getHours()).padStart(2, '0')}:${String(app.date.getMinutes()).padStart(2, '0')}`,
      patient: `${app.patient.firstName} ${app.patient.lastName}`,
      type: app.isEmergency ? "Urgence" : "Consultation",
      color: app.isEmergency ? "bg-rose-500" : "bg-blue-500"
    }));

    // Activités récentes (mélange des derniers patients et derniers RDV)
    const recentPatients = await prisma.patient.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, createdAt: true }
    });

    const recentAppointments = await prisma.appointment.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { patient: { select: { firstName: true, lastName: true } } }
    });

    const activities: any[] = [];
    
    recentPatients.forEach(p => {
      activities.push({
        type: 'patient',
        icon: 'Users',
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        title: "Nouveau patient",
        desc: `${p.firstName} ${p.lastName}`,
        createdAt: p.createdAt
      });
    });

    recentAppointments.forEach(a => {
      activities.push({
        type: 'appointment',
        icon: 'Calendar',
        color: a.isEmergency ? "text-rose-500" : "text-emerald-500",
        bg: a.isEmergency ? "bg-rose-500/10" : "bg-emerald-500/10",
        title: a.isEmergency ? "RDV Urgent" : "RDV programmé",
        desc: `${a.patient.firstName} ${a.patient.lastName}`,
        createdAt: a.createdAt
      });
    });

    // Trier par date décroissante et prendre les 5 premiers
    activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const recentActivities = activities.slice(0, 5).map(act => {
      // Calcul du temps écoulé
      const diffMs = new Date().getTime() - act.createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let timeStr = "À l'instant";
      if (diffDays > 0) timeStr = `Il y a ${diffDays}j`;
      else if (diffHours > 0) timeStr = `Il y a ${diffHours}h`;
      else if (diffMins > 0) timeStr = `Il y a ${diffMins} min`;

      return {
        ...act,
        time: timeStr
      };
    });

    res.json({
      totalPatients,
      totalUsers,
      totalDoctors,
      totalHospitals,
      totalAppointments,
      totalRevenue,
      todayAppointments,
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getReportsData = async (req: Request, res: Response) => {
  try {
    // 1. Répartition par service (PieChart)
    // Récupérer le nombre d'utilisateurs (ou médecins) par service
    const services = await prisma.service.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    const serviceDistribution = services.map(s => ({
      name: s.name,
      value: s._count.users
    }));

    // 2. Activité mensuelle (BarChart) - Rendez-vous des 6 derniers mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        isEmergency: true
      }
    });

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const monthlyActivity: {
      name: string;
      monthNum: number;
      yearNum: number;
      consultations: number;
      urgences: number;
    }[] = [];
    
    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      let d = new Date();
      d.setMonth(currentMonth - i);
      monthlyActivity.push({
        name: months[d.getMonth()],
        monthNum: d.getMonth(),
        yearNum: d.getFullYear(),
        consultations: 0,
        urgences: 0
      });
    }

    // Remplir avec les vraies données
    appointments.forEach(app => {
      const m = app.createdAt.getMonth();
      const y = app.createdAt.getFullYear();
      const monthData = monthlyActivity.find(ma => ma.monthNum === m && ma.yearNum === y);
      if (monthData) {
        if (app.isEmergency) {
          monthData.urgences++;
        } else {
          monthData.consultations++;
        }
      }
    });

    res.json({
      serviceDistribution,
      monthlyActivity
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des rapports' });
  }
};

// ====================== USERS ======================
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { hospital: true, service: true, pharmacy: true, laboratory: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    const hospitalId = Array.isArray(req.body.hospitalId) ? req.body.hospitalId[0] : req.body.hospitalId;
    const serviceId = Array.isArray(req.body.serviceId) ? req.body.serviceId[0] : req.body.serviceId;
    const pharmacyId = Array.isArray(req.body.pharmacyId) ? req.body.pharmacyId[0] : req.body.pharmacyId;
    const laboratoryId = Array.isArray(req.body.laboratoryId) ? req.body.laboratoryId[0] : req.body.laboratoryId;

    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
        hospitalId: (role !== 'PHARMACIEN' && role !== 'LABORANTIN') ? (hospitalId || undefined) : undefined,
        serviceId: serviceId || undefined,
        pharmacyId: role === 'PHARMACIEN' ? (pharmacyId || undefined) : undefined,
        laboratoryId: role === 'LABORANTIN' ? (laboratoryId || undefined) : undefined,
      },
    });
    res.status(201).json(user);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(400).json({ error: 'Erreur création utilisateur' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  // TS2322 : Cast explicite en string pour satisfaire Prisma
  const id = req.params.id as string; 
  const { role } = req.body;

  if (!role || typeof role !== 'string') {
    return res.status(400).json({ error: 'Rôle invalide' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role: role as any },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Erreur mise à jour rôle' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  // TS2322 : Cast explicite en string pour satisfaire Prisma
  const id = req.params.id as string; 
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Erreur suppression' });
  }
};

// Le bloc "export { ... }" final a été retiré, car les fonctions sont déjà exportées individuellement en haut (export const).

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  
  const { name, email, password, role, hospitalId, serviceId, pharmacyId, laboratoryId } = req.body;
  
  // Assurer que ce sont de simples chaînes de caractères (au cas où on recevrait un tableau)
  const safeHospitalId = Array.isArray(hospitalId) ? hospitalId[0] : hospitalId;
  const safeServiceId = Array.isArray(serviceId) ? serviceId[0] : serviceId;
  const safePharmacyId = Array.isArray(pharmacyId) ? pharmacyId[0] : pharmacyId;
  const safeLaboratoryId = Array.isArray(laboratoryId) ? laboratoryId[0] : laboratoryId;

  try {
    const dataToUpdate: any = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      // Handle the case where they pass "" to unassign
      hospitalId: (role !== 'PHARMACIEN' && role !== 'LABORANTIN') ? (safeHospitalId || null) : null,
      serviceId: safeServiceId || null,
      pharmacyId: role === 'PHARMACIEN' ? (safePharmacyId || null) : null,
      laboratoryId: role === 'LABORANTIN' ? (safeLaboratoryId || null) : null,
    };
    
    // Only update password if provided
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
    res.json(user);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.status(400).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
};

export const createAppointmentByAdmin = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, date, isEmergency = false } = req.body;
    
    if (!patientId || !doctorId || !date) {
      return res.status(400).json({ error: 'Patient, Médecin et Date sont requis' });
    }

    const appointmentDate = new Date(date);

    // Vérification disponibilité du médecin
    const dayOfWeek = appointmentDate.getDay();
    const requestedTime = `${String(appointmentDate.getHours()).padStart(2, '0')}:${String(appointmentDate.getMinutes()).padStart(2, '0')}`;
    
    const availability = await prisma.doctorAvailability.findUnique({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } }
    });

    if (!availability || requestedTime < availability.startTime || requestedTime >= availability.endTime) {
      return res.status(400).json({ error: "Le médecin n'est pas disponible à cet horaire." });
    }

    // Contrainte 30 min
    const thirtyMinBefore = new Date(appointmentDate.getTime() - 29 * 60 * 1000);
    const thirtyMinAfter = new Date(appointmentDate.getTime() + 29 * 60 * 1000);
    const overlapping = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: { gte: thirtyMinBefore, lte: thirtyMinAfter },
        status: { not: 'cancelled' }
      }
    });

    if (overlapping) {
      return res.status(400).json({ error: "Un rendez-vous est déjà programmé à cette heure." });
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: appointmentDate,
        patientId,
        doctorId,
        status: 'scheduled',
        paymentStatus: 'pending',
        isEmergency: Boolean(isEmergency),
      },
      include: { patient: true, doctor: true },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur création rendez-vous par admin' });
  }
};