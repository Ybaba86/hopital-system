import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createMedicine = async (req: Request, res: Response) => {
  try {
    const { name, description, stock, price, expiryDate, supplier } = req.body;
    const pharmacyId = (req as any).user.pharmacyId;

    const medicine = await prisma.medicine.create({
      data: {
        name,
        description,
        stock: stock || 0,
        price,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplier,
        pharmacyId,
      },
    });
    res.status(201).json(medicine);
  } catch (error) {
    res.status(400).json({ error: 'Erreur création médicament' });
  }
};

export const getMedicines = async (req: Request, res: Response) => {
  const pharmacyId = (req as any).user.pharmacyId;
  const medicines = await prisma.medicine.findMany({
    where: { pharmacyId }
  });
  res.json(medicines);
};

export const getMedicineById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const pharmacyId = (req as any).user.pharmacyId;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  
  const medicine = await prisma.medicine.findUnique({ where: { id } });
  if (!medicine || medicine.pharmacyId !== pharmacyId) {
    return res.status(404).json({ error: 'Médicament non trouvé dans cette pharmacie' });
  }
  res.json(medicine);
};

export const updateMedicine = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const pharmacyId = (req as any).user.pharmacyId;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  
  const existing = await prisma.medicine.findUnique({ where: { id } });
  if (!existing || existing.pharmacyId !== pharmacyId) {
    return res.status(404).json({ error: 'Médicament non trouvé dans cette pharmacie' });
  }

  const { name, description, stock, price, expiryDate, supplier } = req.body;
  try {
    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        name,
        description,
        stock,
        price,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplier,
      },
    });
    res.json(medicine);
  } catch {
    res.status(404).json({ error: 'Erreur lors de la mise à jour' });
  }
};

export const deleteMedicine = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const pharmacyId = (req as any).user.pharmacyId;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  
  const existing = await prisma.medicine.findUnique({ where: { id } });
  if (!existing || existing.pharmacyId !== pharmacyId) {
    return res.status(404).json({ error: 'Médicament non trouvé dans cette pharmacie' });
  }

  try {
    await prisma.medicine.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Erreur lors de la suppression' });
  }
};