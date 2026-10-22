# 📋 GUIDE COMPLET D'UTILISATION DE A À Z : SUITE HOSPITALIÈRE MEDIFLOW

Ce guide de référence détaille le fonctionnement intégral, les règles de gestion, les identifiants d'accès et les parcours utilisateurs pas à pas pour l'ensemble des 6 interfaces de la plateforme hospitalière **MediFlow**.

---

## 🗺️ 1. Matrice des Rôles & Accès Officiels

| Interface | Rôle & Utilité | Compte de test officiel | Mot de passe |
| :--- | :--- | :--- | :--- |
| **📱 Portail Patient** | Inscription, Prise de RDV, Reprogrammation (7j), Carnet médical, Reçus | `admin@gmail.com`<br>`baba@gmail.com`<br>`jean.dupont@example.com` *(ou inscription libre)* | `123456`<br>`123456`<br>`1234` |
| **👨‍⚕️ Portail Médecin** | File d'attente, Badges reprogrammés, Consultation, Prescriptions QR | `medecin@niang.com` | `password123` |
| **💳 Portail Caisse** | Encaissement, Tickets de file d'attente, Facturation labo, Clôture de caisse | `caissier@niang.com` | `password123` |
| **💊 Portail Pharmacie** | Délivrance sur ordonnance, Substitution autorisée, Vente libre, Stocks | `pharmacien@niang.com` | `password123` |
| **🔬 Portail Laboratoire** | Bulletins d'analyse, Imageries médicales, Téléversement résultats PDF | `laborantin@niang.com` | `password123` |
| **⚙️ Super-Administration** | Hôpitaux, Utilisateurs, Statistiques, Récupération mot de passe | `admin@gmail.com`<br>`admin@niang.com` | `123456`<br>`admin123` |

---

## 📱 2. Installation Smartphone (Mode Application PWA)

