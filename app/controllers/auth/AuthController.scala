package controllers.auth

import play.api.libs.json.Json
import play.api.mvc._
import securesocial.core._

class AuthController extends Controller {
  private implicit val readsOAuth2Info = Json.reads[OAuth2Info]
  // Some of the below code is taken from ProviderController in SecureSocial
  def authenticateMobile(providerName: String) = Action(parse.json) { implicit request =>
    // format: { "accessToken": "..." }
    val oauth2Info = request.body.asOpt[OAuth2Info]
    val provider = Registry.providers.get(providerName).get
    val filledUser = provider.fillProfile(
      SocialUser(IdentityId("", provider.id), "", "", "", None, None, provider.authMethod, oAuth2Info = oauth2Info))
    UserService.find(filledUser.identityId) map { user =>
      val newSession = Events.fire(new LoginEvent(user)).getOrElse(session)
      Authenticator.create(user).fold(
        error => throw error,
        authenticator => Ok(Json.obj("sessionId" -> authenticator.id))
          .withSession(newSession - SecureSocial.OriginalUrlKey - IdentityProvider.SessionId - OAuth1Provider.CacheKey)
          .withCookies(authenticator.toCookie)
      )
    } getOrElse NotFound(Json.obj("error" -> "user not found"))
  }
  // any other methods you might have relating to authentication ...
}
