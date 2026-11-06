# AutoBot — version 1.0

Tableau de bord web responsive, utilisable depuis Safari sur iPhone.

## Fonctionnalités incluses
- Connexion administrateur par mot de passe défini dans l'hébergement.
- Gestion d'un nombre variable de comptes (libellés seulement, aucun mot de passe TikTok).
- Stock partagé de commentaires prédéfinis.
- Liste manuelle de vidéos TikTok à examiner.
- Statistiques simples, historique et arrêt général.
- Interface noire et dorée adaptée au mobile.

## Limites importantes
Cette version est un tableau de bord fonctionnel, pas encore un robot connecté à TikTok.
Elle ne découvre pas automatiquement les vidéos et ne publie aucun commentaire.
Elle ne suit, ne désabonne ni ne modifie les abonnements à aucun compte.
Les intégrations futures devront utiliser les API et autorisations officiellement disponibles de TikTok. Aucun contournement des protections, quotas ou règles anti-spam n'est inclus.

## Déploiement (Render)
1. Dépose le contenu de ce dossier dans ton dépôt GitHub.
2. Sur Render, crée un **Web Service** lié au dépôt.
3. Build Command : `npm install`
4. Start Command : `npm start`
5. Ajoute une variable d'environnement `ADMIN_PASSWORD` (au moins 12 caractères, unique).
6. Pour conserver les données, configure un disque persistant et définis `DATA_DIR` sur son chemin de montage. Sans disque persistant/base de données, les données locales peuvent être perdues lors d'un redéploiement ou redémarrage.
7. Active HTTPS (fourni par Render sur le domaine Render).

## Installation iPhone
Ouvre l'adresse HTTPS du service dans Safari → bouton Partager → « Sur l'écran d'accueil ».

## À savoir
Le service doit rester hébergé pour être accessible quand l'iPhone est éteint. Les offres gratuites peuvent mettre le service en veille et ne garantissent pas un fonctionnement 24/24.
