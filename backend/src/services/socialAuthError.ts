/**
 * Base commune aux erreurs de vérification d'un fournisseur d'identité
 * externe (Google, Facebook...) — permet au contrôleur de mapper n'importe
 * quelle erreur de provider vers une réponse HTTP sans connaître le
 * fournisseur concerné (cf. AuthController.handleSocialAuthError).
 */
export class SocialAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "SocialAuthError";
  }
}
