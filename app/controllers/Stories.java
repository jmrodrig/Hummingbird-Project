package controllers;

import java.io.File;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Date;
import java.util.Collections;



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

	@SecureSocial.UserAwareAction
	public static Result listPublishedStories(){
		List<models.Story> stories = models.Story.findAllByPublished();
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();
		User currentUser = getCurrentUser();
		System.out.println(currentUser);
		for (models.Story story : stories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.UserAwareAction
	public static Result listPublishedStoriesWithLocation(Double latitude, Double longitude, int index, int size){
		List<models.Story> stories = models.Story.findAllByPublishedWithLocation(latitude,longitude);
		List<controllers.json.Story> jsonstories = new ArrayList<controllers.json.Story>();
		User currentUser = getCurrentUser();

		for (models.Story story : stories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			jsonstories.add(jsonStory);
		}

		System.out.println("jsonstories size : " + jsonstories.size());

		//sort by distance
		Collections.sort(jsonstories, controllers.json.Story.StoryDistanceComparator);
		//remove repeated instances
		jsonstories = removeRepeatedItems(jsonstories);
		System.out.println("After remove repeated size : " + jsonstories.size());
		// sort by descending likes (most popular stories first)
		Collections.sort(jsonstories, controllers.json.Story.StoryLikesComparator);


		if (jsonstories.size() > index+size) {
			jsonstories = jsonstories.subList(index,index+size);
		} else if (jsonstories.size() > index) {
			jsonstories = jsonstories.subList(index,jsonstories.size());
		}

		jsonstories = distributeByDistanceBins(jsonstories);

		System.out.println("After distribute in bins size : " + jsonstories.size());
		String json = new Gson().toJson(jsonstories);
		return ok(json);
	}

	public static List<controllers.json.Story> distributeByDistanceBins(List<controllers.json.Story> stories) {
		// distance bins
		Double[] fibonacciNumbers = {1.0, 2.0, 3.0, 5.0, 8.0, 13.0, 21.0, 34.0, 55.0, 89.0, 144.0, 233.0, 377.0, 610.0, 987.0, 1597.0};
		List<List<controllers.json.Story>> rangeBinList = new ArrayList<List<controllers.json.Story>>();

		// dummy story as bin header
		for (int i = 0; i < fibonacciNumbers.length; i++) {
			List<controllers.json.Story> rangebin = new ArrayList<controllers.json.Story>();
			controllers.json.Story dummystory = new controllers.json.Story();
			dummystory.isDummy = true;
			dummystory.distance = fibonacciNumbers[i] * 1000;
			rangebin.add(dummystory);
			rangeBinList.add(rangebin);
		}

		Integer count;
		Double rangemaxdistance;
		for (controllers.json.Story story : stories) {
			if (story.distance > -1) {
				count = 0;
				rangemaxdistance = fibonacciNumbers[count] * 1000;
				while (story.distance >= rangemaxdistance && count < fibonacciNumbers.length) {
					rangemaxdistance = fibonacciNumbers[count] * 1000;
					++count;
				}
				rangeBinList.get(count).add(story);
			};
		}

		// join all bins in one list
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();
		for (List<controllers.json.Story> rangebin : rangeBinList) {
			rangebin.get(0).noStories = rangebin.size()-1;
			result.addAll(rangebin);
		}
		return result;
	}

	public static List<controllers.json.Story> removeRepeatedItems(List<controllers.json.Story> list){
		List<controllers.json.Story> newlist = new ArrayList<controllers.json.Story>();
		for (controllers.json.Story s : list) {
			if (!isStoryContainedInList(s,newlist))
				newlist.add(s);
		}
		return newlist;
	}

	public static Boolean isStoryContainedInList(controllers.json.Story st, List<controllers.json.Story> list){
		for (controllers.json.Story s : list) {
			if (s.id.equals(st.id))
				return true;
		}
		return false;
	}

	@SecureSocial.UserAwareAction
	public static Result listPublishedStoriesWithinBounds(Double w, Double n, Double e, Double s){
		List<models.Story> stories = models.Story.findPublicStoriesWithinBounds(w, n, e, s);
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();
		User currentUser = getCurrentUser();

		for (models.Story story : stories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}

		// sort by descending id (most recent story)
		Collections.sort(result);
		// sort by descending likes (most popular stories first)
		Collections.sort(result, controllers.json.Story.StoryLikesComparator);
		if (result.size() > 26)
			result = result.subList(0,25);

		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.UserAwareAction
	public static Result listPublishedStoriesWithinBoundsFromFollowingUsers(Double w, Double n, Double e, Double s){
		List<models.Story> stories = models.Story.findPublicStoriesWithinBounds(w, n, e, s);
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();
		User currentUser = getCurrentUser();
		List<User> followingUsers = currentUser.getFollowingUsers();
		followingUsers.add(currentUser);

		for (models.Story story : stories) {
			for (models.User user : followingUsers) {
				if (story.storyIsOwnedByUser(user)) {
					controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
					result.add(jsonStory);
				}
			}
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result listCurrentUserStories() {
		User currentUser = getCurrentUser();
		List<models.Story> userstories = models.Story.findAllUserStories(currentUser);
		List<models.Story> savedstories = models.Story.findAllUserSavedStories(currentUser);
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();

		for (models.Story story : userstories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			result.add(jsonStory);
		}

		controllers.json.Story dummystory = new controllers.json.Story();
		dummystory.isDummy = true;
		result.add(dummystory);

		for (models.Story story : savedstories) {
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

	// @SecureSocial.SecuredAction
	// public static Result createStory() throws ModelAlreadyExistsException, IOException, ModelNotFountException {
	//
	// 	controllers.json.Story jsonStory = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Story.class);
	//
	// 	if (jsonStory.title == null || jsonStory.title.length() == 0){
	// 		jsonStory.title = "Untitled Story";
	// 	}
	//
	// 	User user = getCurrentUser();
	// 	Story domainStory = new Story();
	//
	// 	models.Story story = models.Story.create(user,
	// 										jsonStory.title,
	// 										jsonStory.summary,
	// 										jsonStory.content,
	// 										0.0,
	// 										jsonStory.published,
	// 										null,
	// 										jsonStory.locationName,
	// 										jsonStory.articleTitle,
	// 										jsonStory.articleDescription,
	// 										jsonStory.articleImage,
	// 										jsonStory.articleLink,
	// 										jsonStory.articleDate,
	// 										jsonStory.articleSource,
	// 										jsonStory.articleAuthor,
	// 										jsonStory.articleLanguage,
	// 										jsonStory.location,
	// 										jsonStory.labels);
	//
	// 	jsonStory = controllers.json.Story.getStory(story, user, true);
	// 	String json = new Gson().toJson(jsonStory);
	// 	return ok(json);
	// }

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
		models.User user = getCurrentUser();
		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}
		controllers.json.Story jsonStory = controllers.json.Story.getStory(story, user, true);
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

	@SecureSocial.SecuredAction
	public static Result updateStory(Long storyId) throws IOException, ModelNotFountException {

		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}

		controllers.json.Story jsonStory = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Story.class);

		story = models.Story.update( storyId,
												jsonStory.title,
												jsonStory.summary,
												jsonStory.content,
												jsonStory.published,
												jsonStory.locations,
												jsonStory.labels);

		jsonStory = controllers.json.Story.getStory(story, false);
		String json = new Gson().toJson(jsonStory);

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

	private static User getCurrentUser() {
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		if (identity==null) {
			return null;
		}
		User user = User.findByIdentityId(identity.identityId());
		return user;
	}

	// @SecureSocial.SecuredAction
	// @BodyParser.Of(value = BodyParser.Json.class, maxLength = 10 * 1024 * 1024)
	// public static Result uploadThumbnail(Long storyId) throws IOException {
	// 	String json = "";
	// 	String filename = "";
	// 	String filePath = "";
	//
	// 	models.Story story = models.Story.findById(storyId);
	// 	if (story == null) {
	// 		return badRequest("Invalid story id");
	// 	}
	//
	// 	controllers.json.UriImage uriImage = new Gson().fromJson(request().body().asJson().toString(), controllers.json.UriImage.class);
	//
	// 	//filename = story.getId() + "_v" + FileUtils.getCurrentTimeStamp() + "." + uriImage.ext;
	// 	filename = story.getId() + "." + uriImage.ext;
	//
	// 	//filePath = C:\Users\Ze\LIR\webmaker\code\lir + /private/upload + /thumbnails/ + file.ext
	// 	filePath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/thumbnails/" + filename;
	//
	// 	System.out.println(Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/thumbnails/" + filename);
	//
	// 	byte[] data = Base64.decodeBase64(uriImage.data.getBytes());
	//
	// 	try (OutputStream stream = new FileOutputStream(filePath)) {
	// 		stream.write(data);
	// 	} catch(Exception e) {
	// 		return badRequest("Could not create image file");
	// 	}
	//
	// 	story.setThumbnail("/uploads/thumbnails/" + filename);
	// 	story.save(DBConstants.lir_backoffice);
	//
	// 	json = new Gson().toJson("/uploads/thumbnails/" + filename);
	//
	// 	return ok(json);
	//
	// }

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

				JsonObject json = new JsonObject();

		    json.addProperty("storyId", storyId);
		    json.addProperty("imageUrl", "/uploads/images/" + imageName);

				String json_ = new Gson().toJson(json);

				return ok(json_);

			} else {
				flash("error", "Missing file");
				return redirect(routes.Application.index());
			}
		}
		return badRequest("Missing file");
	}

	@SecureSocial.SecuredAction
	public static Result uploadThumbnail(Long storyId) throws IOException {

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
				String imageName = "thumbnail_story_" + storyId + "_" + time + "." + fileextension;


				//String fileSrc = "images/";

				String uploadPath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/images/";

				File uploadDir  = new File(uploadPath);

				if (!uploadDir.exists()) {
					uploadDir.mkdirs();
				}

				File uploadFile = new File(uploadDir, imageName);

				System.out.println(uploadPath + imageName);

				imageFile.renameTo(uploadFile);

				story.setThumbnail("/uploads/images/" + imageName);
				story.save(DBConstants.lir_backoffice);

				JsonObject json = new JsonObject();

		    json.addProperty("storyId", storyId);
		    json.addProperty("imageUrl", "/uploads/images/" + imageName);

				String json_ = new Gson().toJson(json);

				return ok(json_);

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

		json.addProperty("storyId", storyId);
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
		collection.setPublished(0);
		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(collection,false);
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

		jsonCollection = controllers.json.StoryCollection.getStoryCollection(collection,false);
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result addStoryToCollection(Long collectionId, Long storyId) throws ModelAlreadyExistsException, IOException, ModelNotFountException {
		//TODO: only allow owner and a selected group of users, with premission of the owner, to add and remove stories
		User currentUser = getCurrentUser();
		models.Story story = models.Story.findById(storyId);

		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		storyCollection.addStoryToCollection(story);

		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(storyCollection,false);
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result removeStoryFromCollection(Long collectionId, Long storyId) throws ModelAlreadyExistsException, IOException, ModelNotFountException {
		//TODO: only allow owner and a selected group of users, with premission of the owner, to add and remove stories
		User currentUser = getCurrentUser();
		models.Story story = models.Story.findById(storyId);
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);

		// Remove connections
		Long nextStoryId = storyCollection.getNextStoryId(storyId);
		Long previousStoryId = storyCollection.getPreviousStoryId(storyId);
		if (nextStoryId > 0)
			storyCollection.setPreviousStoryId(nextStoryId,null);
		if (previousStoryId > 0)
			storyCollection.setNextStoryId(previousStoryId,null);

		// Remove story from collection
		storyCollection.removeStoryFromCollection(story);

		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(storyCollection,false);
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	@SecureSocial.UserAwareAction
	public static Result readCollection(Long collectionId) throws IOException {
		User currentUser = getCurrentUser();
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(storyCollection,false);
		if (currentUser != null && storyCollection.userFollowsCollection(currentUser))
			jsonCollection.currentUserFollows = true;
		String json = new Gson().toJson(jsonCollection);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result publishCollection(Long collectionId, Integer publish) throws IOException {
		User currentUser = getCurrentUser();
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		if (!storyCollection.userOwnsCollection(currentUser)) return badRequest("Permission denied");

		storyCollection.setPublished(publish);

		List<models.Story> collectionstories = storyCollection.getStories();
		Boolean publishStory = false;
		if (publish == 0) publishStory = false;
		else if (publish == 1) publishStory = true;
		for (models.Story story : collectionstories) {
			if(storyCollection.collectionUsersOwnStory(story)) {
				story.setPublished(publishStory);
				story.save();
			}
		}
		return ok();
	}

	@SecureSocial.SecuredAction
	public static Result readCollectionStories(Long collectionId) throws IOException {
		User currentUser = getCurrentUser();
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		List<models.Story> collectionstories = storyCollection.getStories();
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();

		for (models.Story story : collectionstories) {
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentUser, false);
			jsonStory.nextStoryId = storyCollection.getNextStoryId(story.getId());
			jsonStory.previousStoryId = storyCollection.getPreviousStoryId(story.getId());
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
			jsonStory.nextStoryId = storyCollection.getNextStoryId(story.getId());
			jsonStory.previousStoryId = storyCollection.getPreviousStoryId(story.getId());
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

	@SecureSocial.SecuredAction
	public static Result connectStories(Long collectionId, Long story1, Long story2) throws IOException, ModelNotFountException {
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		storyCollection.setNextStoryId(story1,story2);
		storyCollection.setPreviousStoryId(story2,story1);
		return ok();
	}

	@SecureSocial.SecuredAction
	public static Result disconnectStories(Long collectionId, Long story1, Long story2) throws IOException, ModelNotFountException {
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		storyCollection.setNextStoryId(story1,null);
		storyCollection.setPreviousStoryId(story2,null);
		return ok();
	}


	@SecureSocial.SecuredAction
	public static Result createStoryOnCollection(Long collectionId) throws IOException, ModelNotFountException, ModelAlreadyExistsException {
		User user = getCurrentUser();
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		controllers.json.Story jsonStory = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Story.class);
		if (jsonStory.title == null || jsonStory.title.length() == 0){
			jsonStory.title = "Untitled Story";
		}

		Story domainStory = new Story();
		domainStory.setTitle(jsonStory.title);
		if (jsonStory.summary != null){
			domainStory.setSummary(jsonStory.summary);
		}

		models.Story story = models.Story.create(user,
											jsonStory.title,
											jsonStory.summary,
											jsonStory.content,
											0.0,
											jsonStory.published,
											null,
											jsonStory.locationName,
											jsonStory.articleTitle,
											jsonStory.articleDescription,
											jsonStory.articleImage,
											jsonStory.articleLink,
											jsonStory.articleDate,
											jsonStory.articleSource,
											jsonStory.articleAuthor,
											jsonStory.articleLanguage,
											jsonStory.location,
											jsonStory.labels);

		//Add to collection
		storyCollection.addStoryToCollection(story);

		//Response
		jsonStory = controllers.json.Story.getStory(story, user, true);
		jsonStory.nextStoryId = storyCollection.getNextStoryId(story.getId());
		jsonStory.previousStoryId = storyCollection.getPreviousStoryId(story.getId());
		String json = new Gson().toJson(jsonStory);
		return ok(json);
	}
}
