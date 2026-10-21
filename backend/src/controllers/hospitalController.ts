import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createHospital = async (req: Request, res: Response) => {
  try {
    const { name, address } = req.body;
    const hospital = await prisma.hospital.create({
      data: { name, address },
    });
    res.status(201).json(hospital);
  } catch (error) {
    res.status(400).json({ error: 'Erreur création hôpital' });
  }
};

export const getHospitals = async (req: Request, res: Response) => {
  const hospitals = await prisma.hospital.findMany({
    include: { users: true, services: true },
  });
  res.json(hospitals);
};

export const getHospitalById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: { users: true, services: true },
  });
  if (!hospital) return res.status(404).json({ error: 'Hôpital non trouvé' });
  res.json(hospital);
};

export const updateHospital = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const { name, address } = req.body;
  try {
    const hospital = await prisma.hospital.update({
      where: { id },
      data: { name, address },
    });
    res.json(hospital);
  } catch {
    res.status(404).json({ error: 'Hôpital non trouvé' });
  }
};

export const deleteHospital = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  try {
    await prisma.hospital.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Hôpital non trouvé' });
  }
};