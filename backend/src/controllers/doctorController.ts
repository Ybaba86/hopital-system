import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const { hospitalId } = req.query;
    
    const whereClause: any = { role: 'MEDECIN' };
    if (hospitalId) {
      whereClause.hospitalId = String(hospitalId);
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true, serviceId: true, service: { select: { name: true } } }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des médecins' });
  }
};

export const getDoctorAvailabilities = async (req: Request, res: Response) => {
  const doctorId = req.params.doctorId as string;
  try {
    const availabilities = await prisma.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' }
    });
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des disponibilités' });
  }
};

export const setDoctorAvailabilities = async (req: Request, res: Response) => {
  const doctorId = req.params.doctorId as string;
  const { availabilities } = req.body; // Array of { dayOfWeek, startTime, endTime }
  try {
    // Supprimer les existants pour ce medecin
    await prisma.doctorAvailability.deleteMany({
      where: { doctorId }
    });

    // Créer les nouveaux
    if (availabilities && availabilities.length > 0) {
      const data = availabilities.map((a: any) => ({
        doctorId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime
      }));
      await prisma.doctorAvailability.createMany({
        data
      });
    }

    res.json({ message: 'Disponibilités mises à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des disponibilités' });
  }
};