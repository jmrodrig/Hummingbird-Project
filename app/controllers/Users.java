package controllers;

import models.Tosca;
import models.User;
import models.StoryCollection;
import models.UserStory;
import models.SavedStory;
import play.mvc.Controller;
import play.mvc.Result;
import securesocial.core.Identity;
import securesocial.core.java.SecureSocial;
import java.io.IOException;
import java.io.File;
import java.io.OutputStream;
import java.io.FileOutputStream;
import models.utils.DBConstants;
import play.mvc.Http.MultipartFormData;
import play.mvc.Http.MultipartFormData.FilePart;
import java.util.ArrayList;
import java.util.List;
import java.util.Date;
import play.api.Play;
import models.utils.Constants;



import com.google.gson.Gson;

public class Users extends Controller {

	private static User getCurrentUser() {
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		if (identity==null) {
			return null;
		}
		User user = User.findByIdentityId(identity.identityId());
		return user;
	}

	@SecureSocial.SecuredAction(ajaxCall=true)
	public static Result getLoggedInUser() {
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		User user = User.findByIdentityId(identity.identityId());
		controllers.json.User jsonUser = controllers.json.User.getUser(user,true);
		jsonUser.noOfSaved = SavedStory.findByUserId(user.getId()).size();
		jsonUser.noOfStories = UserStory.findByUserId(user.getId()).size();
		String json = new Gson().toJson(jsonUser);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result getUserById(String userId) {
		User user = User.findByUserId(userId);
		controllers.json.User jsonUser = controllers.json.User.getUser(user,true);
		String json = new Gson().toJson(jsonUser);
		return ok(json);
	}

	@SecureSocial.UserAwareAction
	public static Result getUserProfile(Long numberId) {
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		User currentUser = User.findByIdentityId(identity.identityId());
		User user = User.findByUserNumberId(numberId);
		controllers.json.User jsonUser = controllers.json.User.getUser(user,false);
		jsonUser.publicprofile = !(currentUser != null && currentUser.getNumberId() == user.getNumberId());
		jsonUser.storyCollections = controllers.json.User.getStoryCollections(user);
		String json = new Gson().toJson(jsonUser);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result updateUserProfile() {
		controllers.json.User jsonUser = new Gson().fromJson(request().body().asJson().toString(), controllers.json.User.class);
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		User currentuser = User.findByIdentityId(identity.identityId());

		currentuser.setFullName(jsonUser.fullName);
		currentuser.save(DBConstants.lir_backoffice);

		jsonUser = controllers.json.User.getUser(currentuser,false);
		jsonUser.storyCollections = controllers.json.User.getStoryCollections(currentuser);
		String json = new Gson().toJson(jsonUser);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result uploadUserImage() throws IOException {

		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		User currentuser = User.findByIdentityId(identity.identityId());

		MultipartFormData body = request().body().asMultipartFormData();
		List<FilePart> imageFileParts = body.getFiles();
		for (FilePart imageFilePart : imageFileParts) {
			if (imageFilePart != null) {
				File imageFile = imageFilePart.getFile();
				//String imageName = imageFilePart.getFilename().replace(" ","_");
				String[] filenameparts = imageFilePart.getFilename().split("\\.");
				String fileextension = filenameparts[filenameparts.length-1];

				Long time= new java.util.Date().getTime();
				String imageName = "image_profile_" + currentuser.getNumberId() + "_" + time + "." + fileextension;


				//String fileSrc = "images/";

				String uploadPath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/profile_images/";

				File uploadDir  = new File(uploadPath);

				//String uploadPath = Play.current().path().getAbsolutePath() + "/private/upload/";
				//File uploadDir = new File(uploadPath + fileSrc);

				if (!uploadDir.exists()) {
					uploadDir.mkdirs();
				}
				//fileSrc += imageFilePart.getFilename();
				File uploadFile = new File(uploadDir, imageName);

				System.out.println(uploadPath + imageName);

				imageFile.renameTo(uploadFile);

				currentuser.setAvatarUrl("/uploads/profile_images/" + imageName);
				currentuser.save(DBConstants.lir_backoffice);

				String json = new Gson().toJson("/uploads/profile_images/" + imageName);
				return ok(json);

			} else {
				flash("error", "Missing file");
				return redirect(routes.Application.index());
			}
		}
		return badRequest("Missing file");
	}

	@SecureSocial.SecuredAction
	public static Result findUsersByEmail(String email) {
		models.User user = models.User.findByEmail(email);
		if (user == null) {
			return badRequest("No user found");
		}
		controllers.json.User jsonUser = controllers.json.User.getUser(user,false);
		String json = new Gson().toJson(jsonUser);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result followCollection(Long collectionId, Boolean unfollow) {
		User currentuser = getCurrentUser();
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		if (unfollow)
			// storyCollection.removeFollower(currentuser);
			currentuser.removeFollowingCollection(storyCollection);
		currentuser.addFollowingCollection(storyCollection);
		return ok();
	}

	@SecureSocial.SecuredAction
	public static Result followUser(Long numberId) {
		User currentuser = getCurrentUser();
		User user = User.findByUserNumberId(numberId);
		if (currentuser.isFollowing(user))
			currentuser.removeFollowingUser(user);
		else
			currentuser.addFollowingUser(user);
		return ok();
	}

}
