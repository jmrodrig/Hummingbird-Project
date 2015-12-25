package controllers;

import models.Tosca;
import models.User;
import play.mvc.Controller;
import play.mvc.Result;
import securesocial.core.Identity;
import securesocial.core.java.SecureSocial;

import com.google.gson.Gson;

public class Users extends Controller {

	@SecureSocial.SecuredAction(ajaxCall=true)
	public static Result getLoggedInUser() {

		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		User user = User.findByIdentityId(identity.identityId());
		controllers.json.User jsonUser = controllers.json.User.getUser(user);
		String json = new Gson().toJson(jsonUser);
		return ok(json);
	}
	
	public static Result toscaUser(String email, String name, Integer age){
		
		try{
			
			Tosca tosca = Tosca.create(name, email, age);	
		}catch(Exception e){
			System.out.println(e.getMessage());
			return badRequest("User already exists");
		}
		return ok();
	}

}
