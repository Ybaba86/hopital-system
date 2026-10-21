# 📋 NOTE FONCTIONNELLE : GUIDE D'UTILISATION DES FRONTENDS (MEDIFLOW)

Ce document récapitule de manière détaillée le rôle, les fonctionnalités, les règles métier et les parcours d'utilisation pour chacun des 6 frontends de la plateforme hospitalière intégrée **MediFlow**.

---

## 🗺️ Vue d'Ensemble des Frontends & Rôles

| Frontend | Dossier | Public Cible | Identifiants Tests Typiques |
| :--- | :--- | :--- | :--- |
| **Portail Patient** | `frontend-patient` | Patients & Familles | Inscription libre ou `jean.dupont@example.com` / `1234` |
| **Espace Médecin** | `frontend-medecin` | Médecins traitants & Spécialistes | `dr.sow@hopital.com` / `1234` |
| **Officine Pharmacie** | `frontend-pharmacie` | Pharmaciens & Préparateurs | `pharmacien@hopital.com` / `1234` |
| **Laboratoire & Imagerie** | `frontend-laborantin` | Techniciens Labo, Biologistes, Radiologues | `laborantin@hopital.com` / `1234` |
| **Caisse & Facturation** | `frontend-caisse` | Caissiers & Agents d'accueil | `caissier@hopital.com` / `1234` |
| **Super-Administration** | `frontend-admin` | Direction, Directeurs Médicaux, Admins IT | `admin@monhopital.com` / `1234` |

---

## 1. 🏥 Portail Patient (`frontend-patient`)

### Public cible
Les patients souhaitant gérer leurs rendez-vous, leur carnet de santé et leurs prescriptions depuis leur ordinateur ou leur smartphone (`📱`).

### Workflow & Fonctionnalités clés

