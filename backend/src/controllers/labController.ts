import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

async function generateReceiptNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const lastPayment = await prisma.payment.findFirst({
    where: { receiptNumber: { startsWith: `REC-${dateStr}` } },
    orderBy: { receiptNumber: 'desc' },
  });
  let nextNum = 1;
  if (lastPayment) {
    const match = lastPayment.receiptNumber.match(/\d+$/);
    if (match) nextNum = parseInt(match[0]) + 1;
  }
  return `REC-${dateStr}-${String(nextNum).padStart(4, '0')}`;
}

export const payLabPrescription = async (req: Request, res: Response) => {
  const { prescriptionId, patientId, amount, paymentType } = req.body;
  if (!prescriptionId || !patientId || !amount || !paymentType) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { consultation: true }
    });

    if (!prescription || prescription.type !== 'lab') {
      return res.status(404).json({ error: "Ordonnance d'analyse non trouvée" });
    }

    if (prescription.status === 'paid') {
      return res.status(400).json({ error: 'Cette ordonnance a déjà été payée' });
    }

    const receiptNumber = await generateReceiptNumber();

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: parseFloat(amount) || 0,
          paymentType,
          patientId,
          prescriptionId,
          description: 'Paiement analyse de laboratoire',
          receiptNumber,
          status: 'completed',
        },
      });

      await tx.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'paid' },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const count = await tx.queueTicket.count({ 
        where: { createdAt: { gte: today }, queueType: 'laboratory' } 
      });

      const ticket = await tx.queueTicket.create({
        data: {
          ticketNumber: count + 1,
          patientId,
          queueType: 'laboratory',
          status: 'waiting',
          isEmergency: false,
        },
      });

      return { payment, ticket };
    });

    res.status(201).json({
      message: 'Paiement validé et patient ajouté en file d\'attente laboratoire',
      payment: result.payment,
      ticket: result.ticket
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du paiement labo' });
  }
};

export const submitLabResult = async (req: Request, res: Response) => {
  const { prescriptionId, patientId, doctorId, resultText, ticketId } = req.body;
  
  if (!prescriptionId || !patientId || !doctorId) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  const fileUrl = req.file ? `/uploads/lab-results/${req.file.filename}` : null;

  try {
    const category = req.body.category || 'BIOLOGY';
    const result = await prisma.$transaction(async (tx) => {
      const labResult = await tx.labResult.create({
        data: {
          prescriptionId,
          patientId,
          doctorId,
          result: resultText || null,
          fileUrl,
          category,
          status: 'pending_review' 
        }
      });

      if (ticketId) {
        await tx.queueTicket.update({
          where: { id: ticketId },
          data: { status: 'completed' }
        });
      }

      return labResult;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la soumission des résultats' });
  }
};

export const getPendingResultsForDoctor = async (req: Request, res: Response) => {
  const doctorId = req.params.doctorId as string;
  try {
    const results = await prisma.labResult.findMany({
      where: {
        doctorId,
        status: 'pending_review'
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const validateLabResult = async (req: Request, res: Response) => {
  const resultId = req.params.resultId as string;
  const { doctorNotes, validatedBy } = req.body;
  try {
    const result = await prisma.labResult.update({
      where: { id: resultId },
      data: {
        status: 'validated',
        doctorNotes,
        validatedBy
      }
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la validation du résultat' });
  }
};

export const getPaidLabPrescriptionsByPatient = async (req: Request, res: Response) => {
  const patientId = req.params.patientId as string;
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        consultation: { patientId },
        type: 'lab',
        status: 'paid'
      },
      include: {
        consultation: { include: { doctor: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getLabResultsByPatient = async (req: Request, res: Response) => {
  const patientId = req.params.patientId as string;
  try {
    const results = await prisma.labResult.findMany({
      where: { patientId },
      include: {
        doctor: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getAllLabResults = async (req: Request, res: Response) => {
  try {
    const labPrescriptions = await prisma.prescription.findMany({
      where: { type: 'lab' },
      include: {
        consultation: {
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, uniqueNumber: true } },
            doctor: { select: { name: true } }
          }
        }
      }
    });

    const labResults = await prisma.labResult.findMany();

    const formattedResults = labPrescriptions.map(p => {
      const lr = labResults.find(r => r.prescriptionId === p.id);
      
      return {
        id: lr?.id || p.id,
        prescriptionId: p.id,
        prescription: p,
        patient: p.consultation?.patient,
        doctor: p.consultation?.doctor,
        result: lr?.result || null,
        status: lr?.status || p.status,
        fileUrl: lr?.fileUrl || null,
        doctorNotes: lr?.doctorNotes || null,
        createdAt: lr?.createdAt || p.createdAt,
      };
    });

    formattedResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(formattedResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPrescriptionByQr = async (req: Request, res: Response) => {
  const qrCode = req.params.qrCode as string;
  try {
    const prescription = await prisma.prescription.findFirst({
      where: { 
        OR: [
          { id: qrCode },
          { qrCode: qrCode }
        ],
        type: 'lab'
      },
      include: {
        consultation: {
          include: {
            patient: true,
            doctor: true
          }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({ error: "Ordonnance d'analyses introuvable avec ce code." });
    }

    // Check if result already submitted
    const existingResult = await prisma.labResult.findFirst({
      where: { prescriptionId: prescription.id }
    });

    res.json({
      ...prescription,
      hasResult: !!existingResult,
      resultStatus: existingResult?.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
