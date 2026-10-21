import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalPatients = await prisma.patient.count();
    const totalUsers = await prisma.user.count();
    const totalHospitals = await prisma.hospital.count();
    const totalAppointments = await prisma.appointment.count();

    res.json({
      totalPatients,
      totalUsers,
      totalHospitals,
      totalAppointments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Users
export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: { hospital: true, service: true },
  });
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  let { name, email, password, role, hospitalId, serviceId } = req.body;

  if (Array.isArray(hospitalId)) hospitalId = hospitalId[0];
  if (Array.isArray(serviceId)) serviceId = serviceId[0];

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: role as any,
        hospitalId: hospitalId || undefined,
        serviceId: serviceId || undefined,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erreur création utilisateur' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  let { role } = req.body;

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
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Erreur suppression' });
  }
};

// Exports
export {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
};