1. **Inscription avec Groupe Sanguin & Antécédents Familiaux** :
   - Sélection obligatoire du **Groupe Sanguin** dans une liste déroulante (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
   - Saisie des **Antécédents Familiaux** (ex: diabète, drépanocytose, hypertension) et allergies.
   - Génération d'un **Numéro Unique de Dossier Patient** permanent.

2. **Prise de Rendez-vous Flexible** :
   - Sélection de l'hôpital, de la spécialité médicale et du médecin.
   - Choix du type de consultation :
     - **Présentiel** à l'hôpital.
     - **Consultation VIP à Domicile** (avec saisie de l'adresse du domicile).
   - Choix de la date et sélection du créneau horaire sur une grille dynamique responsive.
   - **Choix du mode de paiement** :
     - **Paiement sur place** : réservation enregistrée, le patient règlera à la caisse de l'hôpital.
     - **Paiement en ligne** : règlement immédiat par *Wave*, *Orange Money* ou *Carte Bancaire*.

3. **Suivi & Historique Personnel** :
   - **Mes Rendez-vous** : consultation de l'état (programmé, payé, terminé, manqué), reprogrammation ou annulation.
   - **Mes Ordonnances** : consultation et téléchargement des ordonnances avec QR Code sécurisé.
   - **Mes Résultats d'Examens** : accès aux résultats d'analyses biologiques et comptes-rendus d'imageries médicales.

4. **Expérience Mobile 📱** :
   - Barre de navigation basse tactile fixe (`Bottom Navigation`) : *Accueil*, *Nouveau RDV*, *Mes RDV*, *Carnet*, *Examens*.
   - Tiroir latéral hamburger et cartes adaptées aux petits écrans tactiles.

---

## 2. 🩺 Portail Médecin (`frontend-medecin`)

### Public cible
Médecins généralistes, spécialistes, chirurgiens et praticiens hospitaliers.

### Workflow & Fonctionnalités clés

1. **File d'Attente & Accueil du Patient** :
   - Visualisation en direct des patients en salle d'attente (tickets émis par la caisse).
   - Appel du patient suivant en un clic.

2. **Consultation & Renseignement Clinique** :
   - **Renseignement Clinique (Motif de la consultation)** : recueil des symptômes, anamnèse et constantes vitales (Tension, Pouls, Température, Poids, Glycémie).
   - **Vérification Obligatoire des Antécédents** :
     - Bandeau d'alerte visuel rappelant le **Groupe Sanguin**, les **Antécédents Familiaux** et les allergies avant toute prescription médicamenteuse.
   - Saisie du diagnostic médical.

3. **Prescription & Demandes d'Examens** :
   - **Traitements Médicales (Prescription)** : sélection ou saisie des médicaments, posologies, durées de traitement. Génération automatique du QR Code ordonnance pour l'officine.
   - **Demande d'Examen Médical** : prescription d'analyses biologiques ou d'actes d'imagerie médicale transmise instantanément à la caisse et au laboratoire.

4. **Dossier Médical & Archives** :
   - Accès complet à l'historique du patient : anciennes consultations, ordonnances antérieures, résultats d'examens de laboratoire avec visualisation/téléchargement des PDF.

5. **Expérience Mobile 📱** :
   - Défilement vertical natif lors de l'ouverture du clavier virtuel sur tablette/smartphone.
   - Boutons d'actions ("Voir", "Dossier") toujours visibles sans survol souris.

---

## 3. 💊 Portail Pharmacie (`frontend-pharmacie`)

### Public cible
Pharmaciens hospitaliers et d'officines privées partenaires.

### Workflow & Fonctionnalités clés

1. **Délivrance sur Ordonnance Sécurisée** :
   - Scan du QR Code ordonnance ou saisie de l'identifiant (ex: `ORD-20261020-001`).
   - Chargement automatique du prescripteur, du patient et du contenu de la prescription.
   - **Autoriser la Substitution** :
     - En cas d'indisponibilité d'un médicament ou de proposition d'un générique équivalent, le pharmacien clique sur *« Substituer »*.
     - Le système enregistre le produit de remplacement en stock tout en traçant le nom du médicament prescrit initialement par le médecin.

2. **Vente Libre Sans Ordonnance** :
   - Onglet dédié à la vente directe au comptoir.
   - Scan direct du code-barres produit ou recherche textuelle dans le stock.
   - Saisie facultative de l'identité du client (nom, téléphone).

3. **Panier, Encaissement & Facturation** :
   - Gestion des quantités et alertes de stock insuffisant.
   - Application possible d'une remise commerciale en FCFA.
   - Règlement par *Espèces*, *Carte Bancaire*, *Wave* ou *Orange Money*.
   - Impression instantanée du ticket de caisse / reçu de délivrance.

4. **Gestion des Stocks & Rapports** :
   - Inventaire en temps réel avec alerte rouge pour stocks critiques (< 20 unités).
   - Ajout, modification et approvisionnement des références.
   - Rapports de recettes financiers (journalier, mensuel, annuel ou période personnalisée) exportables en PDF.

---

## 4. 🔬 Portail Laboratoire & Imagerie (`frontend-laborantin`)

### Public cible
Techniciens de laboratoire, biologistes médicaux, manipulateurs radio et radiologues.

### Workflow & Fonctionnalités clés

1. **File d'Attente Laboratoire** :
   - Affichage en temps réel des patients ayant réglé leurs examens à la caisse.
   - Appel prioritaire ou par ordre d'arrivée.

2. **Prise en charge par Bulletin d'Analyse** :
   - Scan du code du **Bulletin d’Analyse**.
   - Lecture de la **Demande d'Examen Médical** rédigée par le médecin.
   - **Classification de l'examen** :
     - 🔬 **Analyses Biologiques** : NFS, biochimie, sérologie, bactériologie...
     - 🩻 **Imageries Médicales** : Radiographie, Échographie, Scanner, IRM...
   - **Téléversement du résultat** :
     - Upload du compte-rendu ou cliché au format **PDF**.
     - Saisie de commentaires textuels ou valeurs mesurées.
   - **Transmission automatique** : Les résultats sont directement rattachés au dossier du patient et consultables immédiatement par le médecin traitant.

3. **Archives Médicales** :
   - Filtrage par onglets (*Tous les Examens*, *Analyses Biologiques*, *Imageries Médicales*).
   - Moteur de recherche et réimpression des comptes-rendus d'analyses.

---

## 5. 💳 Portail Caisse & Facturation (`frontend-caisse`)

### Public cible
Caissiers hospitaliers et agents de facturation / accueil.

### Workflow & Fonctionnalités clés

1. **Facturation des Consultations & Tickets de File** :
   - Visualisation des rendez-vous en attente de règlement.
   - **Règle de Renouvellement Gratuit** :
     - Si le patient a déjà consulté il y a moins de 5 jours, le système applique automatiquement la gratuité (`0 FCFA`).
   - Encaissement par *Espèces*, *Wave*, *Orange Money*, *Carte* ou *Assurance*.
   - Émission automatique du **ticket de file d'attente** imprimable avec numéro de passage.

2. **Facturation Laboratoire & Examens Médicaux** :
   - Scan du bulletin d'examen médical émis par le praticien.
   - Saisie/validation du montant de la prestation.
   - Dès encaissement, le patient est automatiquement envoyé dans la file d'attente du laboratoire.

3. **Suivi Financier & Clôture de Caisse** :
   - Tableau de bord en direct des recettes journalières et mensuelles.
   - Détail ventilé par mode de paiement.
   - Exportation de rapports de caisse officiels au format PDF.

---

## 6. ⚙️ Portail Super-Administration (`frontend-admin`)

### Public cible
Directeurs d'hôpitaux, gestionnaires de cliniques, administrateurs IT et régulateurs.

### Workflow & Fonctionnalités clés

1. **Tableau de Bord Décisionnel (Bento Grid)** :
   - Indicateurs globaux : nombre total de patients, médecins actifs, consultations, chiffre d'affaires cumulé.
   - Graphiques de fréquentation mensuelle.

2. **Gestion du Réseau d'Établissements** :
   - **Hôpitaux & Cliniques** : création d'établissements, attribution de services médicaux.
   - **Pharmacies & Laboratoires** : rattachement des officines et laboratoires partenaires.

3. **Gestion des Utilisateurs & Rôles** :
   - Création et modification des comptes avec attribution des rôles (`ADMIN`, `MEDECIN`, `PHARMACIEN`, `LABORANTIN`, `CAISSIER`).
   - Affectation de chaque utilisateur à sa structure d'exercice.

4. **Gestion des Médecins & Spécialités** :
   - Association des praticiens à leurs services médicaux (Cardiologie, Pédiatrie, Gynécologie...).

5. **Dossiers Patients & Sécurité** :
   - Moteur de recherche patient par identifiant, nom ou téléphone.
   - Consultation et mise à jour du groupe sanguin, des antécédents et coordonnées.
   - Réinitialisation sécurisée des accès patients.

---

## 🔄 Parcours Synthétique du Patient (Bout en Bout)

```
[1. Patient] 
  ↳ Inscription (Groupe sanguin + Antécédents)
  ↳ Réservation RDV (Paiement en ligne ou sur place)
      ↓
[2. Caisse] 
  ↳ Encaissement ou validation renouvellement gratuit
  ↳ Émission du ticket de file d'attente
      ↓
[3. Médecin] 
  ↳ Appel du patient via la file d'attente
  ↳ Examen clinique & consultation des antécédents
  ↳ Émission ordonnance (Traitements) et/ou bulletin (Examens)
      ↓
  ┌───────────────────────────────┴───────────────────────────────┐
  ↓                                                               ↓
[4. Laboratoire & Imagerie]                                 [5. Pharmacie]
  ↳ Encaissement à la caisse du bulletin                      ↳ Délivrance sur ordonnance
  ↳ Réalisation de l'analyse ou imagerie                      ↳ Substitution autorisée si besoin
  ↳ Upload du résultat PDF (Biologie / Imagerie)              ↳ Ou vente libre sans ordonnance
  ↳ Transmission directe au médecin traitant                  ↳ Impression ticket de caisse
```

---

> **Note Technique & Ergonomie :**
> Tous les modules disposent d'une interface adaptée aux appareils mobiles (`📱`), tablettes et ordinateurs : défilement vertical déverrouillé, boutons tactiles sans obligation de survol souris, tableaux avec défilement horizontal sécurisé et formulaires flexibles.
