package controllers;

import javax.persistence.OptimisticLockException;

import play.mvc.Controller;
import play.mvc.Result;

import com.google.gson.Gson;
import com.lir.library.domain.Location;
import com.lir.library.domain.Post;
import com.lir.library.domain.Story;
import com.lir.library.domain.post.transition.BaseTransition;
import com.lir.library.domain.post.transition.LocationTransition;

import controllers.json.Transition;
import flexjson.JSONSerializer;

public class Transitions extends Controller {

	public static Result listTransitions(Long storyId, Long postId) {

		Story story = models.Story.findById(storyId).getDomainStory();
		if (story == null) {
			return badRequest("Invalid story id");
		}

		Post post = story.getPost(postId);
		if (post == null) {
			return badRequest("Invalid post id");
		}

		Transition[] transitions = new Transition[post.getTransitions().size()];
		int count = 0;
		for (BaseTransition transition : post.getTransitions()) {
			Transition t = new Transition();
			t.startPostId = post.getId();
			t.endPostId = transition.getTransitionPost().getId();
			transitions[count] = t;
			count++;
		}

		String json = new JSONSerializer().exclude("*.class").deepSerialize(transitions);
		return ok(json);
	}

	public static Result createTransition(Long storyId, Long postId) {
		boolean optimisticError = false;
		String json = "";
		do {
			optimisticError = false;

			try {
				models.Story story = models.Story.findById(storyId);
				Story domainStory = story.getDomainStory();
				if (domainStory == null) {
					return badRequest("Invalid story id");
				}

				Post post = domainStory.getPost(postId);
				if (post == null) {
					return badRequest("Invalid post id");
				}

				controllers.json.Transition jsonTransition = new Gson().fromJson(request().body().asJson().toString(),
						controllers.json.Transition.class);

				for (BaseTransition t : post.getTransitions()) {
					if (t.getTransitionPost() != null && t.getTransitionPost().getId() == jsonTransition.endPostId) {
						if (t instanceof LocationTransition){
							LocationTransition lt = (LocationTransition)t;
							jsonTransition = getJsonTransition(post, lt);
							json = new Gson().toJson(jsonTransition);
							return ok(json);
						}
						return badRequest("Post already has a transition to the selected post");
					}
				}

				Post toPost = domainStory.getPost(jsonTransition.endPostId);

				LocationTransition lt = new LocationTransition();
				Location l = new Location();
				l.setLatitude(toPost.getLocation().getLatitude());
				l.setLongitude(toPost.getLocation().getLongitude());
				l.setRadius(toPost.getLocation().getRadius());
				lt.setTransitionPost(toPost);
				lt.setLocation(l);

				post.addTransition(lt);

				story.saveDomainStory();
				jsonTransition = getJsonTransition(post, lt);

				json = new Gson().toJson(jsonTransition);
			} catch (OptimisticLockException ole) {
				optimisticError = true;
			}
		} while (optimisticError);
		return ok(json);
	}

	private static controllers.json.Transition getJsonTransition(Post post, LocationTransition lt) {
		controllers.json.Transition jsonTransition;
		jsonTransition = new Transition();
		jsonTransition.id = lt.getId();
		jsonTransition.startPostId = post.getId();
		jsonTransition.endPostId = lt.getTransitionPost().getId();
		return jsonTransition;
	}

	public static Result readTransition(Long storyId, Long postId, Long transitionId) {

		Story story = models.Story.findById(storyId).getDomainStory();
		if (story == null) {
			return badRequest("Invalid story id");
		}

		Post post = story.getPost(postId);
		if (post == null) {
			return badRequest("Invalid post id");
		}

		BaseTransition transition = post.getTransition(transitionId);
		if (transition == null) {
			return badRequest("Invalid transition id");
		}
		Transition jsonTransition = getJsonTransition(post, (LocationTransition) transition);

		String json = new Gson().toJson(jsonTransition);
		return ok(json);
	}

	public static Result updateTransition(Long storyId, Long postId, Long transitionId) {
		boolean optimisticError = false;
		do {
			optimisticError = false;

			try {
				models.Story story = models.Story.findById(storyId);
				Story domainStory = story.getDomainStory();
				if (domainStory == null) {
					return badRequest("Invalid story id");
				}

				Post post = domainStory.getPost(postId);
				if (post == null) {
					return badRequest("Invalid post id");
				}

				controllers.json.Transition jsonTransition = new Gson().fromJson(request().body().asJson().toString(),
						controllers.json.Transition.class);

				LocationTransition lt = null;
				for (BaseTransition t : post.getTransitions()) {
					if (t.getTransitionPost() != null && t.getTransitionPost().getId() == jsonTransition.endPostId) {
						lt = (LocationTransition) t;
					}
				}

				if (lt == null)
					return badRequest("Post already do not have a transition to the selected post");

				Post toPost = domainStory.getPost(jsonTransition.endPostId);

				Location l = new Location();
				l.setLatitude(toPost.getLocation().getLatitude());
				l.setLongitude(toPost.getLocation().getLongitude());
				l.setRadius(toPost.getLocation().getRadius());
				lt.setTransitionPost(toPost);
				lt.setLocation(l);
				story.saveDomainStory();
			} catch (OptimisticLockException ole) {
				optimisticError = true;
			}
		} while (optimisticError);
		return ok();
	}

	public static Result deleteTransition(Long storyId, Long postId, Long transitionId) {

		models.Story story = models.Story.findById(storyId);
		Story domainStory = story.getDomainStory();
		if (domainStory == null) {
			return badRequest("Invalid story id");
		}

		Post post = domainStory.getPost(postId);
		if (post == null) {
			return badRequest("Invalid post id");
		}

		BaseTransition transition = post.getTransition(transitionId);
		if (transition == null) {
			return badRequest("Invalid transition id");
		}

		post.removeTransition(transition);
		story.saveDomainStory();
		return ok();
	}

}
