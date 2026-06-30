import "dotenv/config";
/**
 * SERVICE D'AUTHENTIFICATION
 *
 * Contient toute la logique métier liée à l'authentification
 * Indépendant du protocole HTTP (réutilisable partout)
 */
export interface UserLogin {
    email: string;
    password: string;
}
export interface UserRegistration {
    pseudo: string;
    email: string;
    password: string;
    city?: string;
    bio?: string;
    avatar?: string;
}
export interface UserData {
    id: string;
    email: string;
    pseudo: string;
    city: string | null;
    bio: string | null;
    avatar: string | null;
    createdAt: Date;
}
export declare class AuthError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class AuthService {
    /**
     * Inscription d'un nouvel utilisateur
     */
    static registerUser(userData: UserRegistration): Promise<UserData>;
    /**
     * Authentification d'un utilisateur
     */
    static authenticateUser(credentials: UserLogin): Promise<UserData>;
    /**
     * Récupération des informations utilisateur par ID
     */
    static getUserById(userId: string): Promise<UserData | null>;
    /**
     * Validation d'existence d'un email
     */
    static checkEmailExists(email: string): Promise<boolean>;
    /**
     * Mise à jour du mot de passe d'un utilisateur
     */
    static updateUserPassword(userId: string, newPassword: string): Promise<void>;
}
//# sourceMappingURL=auth.services.d.ts.map