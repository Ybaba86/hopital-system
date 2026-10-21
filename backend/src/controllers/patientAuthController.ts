import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SECRET EN DUR POUR TEST (à supprimer après)
const JWT_SECRET_HARD = "uneCleSecreteTresLonguePourJWT";

export const patientLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const patient = await prisma.patient.findFirst({ where: { email }, include: { hospital: true } });
    if (!patient || !patient.password) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const valid = await bcrypt.compare(password, patient.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });
    const token = jwt.sign(
      { id: patient.id, role: 'PATIENT' },
      JWT_SECRET_HARD,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      patient: { id: patient.id, firstName: patient.firstName, lastName: patient.lastName, email: patient.email, hospitalId: patient.hospitalId, hospitalName: patient.hospital?.name }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};