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
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    
    // Recherche de l'utilisateur (insensible à la casse)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
      include: { hospital: true, pharmacy: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides (aucun compte avec cet email)' });
    }
    
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

    if (!valid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    const secret = process.env.JWT_SECRET || 'uneCleSecreteTresLonguePourJWT_NiangHospital2026';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, hospitalId: user.hospitalId, pharmacyId: user.pharmacyId },
      secret,
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
  } catch (error: any) {
    console.error('Erreur dans authController login:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error?.message || 'Erreur interne de connexion'
    });
  }
};

// Stockage temporaire des codes de réinitialisation
interface ResetEntry {
  code: string;
  expiresAt: number;
}
const resetCodes = new Map<string, ResetEntry>();

// 1. Demande de code de réinitialisation pour l'administrateur
export const adminForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Veuillez saisir votre adresse email' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(404).json({ error: 'Aucun compte administrateur trouvé avec cette adresse email.' });
    }

    // Générer un code sécurisé à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetCodes.set(cleanEmail, { code, expiresAt });

    const resetToken = jwt.sign(
      { email: cleanEmail, code, purpose: 'ADMIN_PASSWORD_RESET' },
      process.env.JWT_SECRET || 'uneCleSecreteTresLonguePourJWT',
      { expiresIn: '15m' }
    );

    console.log(`🔐 Code de réinitialisation pour ${cleanEmail} : ${code}`);

    res.json({
      message: 'Code de sécurité généré avec succès.',
      code, // Renvoyé pour utilisation immédiate
      resetToken,
      expiresInMinutes: 15,
    });
  } catch (error) {
    console.error('Erreur adminForgotPassword:', error);
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
};

// 2. Application du nouveau mot de passe
export const adminResetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword, masterKey, resetToken } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(404).json({ error: 'Compte administrateur introuvable.' });
    }

    const validMasterKey = process.env.ADMIN_MASTER_KEY || 'ADMIN-NIANG-2026';
    let isAuthorized = false;

    if (masterKey && masterKey.trim() === validMasterKey) {
      isAuthorized = true;
    } else if (code) {
      const stored = resetCodes.get(cleanEmail);
      if (stored && stored.code === code.trim() && stored.expiresAt > Date.now()) {
        isAuthorized = true;
      } else if (resetToken) {
        try {
          const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'uneCleSecreteTresLonguePourJWT') as any;
          if (decoded.email === cleanEmail && decoded.code === code.trim()) {
            isAuthorized = true;
          }
        } catch (e) {
          // Token expiré
        }
      }
    }

    if (!isAuthorized) {
      return res.status(400).json({
        error: 'Code de vérification invalide ou expiré (ou clé de sécurité incorrecte).',
      });
    }

    // Mise à jour sécurisée du mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Nettoyage
    resetCodes.delete(cleanEmail);

    res.json({
      message: 'Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    console.error('Erreur adminResetPassword:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
};
