import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET_HARD = "uneCleSecreteTresLonguePourJWT";

export const authPatient = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  console.log("🔍 Auth Header reçu :", authHeader); // ← Debug

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("❌ Pas de token Bearer");
    return res.status(401).json({ error: 'Authentification requise' });
  }

  const token = authHeader.split(' ')[1];
  console.log("🔑 Token extrait :", token.substring(0, 50) + "..."); // ← Debug

  try {
    const decoded = jwt.verify(token, JWT_SECRET_HARD) as { id: string; role: string };
    console.log("✅ Token décodé :", decoded); // ← Debug important

    if (decoded.role !== 'PATIENT') {
      console.log("❌ Rôle incorrect :", decoded.role);
      return res.status(403).json({ error: 'Accès réservé aux patients' });
    }

    (req as any).patientId = decoded.id;
    next();
  } catch (error: any) {
    console.error('❌ Erreur token :', error.message);
    return res.status(401).json({ error: 'Token invalide' });
  }
};