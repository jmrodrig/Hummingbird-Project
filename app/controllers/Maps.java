package controllers;

import java.util.HashMap;
import java.util.Map;

import play.mvc.Controller;
import play.mvc.Result;
import securesocial.core.java.SecureSocial.SecuredAction;

import com.lir.library.domain.Story;

public class Maps extends Controller {

	private static Map<Long, Story> stories = new HashMap<Long, Story>();

	@SecuredAction
	public static Result index() {

		return ok(views.html.maps.maps.render());
	}

//	public static Result createPost(Long storyId) {
//
//		Story story = stories.get(storyId);
//
//		PostInfo postInfo = new JSONDeserializer<PostInfo>().deserialize(request()
//				.body().asText());
//
//		Post post = new Post();
//		post.setId(story.getPosts().size() + 1);
//		post.setLocation(new Location(postInfo.marker.latitude, postInfo.marker.longitude, 5.0f));
//		story.addPost(post);
//
//		return ok();
//	}

	// public static Result newPost(Long storyId) {
	//
	// JsonNode node = request().body().asJson();
	// JsonNode storyJson = node.get("story");
	// JsonNode postJson = node.get("post");
	//
	// JsonNode locationJson = postJson.get("location");
	//
	// Post post = new Post();
	// post.setLocation(new Location(locationJson.get("jb").asDouble(),
	// locationJson.get("kb").asDouble(), 5));
	// Story story = loadStory(storyJson.getTextValue());
	// post.setId(story.getPosts().size());
	// story.addPost(post);
	//
	// ObjectNode jsonNode = Json.newObject();
	// ObjectNode postJsonNode = Json.newObject();
	// postJsonNode.put("location", locationJson);
	// postJsonNode.put("id", post.getId());
	//
	// jsonNode.put("post", postJsonNode);
	// jsonNode.put("story", saveStory(story));
	//
	// return ok(jsonNode);
	// }
	//
	// public static Result updatePost(Long storyId) {
	//
	// JsonNode node = request().body().asJson();
	// JsonNode storyJson = node.get("story");
	// JsonNode postJson = node.get("post");
	//
	// JsonNode postIdJson = node.get("id");
	// JsonNode postTitleJson = node.get("title");
	//
	//
	// Story story = loadStory(storyJson.getTextValue());
	// Post post = findPost(story.getPosts(), postIdJson.asLong());
	//
	// post.setTitle(postTitleJson.getTextValue());
	//
	// ObjectNode jsonNode = Json.newObject();
	// jsonNode.put("post", postJson);
	// jsonNode.put("story", saveStory(story));
	//
	// return ok(jsonNode);
	// }

//	private static Post findPost(List<Post> posts, long id) {
//		for (Post post : posts) {
//			if (post.getId() == id) {
//				return post;
//			}
//		}
//		return null;
//	}
//
//	private static Story loadStory(String jsonNode) {
//		return new JSONDeserializer<Story>().deserialize(jsonNode.toString());
//	}
//
//	private static String saveStory(Story story) {
//		return new JSONSerializer().deepSerialize(story);
//	}
}
