package controllers.json;

import java.util.ArrayList;
import java.util.List;

public class StoryCollection {

	public Long id;
	public String name;
	public String description;
	public Integer noStories;
	public Integer noFollowers;
	public String imageUrl;
	public List<User> authors;
	public List<User> followers;

	public static StoryCollection getStoryCollection(models.StoryCollection storyCollection) {
		StoryCollection sc = new StoryCollection();
		sc.id = storyCollection.getId();
		sc.name = storyCollection.getName();
		sc.description = storyCollection.getDescription();
		sc.imageUrl = storyCollection.getImageUrl();
		sc.noStories = storyCollection.getStories().size();
		sc.noFollowers = 0;
		sc.authors = getUsers(storyCollection);
		return sc;
	}

	private static List<User> getUsers(models.StoryCollection storyCollection) {
		List<User> users = new ArrayList<controllers.json.User>();
		for (models.User user : storyCollection.getUsers()) {
			users.add(User.getUser(user,false));
		}
		return users;
	}
}
