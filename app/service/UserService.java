package service;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import models.User;
import models.exceptions.ModelAlreadyExistsException;
import play.Application;
import play.Logger;
import scala.Option;
import scala.Some;
import securesocial.core.AuthenticationMethod;
import securesocial.core.Identity;
import securesocial.core.IdentityId;
import securesocial.core.PasswordInfo;
import securesocial.core.SocialUser;
import securesocial.core.java.BaseUserService;
import securesocial.core.java.Token;

public class UserService extends BaseUserService {

	private HashMap<String, Token> tokens = new HashMap<String, Token>();

	public UserService(Application application) {
		super(application);
	}

	@Override
	public Identity doSave(Identity identity) {
		if (Logger.isDebugEnabled()) {
            Logger.debug("save...");
            Logger.debug(String.format("user = %s", identity));
        }
		User localUser = User.findByIdentityId(identity.identityId());
		if (localUser == null){
			try {
				String firstName = null;
				String lastName = null;
				String email = null;
				String avatarUrl = null;
				String passwordInfo = null;
				try{
					firstName = identity.firstName();
					lastName = identity.lastName();
				} catch(Exception e){
					Logger.error(e.getMessage());
				}
				try{
					email = identity.email().get();
				} catch(Exception e){
					Logger.error(e.getMessage());
				}
				try{
					passwordInfo = identity.passwordInfo().get().password();
				} catch(Exception e){
					Logger.error(e.getMessage());
				}
				try{
					avatarUrl = identity.avatarUrl().get();
				} catch(Exception e){
					Logger.error(e.getMessage());
				}				
				localUser = User.create(
						identity.identityId().userId(), 
						identity.identityId().providerId(), 
						firstName, 
						lastName, 
						identity.fullName(),
						email,
						avatarUrl,
						passwordInfo);
			} catch (ModelAlreadyExistsException e) {
				e.printStackTrace();
				return null;
			}
			
		}else{
			localUser.update(identity);
		}
		return identity;
	}

	@Override
	public void doSave(Token token) {
		tokens.put(token.uuid, token);
	}

	@Override
	public Identity doFind(IdentityId identityId) {
		User user = User.findByIdentityId(identityId);
		if (user == null)
			return null;
		return getSocialUser(user);
	}

	@Override
	public Token doFindToken(String tokenId) {
		return tokens.get(tokenId);
	}

	@Override
	public Identity doFindByEmailAndProvider(String email, String providerId) {
		User user = User.findByEmailAndProvider(email, providerId);
		if (user == null)
			return null;
		return getSocialUser(user);
	}

	@Override
	public void doDeleteToken(String uuid) {
		tokens.remove(uuid);
	}

	@Override
	public void doDeleteExpiredTokens() {
		Iterator<Map.Entry<String, Token>> iterator = tokens.entrySet().iterator();
		while (iterator.hasNext()) {
			Map.Entry<String, Token> entry = iterator.next();
			if (entry.getValue().isExpired()) {
				iterator.remove();
			}
		}
	}
	
	private static SocialUser getSocialUser(User user){
		return new SocialUser(new IdentityId(user.getId(), user.getProvider()), 
				user.getFirstName(), 
				user.getLastName(), 
				user.getFullName(), 
				Option.apply(user.getEmail()), 
				Option.apply(user.getAvatarUrl()), 
				new AuthenticationMethod("userpass"), 
				null, 
				null, 
				Some.apply(new PasswordInfo("bcrypt", user.getPassword(), null))); 
	}

}
