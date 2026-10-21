import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { amount, paymentType, description, patientId, consultationId, hospitalizationId, saleId } = req.body;
    const receiptNumber = await generateReceiptNumber();
    const payment = await prisma.payment.create({
      data: {
        amount,
        paymentType,
        description,
        patientId,
        consultationId,
        hospitalizationId,
        saleId,
        receiptNumber,
        status: 'completed',
      },
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erreur création paiement' });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  const { patientId, hospitalId } = req.query;
  const whereClause: any = {};
  if (patientId) whereClause.patientId = String(patientId);
  if (hospitalId) whereClause.patient = { hospitalId: String(hospitalId) };

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      prescription: {
        include: {
          sale: {
            include: {
              items: { include: { medicine: true } },
              pharmacy: true
            }
          }
        }
      }
    },
    orderBy: { paymentDate: 'desc' },
  });

  const directSaleIds = payments.map(p => p.saleId).filter(Boolean) as string[];
  const directSales = directSaleIds.length > 0
    ? await prisma.sale.findMany({
        where: { id: { in: directSaleIds } },
        include: {
          items: { include: { medicine: true } },
          pharmacy: true
        }
      })
    : [];

  const paymentsWithSale = payments.map(p => {
    const sale = p.prescription?.sale || directSales.find(s => s.id === p.saleId) || null;
    return {
      ...p,
      sale
    };
  });

  res.json(paymentsWithSale);
};

export const getPaymentById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  if (!id) return res.status(400).json({ error: 'ID manquant' });
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });
  res.json(payment);
};

export const getDailyReport = async (req: Request, res: Response) => {
  const { date, hospitalId } = req.query;
  const startDate = date ? new Date(date as string) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const whereClause: any = { paymentDate: { gte: startDate, lt: endDate } };
  if (hospitalId) whereClause.patient = { hospitalId: String(hospitalId) };

  const payments = await prisma.payment.findMany({
    where: whereClause,
  });
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const byType = {
    cash: payments.filter(p => p.paymentType === 'cash').reduce((s, p) => s + p.amount, 0),
    card: payments.filter(p => p.paymentType === 'card').reduce((s, p) => s + p.amount, 0),
    insurance: payments.filter(p => p.paymentType === 'insurance').reduce((s, p) => s + p.amount, 0),
  };
  res.json({ date: startDate.toISOString().slice(0, 10), total, byType, payments });
};

export const getMonthlyReport = async (req: Request, res: Response) => {
  const { year, month, hospitalId } = req.query;
  const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 1);
  
  const whereClause: any = { paymentDate: { gte: startDate, lt: endDate } };
  if (hospitalId) whereClause.patient = { hospitalId: String(hospitalId) };

  const payments = await prisma.payment.findMany({
    where: whereClause,
  });
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const byType = {
    cash: payments.filter(p => p.paymentType === 'cash').reduce((s, p) => s + p.amount, 0),
    card: payments.filter(p => p.paymentType === 'card').reduce((s, p) => s + p.amount, 0),
    insurance: payments.filter(p => p.paymentType === 'insurance').reduce((s, p) => s + p.amount, 0),
  };
  res.json({ year: currentYear, month: currentMonth, total, byType, payments });
};

export const getReportByInterval = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hospitalId } = req.query;
    
    // Default to today if no dates provided
    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate as string) : new Date(start);
    end.setHours(23, 59, 59, 999);

    const whereClause: any = { paymentDate: { gte: start, lte: end } };
    if (hospitalId) whereClause.patient = { hospitalId: String(hospitalId) };

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patient: true
      },
      orderBy: { paymentDate: 'desc' }
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
      payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
  }
};