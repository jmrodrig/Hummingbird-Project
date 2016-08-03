package controllers;

import java.io.IOException;
import java.lang.NumberFormatException;
import org.w3c.dom.Document;

import play.mvc.Controller;
import play.mvc.Result;
import models.User;
import models.Story;
import models.StoryCollection;
import models.HighlightedItem;
import models.exceptions.ModelAlreadyExistsException;
import models.exceptions.ModelNotFountException;

import com.google.gson.Gson;
import com.typesafe.plugin.*;

import controllers.utils.HtmlFetcher;
import controllers.utils.FeedsFetcher;
import securesocial.core.java.SecureSocial;
import securesocial.core.Identity;
import securesocial.core.java.SecureSocial.SecuredAction;

import java.util.ArrayList;
import java.util.List;

public class Application extends Controller {

	public static Result testAjax(){
		return ok(views.html.testajax.render(""));
	}

	@SecureSocial.SecuredAction
	public static Result fetchHtml(){
		String url = request().body().asJson().get("url").textValue();
		String html;

		HtmlFetcher fetcher = new HtmlFetcher();

		try {
			html = fetcher.fetch(url);
		} catch (Exception e) {
			e.printStackTrace();
			return badRequest("exception");
		}

		if (html.equals(""))
			return badRequest("bad url");

		String json = new Gson().toJson(fetcher.grabMetadataFromHtml(html,url));
		return ok(json);
	}

	public static Result index() {
		return ok(views.html.index.render(null,null));
	}

	public static Result dashboards() {
		return ok(views.html.dashboard.dashboard.render());
	}

	public static Result read(Long storyId) {
		models.Story story = models.Story.findById(storyId);
		return ok(views.html.read.render(story));
	}

	public static Result scraper() {
		return ok(views.html.scraper.render());
	}

	public static Result story(Long storyId) {
		models.Story story = models.Story.findById(storyId);
		controllers.json.Story jsonStory = controllers.json.Story.getStory(story, false);
		return ok(views.html.story.render(jsonStory));
	}

	@SecureSocial.SecuredAction
	public static Result library() {
		return ok(views.html.library.render());
	}

	@SecureSocial.SecuredAction
	public static Result profile() {
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		User user = User.findByIdentityId(identity.identityId());
		controllers.json.User jsonUser = controllers.json.User.getUser(user,false);
		return ok(views.html.profile.render(jsonUser));
	}

	@SecureSocial.SecuredAction
	public static Result publicProfile(Long userNumberId) {
		User user = User.findByUserNumberId(userNumberId);
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		User currentuser = User.findByIdentityId(identity.identityId());
		if (currentuser.equals(user)) {
			controllers.json.User jsonUser = controllers.json.User.getUser(user,false);
			return ok(views.html.profile.render(jsonUser));
		}
		controllers.json.User jsonUser = controllers.json.User.getUser(user,false);
		return ok(views.html.publicprofile.render(jsonUser));
	}

	public static Result openCollectionView(Long collectionId) {
		StoryCollection storyCollection = StoryCollection.findCollectionById(collectionId);
		controllers.json.StoryCollection jsonCollection = controllers.json.StoryCollection.getStoryCollection(storyCollection,false);
		return ok(views.html.collection.render(jsonCollection));
	}

	@SecureSocial.SecuredAction
	public static Result createStory() throws ModelAlreadyExistsException, IOException, ModelNotFountException {
		User user = getCurrentUser();
		models.Story story = models.Story.create(user);
		System.out.println("redirecting...");
		return redirect("/publisher/create/" + story.getId());
	}

	@SecureSocial.SecuredAction
	public static Result createStoryMobile() throws ModelAlreadyExistsException, IOException, ModelNotFountException {
		User user = getCurrentUser();
		controllers.json.Story jsonStory;
		models.Story story;
		try {
			jsonStory = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Story.class);
			story = models.Story.create(user,
																	jsonStory.title,
																	jsonStory.summary,
																	jsonStory.content,
																	jsonStory.published,
																	jsonStory.locations,
																	jsonStory.labels);
		} catch (IOException e) {
			story = models.Story.create(user);
		}

