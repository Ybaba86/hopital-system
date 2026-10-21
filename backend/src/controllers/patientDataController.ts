import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPatientProfile = async (req: Request, res: Response) => {
  const patientId = (req as any).patientId;
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, bloodGroup: true, allergies: true },
  });
  res.json(patient);
};

export const getPatientAppointments = async (req: Request, res: Response) => {
  const patientId = (req as any).patientId;
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    include: { doctor: { select: { name: true, email: true } } },
    orderBy: { date: 'asc' },
  });
  res.json(appointments);
};

export const getPatientPrescriptions = async (req: Request, res: Response) => {
  const patientId = (req as any).patientId;
  const consultations = await prisma.consultation.findMany({
    where: { patientId },
    include: { 
      prescriptions: {
        include: {
          sale: { 
            include: { 
              pharmacy: { select: { name: true } },
              items: { include: { medicine: true } }
            } 
          }
        }
      }, 
      doctor: { select: { name: true, hospital: { select: { name: true } } } } 
    },
    orderBy: { date: 'desc' },
  });

  const labResults = await prisma.labResult.findMany({
    where: { patientId },
    select: { prescriptionId: true, status: true, laboratory: { select: { name: true } } }
  });

  const prescriptions = consultations.flatMap(c => c.prescriptions.map(p => {
    let status = p.status;
    let pharmacyName = null;
    let laboratoryName = null;

    if (p.type === 'lab') {
      const lr = labResults.find(r => r.prescriptionId === p.id);
      if (lr && lr.status === 'validated') {
        status = 'validated_lab';
        laboratoryName = lr.laboratory?.name || `Laboratoire - ${(c.doctor as any).hospital?.name || 'Central'}`;
      }
    } else if (p.type === 'medication' && status === 'delivered') {
      pharmacyName = p.sale?.pharmacy?.name || null;
    }
    
    return {
      id: p.id,
      type: p.type,
      content: p.content,
      qrCode: p.qrCode,
      status,
      pharmacyName,
      laboratoryName,
      doctorName: c.doctor.name,
      hospitalName: (c.doctor as any).hospital?.name || null,
      consultationDate: c.date,
      sale: p.sale ? {
        id: p.sale.id,
        totalAmount: p.sale.totalAmount,
        paymentDate: p.sale.paymentDate,
        status: p.sale.status,
        pharmacyName: p.sale.pharmacy?.name || pharmacyName,
        items: p.sale.items.map((i: any) => ({
          id: i.id,
          name: i.medicine?.name || 'Médicament',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
          isSubstituted: i.isSubstituted,
          originalMedicineName: i.originalMedicineName
        }))
      } : null
    };
  }));
  res.json(prescriptions);
};

export const getPatientLabResults = async (req: Request, res: Response) => {
  const patientId = (req as any).patientId;
  const labResults = await prisma.labResult.findMany({
    where: { patientId },
    include: { doctor: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(labResults);
};