// Configuration des administrateurs
// Modifiez ces listes selon vos besoins

export const ADMIN_CONFIG = {
  // Emails autorisés pour l'accès admin
  authorizedEmails: [
    'rodrigue@zodiak.app', // Remplacez par votre email admin
    'admin@zodiak.app',
    // Ajoutez d'autres emails admin ici
  ],

  // IDs utilisateur autorisés (optionnel, pour plus de sécurité)
  authorizedUserIds: [
    // Ajoutez les UUIDs des utilisateurs admin ici si nécessaire
    // Exemple: '12345678-1234-1234-1234-123456789012'
  ],

  // Rôles autorisés (si vous utilisez un système de rôles)
  authorizedRoles: [
    'admin',
    'super_admin'
  ]
};

// Fonction utilitaire pour vérifier si un email est autorisé
export const isEmailAuthorized = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_CONFIG.authorizedEmails.includes(email.toLowerCase());
};

// Fonction utilitaire pour vérifier si un ID utilisateur est autorisé
export const isUserIdAuthorized = (userId: string): boolean => {
  if (ADMIN_CONFIG.authorizedUserIds.length === 0) return false;
  return ADMIN_CONFIG.authorizedUserIds.includes(userId);
};

// Fonction utilitaire pour vérifier si un rôle est autorisé
export const isRoleAuthorized = (role: string | null | undefined): boolean => {
  if (!role) return false;
  return ADMIN_CONFIG.authorizedRoles.includes(role);
};

// Fonction principale pour vérifier l'accès admin
export const checkAdminAccess = (
  email: string | null | undefined,
  userId: string,
  role?: string | null
): boolean => {
  return isEmailAuthorized(email) || 
         isUserIdAuthorized(userId) || 
         isRoleAuthorized(role);
}; 