import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, hospitalId, serviceId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        hospitalId,
        serviceId,
      },
      select: { id: true, email: true, name: true, role: true, hospitalId: true, serviceId: true },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Email déjà utilisé ou données invalides' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: { hospital: true, service: true },
  });
  res.json(users);
};

export const getUserById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const user = await prisma.user.findUnique({
    where: { id },
    include: { hospital: true, service: true },
  });
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json(user);
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const { name, role, hospitalId, serviceId } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name, role, hospitalId, serviceId },
      select: { id: true, email: true, name: true, role: true, hospitalId: true, serviceId: true },
    });
    res.json(user);
  } catch {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
};