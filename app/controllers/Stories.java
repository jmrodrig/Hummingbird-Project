package controllers;

import java.io.File;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Date;



import javax.persistence.OptimisticLockException;

import models.User;
import models.UserStory;
import models.Like;
import models.SavedStory;
import models.StoryCollection;
import models.exceptions.ModelAlreadyExistsException;
import models.exceptions.ModelNotFountException;
import models.utils.Constants;
import models.utils.DBConstants;
import models.utils.FileUtils;
import play.api.Play;
import play.mvc.Controller;
import play.mvc.Http.MultipartFormData;
import play.mvc.Http.MultipartFormData.FilePart;
import play.mvc.Result;
import securesocial.core.Identity;
import securesocial.core.java.SecureSocial;
import utils.StringUtils;
import controllers.utils.Base64;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.lir.library.domain.Story;
import play.mvc.BodyParser;

public class Stories extends Controller {

	/**
	 * return the list of stories the user can edit
	 *
	 * @return
	 */

	@SecureSocial.SecuredAction
	public static Result listPublishedStories(){
		List<models.Story> stories = models.Story.findAllByPublished(true);
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();
		User currentUser = getCurrentUser();

		for (models.Story story : stories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result listCurrentUserStories() {
		User currentUser = getCurrentUser();
		List<models.Story> stories = models.Story.findAllUserStories(currentUser);
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();

		for (models.Story story : stories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result listCurrentUserSavedStories() {
		User currentUser = getCurrentUser();
		List<models.Story> savedstories = models.Story.findAllUserSavedStories(currentUser);
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();

		for (models.Story story : savedstories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result listUserStories(Long numberId) {
		User currentUser = getCurrentUser();
		User user = User.findByUserNumberId(numberId);
		List<models.Story> stories = models.Story.findAllUserStories(user);
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();

		for (models.Story story : stories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result listUserSavedStories(Long numberId) {
		User currentUser = getCurrentUser();
		User user = User.findByUserNumberId(numberId);
		List<models.Story> stories = models.Story.findAllUserSavedStories(user);
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();

		for (models.Story story : stories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result createStory() throws ModelAlreadyExistsException, IOException, ModelNotFountException {

		controllers.json.Story jsonStory = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Story.class);
		if (jsonStory.title == null || jsonStory.title.length() == 0){
			jsonStory.title = "Untitled Story";
		}

		controllers.json.Location location =  jsonStory.location;

		System.out.println(location);

		User user = getCurrentUser();
		Story domainStory = new Story();
		domainStory.setTitle(jsonStory.title);
		if (jsonStory.summary != null){
			domainStory.setSummary(jsonStory.summary);
		}
		String path = models.Story.saveDomainStory(domainStory);

		models.Story story = models.Story.create(user,
											domainStory.getTitle(),
											domainStory.getSummary(),
											jsonStory.content,
											0.0,
											path,
											jsonStory.locationName,
											jsonStory.articleTitle,
											jsonStory.articleDescription,
											jsonStory.articleImage,
											jsonStory.articleLink,
											jsonStory.articleDate,
											jsonStory.articleSource,
											jsonStory.articleAuthor,
											jsonStory.articleLanguage,
											location);

		story.setDomainStory(domainStory);

		jsonStory = controllers.json.Story.getStory(story, user, true);
		String json = new Gson().toJson(jsonStory);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result publishStory(Long storyId, Boolean published){


		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}

		// Is user the story owner?
		String storyOwner = UserStory.fingByStoryIdAndIsOwner(story.getId(), true).getUser().getId();
		String currentUserId = getCurrentUser().getId();
		if (!storyOwner.equals(currentUserId) && !currentUserId.contains("@lostinreality.net")) {
			return badRequest("Story does not belong to this user.");
		}

		story.setPublished(published);
		story.save(DBConstants.lir_backoffice);

		controllers.json.Story jsonStory = controllers.json.Story.getStory(story, false);
		jsonStory.author = controllers.json.User.getUser(UserStory.fingByStoryIdAndIsAuthor(story.getId(), true).getUser(),false);
		jsonStory.noOfLikes = Like.findByStoryId(story.getId()).size();
		jsonStory.noOfSaves = SavedStory.findByStoryId(story.getId()).size();
		String json = new Gson().toJson(jsonStory);
		return ok(json);
	}

	public static Result readStory(Long storyId) {

		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}

		controllers.json.Story jsonStory = controllers.json.Story.getStory(story, true);

		jsonStory.author = controllers.json.User.getUser(UserStory.fingByStoryIdAndIsAuthor(storyId, true).getUser(),false);

		jsonStory.noOfLikes = Like.findByStoryId(storyId).size();
		jsonStory.noOfSaves = SavedStory.findByStoryId(storyId).size();

		String json = new Gson().toJson(jsonStory);

		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result deleteStory(Long storyId) {

		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}

		// Is user the story owner?
		String storyOwner = UserStory.fingByStoryIdAndIsOwner(story.getId(), true).getUser().getId();
		String currentUserId = getCurrentUser().getId();
		if (!storyOwner.equals(currentUserId) && !currentUserId.contains("@lostinreality.net")) {
			return badRequest("Story does not belong to this user or is not published.");
		}

		story.delete(DBConstants.lir_backoffice);

		// Send a Response
		Integer noOfStories = UserStory.findByUserId(currentUserId).size();
		JsonObject json = new JsonObject();
    json.addProperty("noOfStories", noOfStories);
		String json_ = new Gson().toJson(json);

		return ok(json_);
	}

	public static Result updateStory(Long storyId) {
		boolean optimisticError = false;
		String json = "";
		do{
			optimisticError = false;

			try{
				models.Story story = models.Story.findById(storyId);
				if (story == null) {
					return badRequest("Invalid story id");
				}

				controllers.json.Story jsonStory = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Story.class);
				// controllers.json.Story jsonStory = new
				// JSONDeserializer<controllers.json.Story>().deserialize(request().body().asJson().asText());

				story.setTitle(jsonStory.title);
				story.setSummary(jsonStory.summary);
				story.setContent(jsonStory.content);
				story.setThumbnail(jsonStory.thumbnail);
				story.setLocationName(jsonStory.locationName);

				story.saveDomainStory();


				jsonStory = controllers.json.Story.getStory(story, true);
				json = new Gson().toJson(jsonStory);

			}catch(OptimisticLockException ole){
				optimisticError = true;
			}
		} while(optimisticError);
		// String json = new
		// JSONSerializer().exclude("*.class").deepSerialize(jsonStory);


		return ok(json);
	}

	public static Result downloadStory(Long storyId) throws IOException {

		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}


		String uploadPath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath;

		File file = FileUtils.storeFile(uploadPath, Play.current().path().getAbsolutePath() + story.getPath());

		String publicPath = file.getAbsolutePath().contains("\\") ? "\\private\\uploads" : "/private/uploads";
		return redirect("/uploads" + StringUtils.removeRemovePreString(file.getAbsolutePath(), Play.current().path().getAbsolutePath() + publicPath));
	}

	// @SecureSocial.SecuredAction
	// public static Result saveStory(Long storyId) throws ModelAlreadyExistsException, IOException{
	// 	User user = getCurrentUser();
	// 	models.Story story = models.Story.findById(storyId);
	// 	//TODO: Garantir que a historia é do user
	//
	// 	if (story == null) {
	// 		return badRequest("Invalid story id");
	// 	}
	// 	story.saveDomainStory();
	// 	return ok("Story saved");
	// }

	@SecureSocial.SecuredAction
	public static Result uploadStory() throws ModelAlreadyExistsException, IOException, ModelNotFountException {

		User user = getCurrentUser();
		MultipartFormData body = request().body().asMultipartFormData();
		FilePart storyFilePart = body.getFile("storyFile");
		if (storyFilePart != null) {
			File storyFile = storyFilePart.getFile();

			Story domainStory = models.Story.loadDomainStory(storyFile);

			models.Story story = models.Story.findByUserAndTitle(user, domainStory.getTitle());
			if (story == null){
				story = models.Story.create(user,
											domainStory.getTitle(),
											domainStory.getSummary(),
											"", 0.0, "", "",
											"","","","","","","","",
											null);
			}

			story.setDomainStory(domainStory);
			story.saveDomainStory();

			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, false);
			String json = new Gson().toJson(jsonStory);
			return ok(json);
		} else {
			flash("error", "Missing file");
			return redirect(routes.Application.index());
		}
	}

	private static User getCurrentUser() {
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		User user = User.findByIdentityId(identity.identityId());
		return user;
	}

	@SecureSocial.SecuredAction
	@BodyParser.Of(value = BodyParser.Json.class, maxLength = 10 * 1024 * 1024)
	public static Result uploadThumbnail(Long storyId) throws IOException {
		String json = "";
		String filename = "";
		String filePath = "";

		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}

		controllers.json.UriImage uriImage = new Gson().fromJson(request().body().asJson().toString(), controllers.json.UriImage.class);

		//filename = story.getId() + "_v" + FileUtils.getCurrentTimeStamp() + "." + uriImage.ext;
		filename = story.getId() + "." + uriImage.ext;

		//filePath = C:\Users\Ze\LIR\webmaker\code\lir + /private/upload + /thumbnails/ + file.ext
		filePath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/thumbnails/" + filename;

		System.out.println(Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/thumbnails/" + filename);

		byte[] data = Base64.decodeBase64(uriImage.data.getBytes());

		try (OutputStream stream = new FileOutputStream(filePath)) {
			stream.write(data);
		} catch(Exception e) {
			return badRequest("Could not create image file");
		}

		story.setThumbnail("/uploads/thumbnails/" + filename);
		story.save(DBConstants.lir_backoffice);

		json = new Gson().toJson("/uploads/thumbnails/" + filename);

		return ok(json);

	}

	@SecureSocial.SecuredAction
	public static Result uploadImage(Long storyId) throws IOException {

		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}

		MultipartFormData body = request().body().asMultipartFormData();
		List<FilePart> imageFileParts = body.getFiles();
		for (FilePart imageFilePart : imageFileParts) {
			if (imageFilePart != null) {
				File imageFile = imageFilePart.getFile();
				//String imageName = imageFilePart.getFilename().replace(" ","_");
				String[] filenameparts = imageFilePart.getFilename().split("\\.");
				String fileextension = filenameparts[filenameparts.length-1];

				Long time= new java.util.Date().getTime();
				String imageName = "image_story_" + storyId + "_" + time + "." + fileextension;


				//String fileSrc = "images/";

				String uploadPath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/images/";

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

				story.setThumbnail("/uploads/images/" + imageName);
				story.save(DBConstants.lir_backoffice);

				String json = new Gson().toJson("/uploads/images/" + imageName);
				return ok(json);

			} else {
				flash("error", "Missing file");
				return redirect(routes.Application.index());
			}
		}
		return badRequest("Missing file");
	}

	@SecureSocial.SecuredAction
	public static Result uploadCollectionImage(Long collectionId) throws IOException {
		models.StoryCollection collection = models.StoryCollection.findCollectionById(collectionId);
		if (collection == null) {
			return badRequest("Invalid Collection id");
		}

		MultipartFormData body = request().body().asMultipartFormData();
		List<FilePart> imageFileParts = body.getFiles();
		for (FilePart imageFilePart : imageFileParts) {
			if (imageFilePart != null) {
				File imageFile = imageFilePart.getFile();
				//String imageName = imageFilePart.getFilename().replace(" ","_");
				String[] filenameparts = imageFilePart.getFilename().split("\\.");
				String fileextension = filenameparts[filenameparts.length-1];

				Long time= new java.util.Date().getTime();
				String imageName = "image_collection_" + collectionId + "_" + time + "." + fileextension;


				//String fileSrc = "images/";

				String uploadPath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/collection_images/";

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

				collection.setImageUrl("/uploads/collection_images/" + imageName);
				collection.save(DBConstants.lir_backoffice);

				String json = new Gson().toJson("/uploads/collection_images/" + imageName);

				return ok(json);

			} else {
				flash("error", "Missing file");
				return redirect(routes.Application.index());
			}
		}
		return badRequest("Missing file");
	}

	@SecureSocial.SecuredAction
	public static Result deleteImage(Long storyId) throws IOException {
		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}
		String storyImagePath = story.getThumbnail();
		File imageFile = new File(storyImagePath);
		if (imageFile != null) {
			imageFile.delete();
		}
		story.setThumbnail("");
		story.save(DBConstants.lir_backoffice);

		String json = new Gson().toJson("");
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result likeStory(Long storyId) throws ModelAlreadyExistsException, IOException {
		User currentUser = getCurrentUser();
		models.Story story = models.Story.findById(storyId);
		Like like = Like.findByUserIdAndStoryId(currentUser.getId(), storyId);

		if (like == null) {
			Like.create(currentUser, story);
		} else {
			like.delete();
		}

	  Boolean currentUserLikesStory = (Like.findByUserIdAndStoryId(currentUser.getId(), story.getId()) != null) ? true : false;
		Integer noOfLikes = Like.findByStoryId(storyId).size();

		JsonObject json = new JsonObject();

    json.addProperty("currentUserLikesStory", currentUserLikesStory);
    json.addProperty("noOfLikes", noOfLikes);

		String json_ = new Gson().toJson(json);

		return ok(json_);
	}

	@SecureSocial.SecuredAction
	public static Result saveStory(Long storyId) throws ModelAlreadyExistsException, IOException {
		User currentUser = getCurrentUser();
		models.Story story = models.Story.findById(storyId);
		SavedStory savedstory = SavedStory.findByUserIdAndStoryId(currentUser.getId(), storyId);

		if (savedstory == null) {
			SavedStory.create(currentUser, story);
		} else {
			savedstory.delete();
		}

	  Boolean currentUserSavedStory = (SavedStory.findByUserIdAndStoryId(currentUser.getId(), story.getId()) != null) ? true : false;
		Integer noOfSaves = SavedStory.findByStoryId(storyId).size();

		JsonObject json = new JsonObject();

    json.addProperty("currentUserSavedStory", currentUserSavedStory);
    json.addProperty("noOfSaves", noOfSaves);

		String json_ = new Gson().toJson(json);

		return ok(json_);
	}

	@SecureSocial.SecuredAction
	public static Result createStoryCollection(String collectionName) throws IOException {
		User currentUser = getCurrentUser();
		StoryCollection collection;
		if (collectionName == null) {
			collection = StoryCollection.create(currentUser,"");
		} else {
			collection = StoryCollection.create(currentUser,collectionName);
		}
		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(collection);
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result updateStoryCollection(Long collectionId) throws IOException {
		User currentUser = getCurrentUser();
		controllers.json.StoryCollection jsonCollection = new Gson().fromJson(request().body().asJson().toString(), controllers.json.StoryCollection.class);
		StoryCollection collection = StoryCollection.findCollectionById(collectionId);

		collection.setName(jsonCollection.name);
		collection.setDescription(jsonCollection.description);
		collection.save(DBConstants.lir_backoffice);

		jsonCollection = controllers.json.StoryCollection.getStoryCollection(collection);
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result addStoryToCollection(Long collectionId, Long storyId) throws IOException {
		//TODO: only allow owner and a selected group of users, with premission of the owner, to add and remove stories
		User currentUser = getCurrentUser();
		models.Story story = models.Story.findById(storyId);

		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		storyCollection.addStoryToCollection(story);

		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(storyCollection);
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result removeStoryToCollection(Long collectionId, Long storyId) throws IOException {
		//TODO: only allow owner and a selected group of users, with premission of the owner, to add and remove stories
		User currentUser = getCurrentUser();
		models.Story story = models.Story.findById(storyId);

		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		storyCollection.removeStoryFromCollection(story);

		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(storyCollection);
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	public static Result readCollection(Long collectionId) throws IOException {
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(storyCollection);
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result readCollectionStories(Long collectionId) throws IOException {
		User currentUser = getCurrentUser();
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		List<models.Story> collectionstories = storyCollection.getStories();
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();

		for (models.Story story : collectionstories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	public static Result readPublicCollectionStories(Long collectionId) throws IOException {
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		List<models.Story> collectionstories = storyCollection.getStories();
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();

		for (models.Story story : collectionstories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, false);
			// jsonStory.author = controllers.json.User.getUser(UserStory.fingByStoryIdAndIsAuthor(story.getId(), true).getUser(),false);
			// jsonStory.noOfLikes = Like.findByStoryId(story.getId()).size();
			// jsonStory.noOfSaves = SavedStory.findByStoryId(story.getId()).size();
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result addUserToCollection(Long collectionId, Long numberId) throws IOException {
		//TODO: only allow owner and a selected group of users, with premission of the owner, to add and remove stories
		User user = User.findByUserNumberId(numberId);
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		storyCollection.addUserToCollection(user);
		return ok();
	}

}