		jsonStory = controllers.json.Story.getStory(story, user, false);
		String json = new Gson().toJson(jsonStory);
		return ok(json);
	}

	@SecuredAction
	public static Result editStory(Long storyId) {
		//TODO: validate if user has priviliges to edit the story
		Story story = Story.findById(storyId);
		controllers.json.Story jsonStory = controllers.json.Story.getStory(story,false);
		return ok(views.html.create.render(jsonStory));
	}

	public static Result validInvite(String invitationCode) {
		if (invitationCode.equals("ilovelostinreality")) {
			return ok();
		}
		else {
			return badRequest("Invalid invitation code.");
		}
	}

	public static Result sendNotification(Long storyId) {
		//User user = getCorrentUser();

		models.Story story = models.Story.findById(storyId);
		if (story == null) {
			return badRequest("Invalid story id");
		}

		MailerAPI mail = play.Play.application().plugin(MailerPlugin.class).email();
		//mail.setSubject("Story Publication Notification: storyId: " + story.getId() + "from " + user.getFullName() + "<" + user.getEmail() + ">");
		mail.setSubject("Story Publication Notification: storyId: " + story.getId() );
		mail.setRecipient( "Lir Publisher" , "jose.neves.rodrigues@gmail.com");
		mail.setFrom("Lost in Reality Service");
		//adds attachment
		//mail.addAttachment("attachment.pdf", new File("/some/path/attachment.pdf"));
		//adds inline attachment from byte array
		//byte[] data = "data".getBytes();
		//mail.addAttachment("data.txt", data, "text/plain", "A simple file", EmailAttachment.INLINE);
		//sends html
		//mail.sendHtml("<html>html</html>" );
		//sends text/text
		//mail.send( "Story Publication Notification: storyId: " + storyId + "from " + user.getFullName() + "<" + user.getEmail() + ">" );
		//sends both text and html
		//mail.send( "text", "<html>html</html>");

		System.out.println("email sent");

		return ok();
	}

	@SecuredAction
	public static Result highlightItem(Long itemId, Integer type) throws ModelAlreadyExistsException {
		HighlightedItem.create(itemId,type);
		return ok();
	}

	// public static Result getHighlightedItems() {
	// 	List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();
	// 	List<HighlightedItem> hitems = HighlightedItem.findAll();
	// 	for (HighlightedItem item : hitems) {
	// 		controllers.json.Story jsonStory;
	// 		if (item.getType() == 0) {
	// 			Story story = Story.findById(item.getItemId());
	// 			jsonStory = controllers.json.Story.getStory(story, false);
	// 		} else {
	// 			StoryCollection collection = StoryCollection.findCollectionById(item.getItemId());
	// 			jsonStory = controllers.json.Story.getCollectionAsStory(collection);
	// 		}
	// 		result.add(jsonStory);
	// 	}
	// 	String json = new Gson().toJson(result);
	// 	return ok(json);
	// }

	@SecuredAction
	public static Result findLabelsStartingWith(String value) {
		List<String> result = new ArrayList<String>();
		List<models.Label> labels = models.Label.findByStartingWith(value);
		for (models.Label label : labels) {
			result.add(label.getName());
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

	public static Result handleTagsIndex(String tag) {
		if (tag.contains("story")) {
			Long storyId = Long.parseLong(tag.split("storyid=",2)[1]);
			Story story = Story.findById(storyId);
			controllers.json.Story jsonStory = controllers.json.Story.getStory(story, false);
			return ok(views.html.index.render(jsonStory,jsonStory.location));
		} else {
			String[] tags = tag.replace("@","").split("&",2);
			controllers.json.Location location = new controllers.json.Location();
			try {
				location.latitude = Double.parseDouble(tags[0].split(",",3)[0]);;
				location.longitude = Double.parseDouble(tags[0].split(",",3)[1]);
				if ( Double.isNaN(location.longitude*location.latitude) )
					throw new NumberFormatException();
				location.zoom = Double.parseDouble(tags[0].split(",",3)[2]);
				location.name = tags[1].replace("addr=","");
				return ok(views.html.index.render(null,location));
			} catch (NumberFormatException e) {
				return ok(views.html.index.render(null,null));
			}
		}
	}

	private static User getCurrentUser() {
		Identity identity = (Identity) ctx().args.get(SecureSocial.USER_KEY);
		if (identity==null) {
			return null;
		}
		User user = User.findByIdentityId(identity.identityId());
		return user;
	}
}
