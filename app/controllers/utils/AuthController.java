package controllers.utils;

//import akka.japi.Option;
import play.Application;
import play.api.libs.json.*;
import play.mvc.*;
import scala.Option;
import scala.Some;
import securesocial.core.*;
import service.UserService;
import securesocial.core.AuthenticationMethod;
import securesocial.core.Identity;
import securesocial.core.IdentityId;
import securesocial.core.OAuth2Info;
import securesocial.core.PasswordInfo;
import securesocial.core.SocialUser;
import securesocial.core.java.BaseUserService;
import securesocial.core.java.Token;

public class AuthController extends Controller {
	
/*	public Result authenticateMobile(String providerName) {
		
		OAuth2Info oauth2Info = new OAuth2Info( request().body().asJson().toString(), null, null, null);
		IdentityProvider provider = Registry.providers().get(providerName).get();
		
		SocialUser filledUser = provider.fillProfile(
				new SocialUser(new IdentityId("", provider.id()), 
						"", 
						"", 
						"", 
						Option.apply(""), 
						Option.apply(""), 
						provider.authMethod(), 
						null, 
						Option.apply(oauth2Info), 
						null) 
				);
				
		UserService.doFind(filledUser.identityId());
			
		
		
	}*/
	
}
