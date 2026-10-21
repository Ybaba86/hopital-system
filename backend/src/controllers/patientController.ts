import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function generateUniqueNumber(): Promise<string> {
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { uniqueNumber: 'desc' },
  });
  let nextNum = 1;
  if (lastPatient) {
    const match = lastPatient.uniqueNumber.match(/\d+$/);
    if (match) nextNum = parseInt(match[0]) + 1;
  }
  return `PAT-${new Date().getFullYear()}${String(nextNum).padStart(4, '0')}`;
}


export const createPatient = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, birthDate, phone, email, password, bloodGroup, allergies, medicalHistory, familyHistory, insurance, hospitalId } = req.body;

    const uniqueNumber = await generateUniqueNumber();
    const hashedPassword = password ? await bcryptjs.hash(password, 10) : null;

    // Toujours utiliser l'hôpital par défaut créé dans le seed
    const patient = await prisma.patient.create({
      data: {
        uniqueNumber,
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone,
        email,
        password: hashedPassword,
        bloodGroup,
        allergies,
        medicalHistory,
        familyHistory,
        insurance,
        hospitalId,
      },
    });

    const { password: _, ...patientWithoutPassword } = patient;
    res.status(201).json(patientWithoutPassword);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ 
      error: 'Erreur création patient', 
      details: error.message 
    });
  }
};

export const getPatients = async (req: Request, res: Response) => {
  const patients = await prisma.patient.findMany({
    include: { consultations: true, appointments: true },
  });
  res.json(patients);
};

export const getPatientById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { consultations: true, appointments: true, labResults: true, hospitalizations: true },
  });

  if (!patient) return res.status(404).json({ error: 'Patient non trouvé' });
  res.json(patient);
};

export const updatePatient = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });

  const { firstName, lastName, birthDate, phone, email, password, bloodGroup, allergies, medicalHistory, familyHistory, insurance, hospitalId } = req.body;

  try {
    const dataToUpdate: any = {
      firstName,
      lastName,
      birthDate: birthDate ? new Date(birthDate) : null,
      phone,
      email,
      bloodGroup,
      allergies,
      medicalHistory,
      familyHistory,
      insurance,
      ...(hospitalId && { hospitalId }),
    };

    if (password) {
      dataToUpdate.password = await bcryptjs.hash(password, 10);
    }
    const patient = await prisma.patient.update({
      where: { id },
      data: dataToUpdate,
    });
    const { password: _, ...patientWithoutPassword } = patient as any;
    res.json(patientWithoutPassword);
  } catch {
    res.status(404).json({ error: 'Patient non trouvé' });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });

  try {
    await prisma.patient.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Patient non trouvé' });
  }
};