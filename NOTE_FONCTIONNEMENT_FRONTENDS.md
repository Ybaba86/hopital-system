# 📋 GUIDE COMPLET D'UTILISATION DE A À Z : SUITE HOSPITALIÈRE MEDIFLOW

Ce guide de référence détaille le fonctionnement intégral, les règles de gestion, les identifiants d'accès unifiés et les parcours utilisateurs pas à pas pour l'ensemble des 6 interfaces de la plateforme hospitalière **MediFlow**.

---

## 🔑 RÈGLE GÉNÉRALE D'AUTHENTIFICATION
> ⭐️ **IMPORTANT : Tous les comptes utilisateurs (Administrateurs, Médecins, Caissiers, Pharmaciens, Laborantins, Patients) ont désormais le même mot de passe unifié : `123`**

---

## 🗺️ 1. Matrice des Rôles, Liens d'Accès & Comptes Officiels

| Interface & Lien Vercel | Rôle & Utilité Principale | Identifiant de Connexion | Mot de passe |
| :--- | :--- | :--- | :--- |
| **📱 Portail Patient**<br>[hopital-patient.vercel.app](https://hopital-patient.vercel.app/login) | Inscription, Prise de RDV, Reprogrammation gratuite (7j), Paiement en ligne ou sur place, Carnet médical, Reçus PDF | `traore@gmail.com`<br>`baba@gmail.com`<br>`jean.dupont@example.com`<br>`sali@gmail.com` | **`123`** |
| **👨‍⚕️ Portail Médecin**<br>[hopital-medecin.vercel.app](https://hopital-medecin.vercel.app/login) | File d'attente, Consultation clinique, Saisie Âge (obligatoire), Poids/Taille, Attestation obligatoire des antécédents, Prescriptions QR | `medecin@niang.com`<br>`dr.sow@hopital.com` | **`123`** |
| **💳 Portail Caisse**<br>[hopital-caisse.vercel.app](https://hopital-caisse.vercel.app/login) | Validation et confirmation obligatoire des paiements en ligne, Encaissement sur place, Tickets d'appel, Clôture de caisse | `caissier@niang.com`<br>`caissier@hopital.com` | **`123`** |
| **💊 Portail Pharmacie**<br>[hopital-pharmacie.vercel.app](https://hopital-pharmacie.vercel.app/login) | Scanner d'ordonnance (QR / ID / URL), Délivrance avec substitution autorisée, Vente libre au comptoir, Gestion de stock | `pharmacien@niang.com` | **`123`** |
| **🔬 Portail Laboratoire**<br>[hopital-laborantin.vercel.app](https://hopital-laborantin.vercel.app/login) | Bulletins d'analyse biologiques, Imageries médicales (Radio, Scanner, Écho), Téléversement résultats PDF en temps réel | `laborantin@niang.com` | **`123`** |
| **⚙️ Super-Administration**<br>[hopital-admin.vercel.app](https://hopital-admin.vercel.app/admin/login) | Gestion globale, Hôpitaux, Utilisateurs, Statistiques financières, Récupération de mot de passe (Code OTP / Clé Maître) | `admin@niang.com`<br>`admin@gmail.com` | **`123`** |

*Clé Maître d'urgence Super-Admin :* `ADMIN-NIANG-2026`

---

## 📱 2. Installation Smartphone (Mode Application PWA)

Tous les frontends sont **100% responsives et adaptés aux mobiles** sans passer par les stores payants :
- **Android (Chrome)** : Menu `⋮` (3 points en haut à droite) ➔ **« Ajouter à l'écran d'accueil »** (ou « Installer l'application »).
- **iPhone (Safari)** : Bouton Partager (carré avec flèche vers le haut) ➔ **« Sur l'écran d'accueil »**.
- **Résultat** : L'icône se place sur l'écran d'accueil et s'ouvre en **plein écran natif** (sans barre d'adresse de navigateur).

---

## 🏥 3. Guide Détaillé par Interface (De A à Z)

### A. Portail Patient (`frontend-patient`)

#### 1. Inscription & Dossier Médical
- **Groupe Sanguin obligatoire** : Choix dans la liste déroulante (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
- **Antécédents Familiaux** : Saisie des pathologies héréditaires (diabète, drépanocytose, hypertension, allergies).
- **Identifiant Unique** : Attribution automatique du numéro de dossier permanent (`PAT-2026XXXX`).
- **Mot de passe par défaut** : `123`.

#### 2. Prise de Rendez-vous
- Sélection de l'hôpital, de la spécialité médicale et du médecin disponible.
- Type de visite :
  - **Présentiel** à l'hôpital.
  - **Consultation VIP à Domicile** (avec saisie de l'adresse du domicile).
- **Mode de paiement au choix** :
  - **Sur place** : Le patient règle lors de son arrivée à la caisse de l'hôpital.
  - **En ligne** : Règlement instantané (*Wave*, *Orange Money*, *Carte Bancaire*).

#### 3. Règle Métier : Confirmation Caisse des Paiements en Ligne
- Tout paiement en ligne effectué par le patient passe sous le statut **« En attente de confirmation caisse »**.
- Le patient n'est admis dans la file d'attente du médecin que **dès que l'agent de caisse valide et confirme la réception des fonds**.

#### 4. Gestion de la Reprogrammation (Règle Métier des 7 Jours)
- Si le patient ne s'est pas présenté ou souhaite changer sa date :
  - **Moins de 7 jours après la date prévue** : La reprogrammation est **totalement gratuite**. Le système affiche un compteur dynamique (*« Valable encore X j / 7j »*). Le patient sélectionne un nouveau créneau disponible (les créneaux passés ou occupés sont grisés).
  - **Plus de 7 jours** : La reprogrammation gratuite est verrouillée. Un badge rouge *« Délai 7j expiré »* invite le patient à effectuer un **nouveau paiement**.

#### 5. Carnet Numérique & Reçus
- Consultation de l'historique médical et des ordonnances avec QR Code interactif.
- Téléchargement des résultats d'analyses biologiques et imageries dès transmission par le laboratoire.
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

#### 3. Déroulement de la Consultation & Verrous de Sécurité
- **Renseignement Patient** :
  - **Âge (Obligatoire)** : Champ requis pour adapter la posologie et les antécédents.
  - **Poids (kg)** : Optionnel mais recommandé.
  - **Taille (cm)** : Optionnelle.
- **Verrou de Sécurité Médicale (Attestation obligatoire)** :
  - Une case à cocher obligatoire est affichée :
    > ☑️ **« J'atteste avoir vérifié les antécédents et contre-indications du patient pour cette prescription »**
  - **Règle stricte** : Si le médecin ne coche pas cette case, le bouton **« Terminer la consultation » reste grisé et inactif**.
- **Traitements Médicaux (Prescription)** : Prescription avec posologie, durée et génération automatique du QR Code sécurisé pour la pharmacie.
- **Demande d'Examen Médical** : Prescription d'analyses biologiques ou d'actes d'imageries transmise instantanément au laboratoire et à la caisse.

---

### C. Portail Caisse & Facturation (`frontend-caisse`)

#### 1. Validation & Confirmation des Paiements en Ligne
- Section dédiée aux **Paiements en Ligne en attente**.
- La caisse vérifie la transaction Wave, Orange Money ou Carte :
  - **Bouton « Confirmer le paiement »** : Génère automatiquement le ticket officiel de file d'attente et envoie le patient chez le médecin.
  - **Bouton « Rejeter »** : En cas d'échec ou d'annulation bancaire.

#### 2. Encaissement des Consultations sur Place
- Tableau des paiements en attente (RDV avec choix paiement au guichet).
- Encaissement par *Espèces*, *Wave*, *Orange Money*, *Carte* ou *Prise en charge assurance*.
- Émission automatique du **ticket de file d'attente** imprimable avec numéro d'appel.

#### 3. Encaissement des Examens de Laboratoire & Imageries
- Lecture du code du bulletin d'examen émis par le médecin.
- Encaissement de la prestation : le patient est basculé immédiatement dans la file d'attente du laboratoire.

#### 4. Clôture de Caisse & Statistiques
- Suivi du chiffre d'affaires journalier ventilé par mode de paiement.
- Exportation des états de caisse officiels en PDF.

---

### D. Portail Pharmacie (`frontend-pharmacie`)

#### 1. Délivrance sur Ordonnance
- **Recherche universelle** :
  - Par scan de la douchette du code-barres / QR Code.
  - Par saisie directe du code QR (ex: `9b9fa3c2-ead3-4dcd-8640-b2d2b09dad0e`).
  - Par saisie de l'ID d'ordonnance UUID (ex: `57597b28-637e-4b1e-95e5-a3f1faa71154`).
  - Par scan d'une URL complète (ex: `http://.../qr/...`).
- Affichage immédiat du patient, du médecin prescripteur, de la date et des posologies.

#### 2. Autorisation de Substitution Médicale
- En cas de rupture d'un médicament ou pour proposer un générique équivalent :
  - Le pharmacien clique sur **« Substituer »**.
  - Sélection du médicament de remplacement dans le catalogue en stock.
  - Le système trace le médicament original prescrit et décrémente le produit de substitution.

#### 3. Vente Libre Sans Ordonnance
- Espace vente directe au comptoir avec recherche par code-barres produit ou saisie textuelle.
- Saisie facultative des coordonnées du client.
- Édition et réimpression instantanée du ticket de caisse / reçu de vente avec numéro unique.

#### 4. Gestion des Stocks
- Suivi des niveaux de stock avec alerte rouge pour les produits en seuil critique (< 20 unités).
- Réapprovisionnement et mise à jour des prix unitaires.

---

### E. Portail Laboratoire & Imagerie (`frontend-laborantin`)

#### 1. File d'Attente du Laboratoire
- Liste des patients ayant validé le paiement de leurs examens à la caisse.

#### 2. Prise en Charge par Bulletin d'Analyse
- Scan ou saisie du code du **Bulletin d’Analyse**.
- Lecture de la **Demande d’Examen Médical** rédigée par le praticien.
- Tri automatique par catégorie :
  - 🔬 **Analyses Biologiques** (NFS, Glycémie, Bilan lipidique, Sérologie, etc.).
  - 🩻 **Imageries Médicales** (Radiographie, Échographie, Scanner, IRM, etc.).

#### 3. Téléversement & Transmission des Résultats
- Upload du compte-rendu ou cliché au format PDF.
- Saisie de notes complémentaires ou valeurs observées.
- **Transmission instantanée** : Le résultat est rattaché au dossier du patient et immédiatement consultable par le médecin traitant et le patient.

---

### F. Portail Super-Administration (`frontend-admin`)

#### 1. Tableau de Bord Décisionnel
- Vue d'ensemble Bento Grid : nombre total de patients, consultations du mois, praticiens actifs, chiffre d'affaires global.
- Graphiques d'activité et fréquentation.

#### 2. Sécurité & Récupération du Mot de Passe Admin
- Lien **« Mot de passe oublié ? »** sur la page de connexion.
- **Méthode 1 (Code OTP)** : Saisie de l'email admin ➔ Génération d'un code de sécurité à 6 chiffres (valable 15 min) ➔ Changement sécurisé du mot de passe.
- **Méthode 2 (Clé Maître)** : Utilisation de la **Clé Maître de secours** (`ADMIN-NIANG-2026`) pour réinitialiser immédiatement un compte en cas d'urgence.

#### 3. Gestion du Réseau Médical & Utilisateurs
- Création et paramétrage des hôpitaux, cliniques, pharmacies et laboratoires.
- Création des utilisateurs avec affectation stricte des rôles (`ADMIN`, `MEDECIN`, `CAISSIER`, `PHARMACIEN`, `LABORANTIN`).
- Gestion des dossiers patients (recherche, modification, mise à jour des coordonnées).

---

## 🔄 4. Le Grand Scénario Test « Bout en Bout »

Pour faire une démonstration percutante à vos partenaires, suivez ce flux en direct :

```
[1. Patient sur smartphone (traore@gmail.com / 123)]
  ↳ S'inscrit ou se connecte.
  ↳ Réserve une consultation avec le Dr. Amadou Niang.
  ↳ Choix du paiement : en ligne ou sur place.
       ↓
[2. Caisse sur PC ou tablette (caissier@niang.com / 123)]
  ↳ Si paiement en ligne : clique sur "Confirmer le paiement".
  ↳ Si paiement sur place : encaisse le montant et imprime le ticket de file.
       ↓
[3. Médecin sur PC ou smartphone (medecin@niang.com / 123)]
  ↳ Voit le patient arriver dans la file d'attente (badge "🔄 Reprogrammé" si applicable).
  ↳ Ouvre le dossier médical : renseigne l'Âge (obligatoire), Poids et Taille.
  ↳ Coche l'attestation obligatoire des antécédents médicaux.
  ↳ Rédige l'ordonnance (génération automatique du QR Code) et la demande d'examen.
  ↳ Clique sur "Terminer la consultation".
       ↓
   ┌───────────────────────────────┴───────────────────────────────┐
   ↓                                                               ↓
[4. Caisse ➔ Laboratoire]                                     [5. Pharmacie]
   ↳ Caisse encaisse le bulletin d'examen.                        ↳ Pharmacien (pharmacien@niang.com / 123)
   ↳ Laborantin (laborantin@niang.com / 123)                      ↳ Scanne ou saisit le code QR ou l'ID ordonnance.
     prend en charge le patient (Biologie ou Radio).              ↳ Effectue une substitution si nécessaire.
   ↳ Téléverse le compte-rendu PDF.                               ↳ Valide la vente et imprime le reçu officiel.
   ↳ Le médecin et le patient ont le résultat en direct !         ↳ Possibilité de faire aussi des ventes libres.
```

---

> 💡 **Tous les systèmes sont synchronisés 24h/24 en temps réel via Supabase PostgreSQL et l'API Cloud.**
