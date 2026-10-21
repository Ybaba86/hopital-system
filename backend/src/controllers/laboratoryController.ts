import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createLaboratory = async (req: Request, res: Response) => {
  try {
    const { name, hospitalId } = req.body;
    const laboratory = await prisma.laboratory.create({
      data: { name, hospitalId: hospitalId || null },
    });
    res.status(201).json(laboratory);
  } catch (error) {
    res.status(400).json({ error: 'Erreur création laboratoire' });
  }
};

export const getLaboratories = async (req: Request, res: Response) => {
  try {
    const laboratories = await prisma.laboratory.findMany({
      include: { hospital: true }
    });
    res.json(laboratories);
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération laboratoires' });
  }
};

export const deleteLaboratory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.laboratory.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Laboratoire non trouvé ou impossible à supprimer' });
  }
};
