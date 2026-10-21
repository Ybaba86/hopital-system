import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, hospitalId, pharmacyId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role, hospitalId, pharmacyId },
    });
    res.status(201).json({ message: 'Utilisateur créé', userId: user.id });
  } catch (error) {
    res.status(400).json({ error: 'Email déjà utilisé ou données invalides' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { hospital: true, pharmacy: true } });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    
    let valid = false;
    
    // Si le mot de passe en base n'est pas encore haché (legacy plain-text password)
    if (user.password === password) {
      valid = true;
      // Auto-mise à jour du mot de passe en version hachée
      const newHashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword }
      });
    } else {
      valid = await bcrypt.compare(password, user.password);
    }

    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, hospitalId: user.hospitalId, pharmacyId: user.pharmacyId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        hospitalId: user.hospitalId, 
        hospitalName: user.hospital?.name,
        pharmacyId: user.pharmacyId,
        pharmacyName: user.pharmacy?.name
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
