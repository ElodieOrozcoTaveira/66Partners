/**
 * Complète app.json avec ce qui dépend des variables d'environnement.
 *
 * Connexion Google : le plugin natif exige le « reversed client ID » iOS
 * (com.googleusercontent.apps.XXX). Il est déduit de
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ; sans cette variable, le plugin n'est
 * pas ajouté (sans options il basculerait sur une config Firebase, non
 * utilisée ici). Android n'en a pas besoin : le module est auto-lié.
 */
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googlePlugin = iosClientId
    ? [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: `com.googleusercontent.apps.${iosClientId.replace(
            /\.apps\.googleusercontent\.com$/,
            ""
          )}`,
        },
      ]
    : null;

  return {
    ...config,
    plugins: [...(config.plugins ?? []), ...(googlePlugin ? [googlePlugin] : [])],
  };
};
