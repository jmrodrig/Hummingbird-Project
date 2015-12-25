package controllers;

import java.io.IOException;
import org.w3c.dom.Document;

import play.mvc.Controller;
import play.mvc.Result;
import models.User;
import models.Story;

import com.google.gson.Gson;
import com.typesafe.plugin.*;

import controllers.utils.HtmlFetcher;
import controllers.utils.FeedsFetcher;
import securesocial.core.java.SecureSocial;
import securesocial.core.java.SecureSocial.SecuredAction;

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

		String json = new Gson().toJson(fetcher.grabMetadataFromHtml(html,url));
		return ok(json);
	}

	public static Result index() {
		return ok(views.html.index.render());
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

	@SecureSocial.SecuredAction
	public static Result library() {
		return ok(views.html.library.render());
	}

	@SecuredAction
	public static Result profile() {
		return ok(views.html.profile.render());
	}

	@SecuredAction
	public static Result create(Long storyId) {
		return ok(views.html.create.render(storyId));
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
}
