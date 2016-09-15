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
import models.utils.Constants;
import models.utils.DBConstants;
import models.exceptions.ModelAlreadyExistsException;
import models.exceptions.ModelNotFountException;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.typesafe.plugin.*;

import controllers.utils.HtmlFetcher;
import controllers.utils.FeedsFetcher;
import securesocial.core.java.SecureSocial;
import securesocial.core.Identity;
import securesocial.core.java.SecureSocial.SecuredAction;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Application extends Controller {
	private static final String REGEX_B = "(android|bb\\d+|meego).+mobile|avantgo|bada\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\\.(browser|link)|vodafone|wap|windows ce|xda|xiino";
	private static final String REGEX_V = "1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\\-(n|u)|c55\\/|capi|ccwa|cdm\\-|cell|chtm|cldc|cmd\\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\\-s|devi|dica|dmob|do(c|p)o|ds(12|\\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\\-|_)|g1 u|g560|gene|gf\\-5|g\\-mo|go(\\.w|od)|gr(ad|un)|haie|hcit|hd\\-(m|p|t)|hei\\-|hi(pt|ta)|hp( i|ip)|hs\\-c|ht(c(\\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\\-(20|go|ma)|i230|iac( |\\-|\\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\\/)|klon|kpt |kwc\\-|kyo(c|k)|le(no|xi)|lg( g|\\/(k|l|u)|50|54|\\-[a-w])|libw|lynx|m1\\-w|m3ga|m50\\/|ma(te|ui|xo)|mc(01|21|ca)|m\\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\\-2|po(ck|rt|se)|prox|psio|pt\\-g|qa\\-a|qc(07|12|21|32|60|\\-[2-7]|i\\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\\-|oo|p\\-)|sdk\\/|se(c(\\-|0|1)|47|mc|nd|ri)|sgh\\-|shar|sie(\\-|m)|sk\\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\\-|v\\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\\-|tdg\\-|tel(i|m)|tim\\-|t\\-mo|to(pl|sh)|ts(70|m\\-|m3|m5)|tx\\-9|up(\\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\\-|your|zeto|zte\\-";

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
		String userAgent = request().getHeader("User-Agent").toLowerCase();
		Pattern reg_b = Pattern.compile(REGEX_B,Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);
		Pattern reg_v = Pattern.compile(REGEX_V,Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);
		System.out.println("USER_AGENT: " + userAgent);
		System.out.println("reg_b.matcher(userAgent).find(): " + reg_b.matcher(userAgent).find());
		System.out.println("reg_v.matcher(userAgent).find(): " + reg_v.matcher(userAgent).find());
		if (reg_b.matcher(userAgent).find() || reg_v.matcher(userAgent.substring(0,4)).find())
			return ok(views.html.indexmobile.render());
		else
			return ok(views.html.index.render(null,null,false));
	}

	public static Result dashboards() {
		return ok(views.html.dashboard.dashboard.render());
	}

	@SecureSocial.UserAwareAction
	public static Result readStory(Long storyId) {
		models.Story story = models.Story.findById(storyId);
		if (story == null) return badRequest("Invalid story id.");
		story.incrementNOViews();
		User currentuser = getCurrentUser();
		controllers.json.Story jsonStory = controllers.json.Story.getStory(story, currentuser, false);
		String jsonLocation;
		if (jsonStory.location != null)
			jsonLocation = new Gson().toJson(jsonStory.location);
		else
			jsonLocation = "";
		String userAgent = request().getHeader("User-Agent").toLowerCase();
		Pattern reg_b = Pattern.compile(REGEX_B,Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);
		Pattern reg_v = Pattern.compile(REGEX_V,Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);
		if (reg_b.matcher(userAgent).find() || reg_v.matcher(userAgent.substring(0,4)).find())
			return ok(views.html.readmobile.render(jsonStory,jsonLocation));
		else
			return ok(views.html.index.render(jsonStory,jsonStory.location,false));
	}

	public static Result readTriggered(Long storyId) {
		models.Story story = models.Story.findById(storyId);
		if (story == null) return badRequest("Invalid story id.");
		story.incrementNOViews();
		JsonObject json = new JsonObject();
    json.addProperty("noOfViews", story.getNOViews());
		String json_ = new Gson().toJson(json);
		return ok(json_);
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

	@SecureSocial.SecuredAction
	public static Result createStory() throws ModelAlreadyExistsException, IOException, ModelNotFountException {
		User user = getCurrentUser();
		models.Story story = models.Story.create(user,Constants.STORY_FORMAT_OPEN);
		System.out.println("redirecting...");
		return redirect("/story/edit/" + story.getId());
	}

	@SecureSocial.SecuredAction
	public static Result createStoryWithData(Integer format) throws ModelAlreadyExistsException, IOException, ModelNotFountException {
		User user = getCurrentUser();
		models.Story story = models.Story.create(user,format);
		if (request().body().asJson() != null) {
			controllers.json.Story request = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Story.class);
			story = models.Story.update( story.getId(),
													request.title,
													request.summary,
													request.content,
													request.thumbnail,
													request.published,
													request.locations,
													request.labels,
													request.format);
		}
		controllers.json.Story jsonStory = controllers.json.Story.getStory(story, user, false);
		String json = new Gson().toJson(jsonStory);
		return ok(json);
	}

	@SecureSocial.SecuredAction
	public static Result editStory(Long storyId)  throws ModelAlreadyExistsException, IOException, ModelNotFountException {
		//TODO: validate if user has priviliges to edit the story
		User currentuser = getCurrentUser();
		Story story = Story.findById(storyId);
		if (story == null) return badRequest("Invalid story id.");
		controllers.json.Story jsonStory = controllers.json.Story.getStory(story,currentuser,false);
		String jsonLocation;
		if (jsonStory.location != null)
			jsonLocation = new Gson().toJson(jsonStory.location);
		else
			jsonLocation = "";
		if (story.getFormat() == Constants.STORY_FORMAT_OPEN)
			return ok(views.html.create.render(jsonStory,jsonLocation));
		else if (story.getFormat() == Constants.STORY_FORMAT_SINGLE)
			return ok(views.html.index.render(jsonStory,jsonStory.location,true));
		return badRequest("No format specified.");
	}

	// public static Result readStory(Long storyid) {
	// 	String userAgent = request().getHeader("User-Agent");
	// 	Story story = Story.findById(storyid);
	// 	if (story == null) return badRequest("Invalid story id.");
	// 	controllers.json.Story jsonStory = controllers.json.Story.getStory(story,currentuser,false);
	// 	return ok(views.html.readmobile.render(jsonStory,jsonLocation));
	// }

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

	public static Result getHighlightedItems() {
		List<controllers.json.Story> result = new ArrayList<controllers.json.Story>();
		List<HighlightedItem> hitems = HighlightedItem.findAll();
		for (HighlightedItem item : hitems) {
			controllers.json.Story jsonStory;
			Story story = Story.findById(item.getItemId());
			jsonStory = controllers.json.Story.getStory(story, false);
			result.add(jsonStory);
		}
		String json = new Gson().toJson(result);
		return ok(json);
	}

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
			String[] tags = tag.replace("@","").split("&",2);
			controllers.json.Location location = new controllers.json.Location();
			try {
				location.latitude = Double.parseDouble(tags[0].split(",",3)[0]);;
				location.longitude = Double.parseDouble(tags[0].split(",",3)[1]);
				if ( Double.isNaN(location.longitude*location.latitude) )
					throw new NumberFormatException();
				location.zoom = Double.parseDouble(tags[0].split(",",3)[2]);
				location.name = tags[1].replace("addr=","");
				return ok(views.html.index.render(null,location,false));
			} catch (NumberFormatException e) {
				return ok(views.html.index.render(null,null,false));
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
