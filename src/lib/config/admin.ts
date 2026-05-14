const rawEmails = import.meta.env.VITE_ADMIN_EMAILS ?? '';
const rawUserIds = import.meta.env.VITE_ADMIN_USER_IDS ?? '';

export const ADMIN_CONFIG = {
  authorizedEmails: rawEmails
    ? rawEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [],

  authorizedUserIds: rawUserIds
    ? rawUserIds.split(',').map((id) => id.trim()).filter(Boolean)
    : [],

  authorizedRoles: ['admin', 'super_admin'],
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