Tous les frontends sont **100% responsives et adaptés aux mobiles** sans passer par les stores payants :
- **Android (Chrome)** : Menu `⋮` (3 points en haut à droite) ➔ **« Ajouter à l'écran d'accueil »** (ou « Installer l'application »).
- **iPhone (Safari)** : Bouton Partager (carré avec flèche vers le haut) ➔ **« Sur l'écran d'accueil »**.
- **Résultat** : L'icône se place sur l'écran d'accueil et s'ouvre en **plein écran natif** (sans barre d'adresse de navigateur).

---

## 🏥 3. Guide par Interface (De A à Z)

### A. Portail Patient (`frontend-patient`)

#### 1. Inscription & Dossier Médical
- **Groupe Sanguin obligatoire** : Choix dans la liste déroulante (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
- **Antécédents Familiaux** : Saisie des pathologies héréditaires (diabète, drépanocytose, hypertension, allergies).
- **Identifiant Unique** : Attribution automatique du numéro de dossier permanent (`PAT-2026XXXX`).

#### 2. Prise de Rendez-vous
- Sélection de l'hôpital, de la spécialité médicale et du médecin disponible.
- Type de visite :
  - **Présentiel** à l'hôpital.
  - **Consultation VIP à Domicile** (avec saisie de l'adresse du domicile).
- **Mode de paiement au choix** :
  - **Sur place** : Le patient règle lors de son arrivée à la caisse.
  - **En ligne** : Règlement instantané (*Wave*, *Orange Money*, *Carte Bancaire*).

#### 3. Gestion de la Reprogrammation (Règle Métier des 7 Jours)
- Si le patient ne s'est pas présenté ou souhaite changer sa date :
  - **Moins de 7 jours après la date prévue** : La reprogrammation est **gratuite**. Le système affiche un compteur dynamique (*« Valable encore X j / 7j »*). Le patient sélectionne un nouveau créneau disponible (les heures passées et occupées sont grisées).
  - **Plus de 7 jours** : La reprogrammation gratuite est verrouillée. Un badge rouge *« Délai 7j expiré »* invite le patient à effectuer un **nouveau paiement**.

#### 4. Carnet Numérique & Reçus
- Consultation de l'historique médical et des ordonnances avec QR Code.
- Téléchargement des résultats d'analyses biologiques et imageries.
- Téléchargement des reçus officiels de consultation au format PDF : `Reçu_Consultation_YYYY-MM-DD.pdf`.

---

### B. Portail Médecin (`frontend-medecin`)

#### 1. Accueil & File d'Attente Interactive
- Affichage en temps réel des patients ayant leur ticket validé en caisse.
- Détection immédiate des consultations reprogrammées grâce au badge vert/bleu **`🔄 Reprogrammé par le patient`**.

#### 2. Gestion des Rendez-vous & Onglet Dédié
- Onglets de tri : *Tous*, *Aujourd'hui*, **`Reprogrammés (compteur)`**, *À venir*.
- Indication précise de la validité du délai : **`Délai de consultation : Jour X / 7`**.
- Bouton direct **« Consulter »** ouvrant le dossier médical complet.

#### 3. Consultation & Renseignement Clinique
- **Vérification obligatoire des antécédents** : Alerte visuelle rappelant le groupe sanguin, les antécédents familiaux et les allergies avant toute prescription.
- **Renseignement Clinique (Motif de la consultation)** : Synthèse des symptômes, motif d'admission et constantes vitales.
- **Traitements Médicales (Prescription)** : Prescription avec posologie, durée et génération automatique du QR Code sécurisé pour la pharmacie.
- **Demande d'Examen Médical** : Prescription d'analyses biologiques ou d'actes d'imageries transmise instantanément au laboratoire et à la caisse.

---

### C. Portail Caisse & Facturation (`frontend-caisse`)

#### 1. Encaissement des Consultations
- Tableau des paiements en attente (RDV avec choix paiement sur place).
- Encaissement par *Espèces*, *Wave*, *Orange Money*, *Carte* ou *Prise en charge assurance*.
- Émission automatique du **ticket de file d'attente** imprimable avec numéro d'appel.

#### 2. Encaissement des Examens de Laboratoire & Imageries
- Lecture du code du bulletin d'examen émis par le médecin.
- Encaissement de la prestation : le patient est basculé immédiatement dans la file d'attente du laboratoire.

#### 3. Clôture de Caisse & Statistiques
- Suivi du chiffre d'affaires journalier ventilé par mode de paiement.
- Exportation des états de caisse officiels en PDF.

---

### D. Portail Pharmacie (`frontend-pharmacie`)

#### 1. Délivrance sur Ordonnance
- Scan du QR Code ordonnance ou saisie du code ordonnance.
- Affichage automatique des médicaments prescrits, posologies et identité du patient.

#### 2. Autorisation de Substitution
- En cas de rupture d'un médicament ou pour proposer un générique équivalent :
  - Le pharmacien clique sur **« Substituer »**.
  - Sélection du médicament de remplacement dans le stock.
  - Le système trace le médicament original prescrit par le médecin et décrémente le produit de substitution.

#### 3. Vente Libre Sans Ordonnance
- Espace vente directe au comptoir avec recherche par scan de code-barres ou saisie textuelle.
- Saisie facultative des coordonnées du client.
- Édition et réimpression instantanée du ticket de caisse / reçu de vente.

#### 4. Gestion des Stocks
- Suivi des niveaux de stock avec alerte rouge pour les produits en seuil critique (< 20 unités).
- Réapprovisionnement et gestion des prix unitaires.

---

### E. Portail Laboratoire & Imagerie (`frontend-laborantin`)

#### 1. File d'Attente du Laboratoire
- Liste des patients ayant validé le paiement de leurs examens à la caisse.

#### 2. Prise en Charge par Bulletin d'Analyse
- Scan du code du **Bulletin d’Analyse**.
- Lecture de la **Demande d’Examen Médical** rédigée par le praticien.
- Tri par catégorie :
  - 🔬 **Analyses Biologiques** (NFS, Glycémie, Bilan lipidique, Sérologie, etc.).
  - 🩻 **Imageries Médicales** (Radiographie, Échographie, Scanner, IRM, etc.).

#### 3. Téléversement & Transmission des Résultats
- Upload du compte-rendu ou cliché au format PDF.
- Saisie de notes complémentaires ou valeurs observées.
- **Transmission instantanée** : Le résultat est rattaché au dossier du patient et immédiatement accessible par le médecin traitant.

---

### F. Portail Super-Administration (`frontend-admin`)

#### 1. Tableau de Bord Décisionnel
- Vue d'ensemble Bento Grid : nombre total de patients, consultations du mois, praticiens actifs, chiffre d'affaires global.
- Graphiques d'activité et fréquentation.

#### 2. Sécurité & Récupération du Mot de Passe Admin
- Lien **« Mot de passe oublié ? »** sur la page de connexion.
- **Méthode 1** : Saisie de l'email admin ➔ Génération d'un code de sécurité à 6 chiffres (valable 15 min) ➔ Changement sécurisé du mot de passe.
- **Méthode 2** : Utilisation de la **Clé Maître de secours** (`ADMIN-NIANG-2026`) pour réinitialiser immédiatement un compte en cas d'urgence.

#### 3. Gestion du Réseau Médical & Utilisateurs
- Création et paramétrage des hôpitaux, cliniques, pharmacies et laboratoires.
- Création des utilisateurs avec affectation stricte des rôles (`ADMIN`, `MEDECIN`, `CAISSIER`, `PHARMACIEN`, `LABORANTIN`).
- Gestion des dossiers patients (recherche, modification, mise à jour des coordonnées).

---

## 🔄 4. Le Grand Scénario Test « Bout en Bout »

Pour faire une démonstration percutante à vos partenaires, suivez ce flux en direct :

```
[1. Patient sur smartphone]
  ↳ S'inscrit en choisissant son Groupe Sanguin (ex: O+) et ses Antécédents.
  ↳ Réserve une consultation avec le Dr. Amadou Niang (choix paiement sur place).
  ↳ Va dans ses RDV et teste la Reprogrammation (règle des 7 jours).
       ↓
[2. Caisse sur PC ou tablette]
  ↳ Voit le rendez-vous en attente, encaisse le montant et imprime le ticket de file.
       ↓
[3. Médecin sur PC ou smartphone]
  ↳ Voit le patient arriver dans la file d'attente avec le badge "🔄 Reprogrammé".
  ↳ Ouvre le dossier médical : vérifie les antécédents médicaux.
  ↳ Renseigne les données cliniques, prescrit une ordonnance QR et une demande d'examen.
       ↓
   ┌───────────────────────────────┴───────────────────────────────┐
   ↓                                                               ↓
[4. Caisse ➔ Laboratoire]                                     [5. Pharmacie]
   ↳ Caisse encaisse le bulletin d'examen.                        ↳ Scanne l'ordonnance QR.
   ↳ Labo prend en charge le patient (Biologie ou Imagerie).       ↳ Effectue une substitution.
   ↳ Téléverse le compte-rendu PDF.                               ↳ Édite le ticket de caisse.
   ↳ Le médecin et le patient ont le résultat en direct !         ↳ Teste aussi une vente libre.
```

---

> 💡 **Tous les systèmes sont synchronisés 24h/24 en temps réel via Supabase PostgreSQL et l'API Cloud Render.**
