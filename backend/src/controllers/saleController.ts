import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Définition d'un type pour les items de vente
type SaleItemInput = {
  medicineId: string;
  quantity: number;
};

async function generateReceiptNumber(prisma: PrismaClient): Promise<string> {
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

export const createSaleFromPrescription = async (req: Request, res: Response) => {
  try {
    let { items, paymentType, discount, prescriptionId, isOverTheCounter, customerName, customerPhone } = req.body;
    const pharmacyId = (req as any).user?.pharmacyId;
    discount = discount || 0;

    let prescription: any = null;
    if (prescriptionId) {
      prescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: { consultation: true },
      });
      if (!prescription) {
        return res.status(404).json({ error: 'Prescription non trouvée' });
      }
      if (prescription.status === 'delivered') {
        return res.status(400).json({ error: 'Cette ordonnance a déjà été délivrée' });
      }
    } else {
      isOverTheCounter = true;
    }

    // 2. Vérifier les stocks et calculer le total
    let subtotal = 0;
    const saleItemsData: {
      medicineId: string;
      quantity: number;
      unitPrice: number;
      total: number;
      isSubstituted?: boolean;
      originalMedicineName?: string;
    }[] = [];

    for (const item of items) {
      const medicine = await prisma.medicine.findUnique({
        where: { id: item.medicineId },
      });
      if (!medicine || (pharmacyId && medicine.pharmacyId && medicine.pharmacyId !== pharmacyId)) {
        return res.status(404).json({ error: `Médicament ${item.medicineId} non trouvé dans votre pharmacie` });
      }
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuffisant pour ${medicine.name}` });
      }
      const itemTotal = medicine.price * item.quantity;
      subtotal += itemTotal;
      saleItemsData.push({
        medicineId: medicine.id,
        quantity: item.quantity,
        unitPrice: medicine.price,
        total: itemTotal,
        isSubstituted: Boolean(item.isSubstituted),
        originalMedicineName: item.originalMedicineName || null,
      });
    }

    const totalAmount = Math.max(0, subtotal - discount);
    const receiptNumber = await generateReceiptNumber(prisma);

    // 3. Créer la vente et les items (transaction)
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          prescriptionId: prescription ? prescription.id : undefined,
          totalAmount,
          pharmacyId: pharmacyId || undefined,
          status: 'completed',
          isOverTheCounter: Boolean(isOverTheCounter),
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          items: {
            create: saleItemsData,
          },
        },
        include: { items: { include: { medicine: true } } },
      });

      // 4. Mettre à jour les stocks
      for (const item of saleItemsData) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Si ordonnance, marquer comme délivrée
      if (prescription) {
        await tx.prescription.update({
          where: { id: prescription.id },
          data: { status: 'delivered' },
        });
      }

      // 5. Enregistrer le paiement
      const patientId = prescription?.consultation?.patientId || req.body.patientId || null;
      const payment = await tx.payment.create({
        data: {
          amount: totalAmount,
          paymentType: paymentType || 'cash',
          patientId: patientId || undefined,
          saleId: newSale.id,
          prescriptionId: prescription ? prescription.id : undefined,
          description: prescription ? 'Achat Médicaments Pharmacie (Ordonnance)' : 'Vente Libre Pharmacie (Sans ordonnance)',
          receiptNumber,
          status: 'completed',
        },
      });

      return { ...newSale, payment };
    });

    // 6. Générer une facture détaillée (JSON)
    const clientName = customerName || (prescription?.consultation?.patient 
      ? `${prescription.consultation.patient.firstName} ${prescription.consultation.patient.lastName}` 
      : 'Client Comptoir');
    const clientPhone = customerPhone || prescription?.consultation?.patient?.phone || null;

    const invoice = {
      saleId: sale.id,
      receiptNumber: receiptNumber,
      date: sale.paymentDate,
      prescriptionQr: prescription?.qrCode || 'VENTE-LIBRE',
      isOverTheCounter: Boolean(isOverTheCounter),
      customerName: clientName,
      customerPhone: clientPhone,
      doctorName: prescription?.consultation?.doctor?.name || null,
      patientUniqueNumber: prescription?.consultation?.patient?.uniqueNumber || null,
      items: sale.items.map((i: any) => ({
        medicine: i.medicine.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
        isSubstituted: i.isSubstituted,
        originalMedicineName: i.originalMedicineName,
      })),
      subtotal,
      discount,
      totalAmount: sale.totalAmount,
      paymentType: paymentType || 'cash',
      status: sale.status,
    };

    res.status(201).json({ sale, invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la vente' });
  }
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const pharmacyId = (req as any).user?.pharmacyId;
    const sales = await prisma.sale.findMany({
      where: { ...(pharmacyId ? { pharmacyId } : {}) },
      include: { 
        items: { include: { medicine: true } },
        prescription: {
          include: {
            consultation: {
              include: { patient: true, doctor: true }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
    });

    const saleIds = sales.map(s => s.id);
    const payments = await prisma.payment.findMany({
      where: { saleId: { in: saleIds } }
    });

    const salesWithPayment = sales.map(s => ({
      ...s,
      payment: payments.find(p => p.saleId === s.id) || null
    }));

    res.json(salesWithPayment);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des ventes' });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const pharmacyId = (req as any).user?.pharmacyId;
    if (!id) return res.status(400).json({ error: 'ID manquant' });
    const sale = await prisma.sale.findFirst({
      where: { id, ...(pharmacyId ? { pharmacyId } : {}) },
      include: { 
        items: { include: { medicine: true } },
        prescription: {
          include: {
            consultation: {
              include: { patient: true, doctor: true }
            }
          }
        }
      },
    });
    if (!sale) return res.status(404).json({ error: 'Vente non trouvée' });
    
    const payment = await prisma.payment.findFirst({
      where: { saleId: sale.id }
    });

    res.json({ ...sale, payment });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la vente' });
  }
};

export const getPrescriptionByQrCode = async (req: Request, res: Response) => {
  try {
    const rawParam = String(req.params.qrCode || '').trim();
    if (!rawParam) {
      return res.status(400).json({ error: "Code d'ordonnance manquant" });
    }

    // Si une URL complète a été scannée (ex: http://.../api/.../qr/ABC123), extraire le code final
    const cleanCode = rawParam.includes('/qr/') ? rawParam.split('/qr/').pop()!.split('?')[0].trim() : rawParam;

    const prescription = await prisma.prescription.findFirst({
      where: {
        OR: [
          { qrCode: cleanCode },
          { id: cleanCode },
          { qrCode: rawParam },
          { id: rawParam }
        ]
      },
      include: {
        consultation: {
          include: {
            patient: true,
            doctor: true
          }
        },
        sale: {
          include: { items: true }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Ordonnance introuvable. Veuillez vérifier le code ou scanner à nouveau.' });
    }

    if (prescription.type !== 'medication') {
      return res.status(400).json({ error: "Ce QR code correspond à des examens de laboratoire, pas à une ordonnance de pharmacie." });
    }

    res.json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'ordonnance' });
  }
};

export const cancelSale = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id) return res.status(400).json({ error: 'ID de la vente manquant' });

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, prescription: true }
    });

    if (!sale) return res.status(404).json({ error: 'Vente introuvable' });
    if (sale.status === 'cancelled') return res.status(400).json({ error: 'Vente déjà annulée' });

    await prisma.$transaction(async (tx) => {
      // 1. Annuler la vente
      await tx.sale.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      // 2. Recréditer les stocks
      for (const item of sale.items) {
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { stock: { increment: item.quantity } }
        });
      }

      // 3. Remettre l'ordonnance en actif
      if (sale.prescriptionId) {
        await tx.prescription.update({
          where: { id: sale.prescriptionId },
          data: { status: 'active' }
        });
      }

      // 4. Annuler le paiement associé
      const payment = await tx.payment.findFirst({
        where: { saleId: id }
      });
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'cancelled' }
        });
      }
    });

    res.json({ message: 'Vente annulée avec succès et stocks recrédités' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'annulation de la vente" });
  }
};

export const getPatientSales = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId as string;
    const pharmacyId = (req as any).user?.pharmacyId;
    if (!patientId) return res.status(400).json({ error: 'Patient ID manquant' });

    const sales = await prisma.sale.findMany({
      where: {
        pharmacyId,
        prescription: {
          consultation: {
            patientId: patientId
          }
        },
        status: { not: 'cancelled' } // optionnel: on peut aussi retourner les annulées
      },
      include: {
        items: { include: { medicine: true } },
        prescription: {
          include: {
            consultation: {
              include: { doctor: true }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });
    
    // on inclut quand même toutes les ventes pour l'historique complet
    const allSales = await prisma.sale.findMany({
      where: {
        pharmacyId,
        prescription: {
          consultation: {
            patientId: patientId
          }
        }
      },
      include: {
        items: { include: { medicine: true } },
        prescription: {
          include: {
            consultation: {
              include: { doctor: true }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    const saleIds = allSales.map(s => s.id);
    const payments = await prisma.payment.findMany({
      where: { saleId: { in: saleIds } }
    });

    const salesWithPayment = allSales.map(s => ({
      ...s,
      payment: payments.find(p => p.saleId === s.id) || null
    }));

    res.json(salesWithPayment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération de l'historique patient" });
  }
};

export const getReportByInterval = async (req: Request, res: Response) => {
  try {
    const pharmacyId = (req as any).user?.pharmacyId;
    if (!pharmacyId) {
      return res.status(401).json({ error: 'Accès non autorisé' });
    }

    const { startDate, endDate } = req.query;
    
    // Default to today if no dates provided
    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate as string) : new Date(start);
    end.setHours(23, 59, 59, 999);

    // First, find all sales for this pharmacy in the date range
    const sales = await prisma.sale.findMany({
      where: {
        pharmacyId,
        paymentDate: { gte: start, lte: end },
        status: 'completed',
      },
      include: {
        items: { include: { medicine: true } },
        prescription: {
          include: {
            consultation: {
              include: { doctor: true, patient: true }
            }
          }
        }
      }
    });

    const saleIds = sales.map(s => s.id);

    // Then, fetch payments corresponding to these sales
    const payments = await prisma.payment.findMany({
      where: { 
        saleId: { in: saleIds },
        status: 'completed'
      },
      include: {
        patient: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    // Manually map the sale items to each payment for the frontend
    const paymentsWithSales = payments.map(p => {
      const sale = sales.find(s => s.id === p.saleId);
      return {
        ...p,
        sale
      };
    });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const byType = {
      cash: payments.filter(p => p.paymentType === 'cash').reduce((s, p) => s + p.amount, 0),
      card: payments.filter(p => p.paymentType === 'card').reduce((s, p) => s + p.amount, 0),
      orange_money: payments.filter(p => p.paymentType === 'orange_money').reduce((s, p) => s + p.amount, 0),
      wave: payments.filter(p => p.paymentType === 'wave').reduce((s, p) => s + p.amount, 0),
      insurance: payments.filter(p => p.paymentType === 'insurance').reduce((s, p) => s + p.amount, 0),
    };

    res.json({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      total,
      byType,
      payments: paymentsWithSales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
  }
};