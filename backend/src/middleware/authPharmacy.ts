import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authPharmacy = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Accès non autorisé' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
      pharmacyId?: string;
    };

    if (decoded.role !== 'PHARMACIEN') {
      return res.status(403).json({ error: 'Accès réservé aux pharmaciens' });
    }

    if (!decoded.pharmacyId) {
      return res.status(403).json({ error: 'Aucune pharmacie assignée à ce compte' });
    }

    // On injecte les infos dans req.user pour les utiliser dans les controllers
    (req as any).user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};
