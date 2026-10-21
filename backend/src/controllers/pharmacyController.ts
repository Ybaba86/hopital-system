import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createPharmacy = async (req: Request, res: Response) => {
  try {
    const { name, hospitalId } = req.body;
    const pharmacy = await prisma.pharmacy.create({
      data: { name, hospitalId: hospitalId || null },
    });
    res.status(201).json(pharmacy);
  } catch (error) {
    res.status(400).json({ error: 'Erreur création pharmacie' });
  }
};

export const getPharmacies = async (req: Request, res: Response) => {
  try {
    const pharmacies = await prisma.pharmacy.findMany({
      include: { hospital: true }
    });
    res.json(pharmacies);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération pharmacies' });
  }
};

export const deletePharmacy = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.pharmacy.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Pharmacie non trouvée ou impossible à supprimer' });
  }
};
