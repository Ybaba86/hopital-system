import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRETS_TO_TRY = [
  process.env.JWT_SECRET,
  'uneCleSecreteTresLonguePourJWT_NiangHospital2026',
  'uneCleSecreteTresLonguePourJWT',
].filter(Boolean) as string[];

export const authPharmacy = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    let decoded: any = null;
    let lastError: any = null;

    for (const secret of SECRETS_TO_TRY) {
      try {
        decoded = jwt.verify(token, secret);
        if (decoded) break;
      } catch (e) {
        lastError = e;
      }
    }

    if (!decoded) {
      console.error('authPharmacy verification failed:', lastError?.message);
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Autoriser PHARMACIEN et ADMIN
    if (decoded.role !== 'PHARMACIEN' && decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux pharmaciens' });
    }

    // Assigner une pharmacie par défaut si non spécifié (ex: compte ADMIN)
    if (!decoded.pharmacyId) {
      decoded.pharmacyId = 'pharm1';
    }

    // On injecte les infos dans req.user pour les utiliser dans les controllers
    (req as any).user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};
