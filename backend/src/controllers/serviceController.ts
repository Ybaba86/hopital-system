import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createService = async (req: Request, res: Response) => {
  try {
    const { name, hospitalId } = req.body;
    const service = await prisma.service.create({
      data: { name, hospitalId },
    });
    res.status(201).json(service);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ce nom de service existe déjà' });
    }
    res.status(400).json({ error: 'Erreur création service' });
  }
};

export const getServices = async (req: Request, res: Response) => {
  const services = await prisma.service.findMany({
    include: { hospital: true, users: true },
  });
  res.json(services);
};

export const getServiceById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const service = await prisma.service.findUnique({
    where: { id },
    include: { hospital: true, users: true },
  });
  if (!service) return res.status(404).json({ error: 'Service non trouvé' });
  res.json(service);
};

export const updateService = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const { name, hospitalId } = req.body;
  try {
    const service = await prisma.service.update({
      where: { id },
      data: { 
        ...(name && { name }),
        ...(hospitalId && { hospitalId })
      },
    });
    res.json(service);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ce nom de service existe déjà' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Service non trouvé' });
    }
    res.status(400).json({ error: 'Erreur lors de la modification du service' });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  try {
    await prisma.service.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Service non trouvé' });
  }
};