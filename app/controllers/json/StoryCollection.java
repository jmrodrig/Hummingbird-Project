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
	public Integer published;
	public Boolean currentUserFollows;
	public List<User> authors;
	public List<User> followers;

	public static StoryCollection getStoryCollection(models.StoryCollection storyCollection,Boolean getsimple) {
		StoryCollection sc = new StoryCollection();
		if (getsimple) {
			sc.id = storyCollection.getId();
			sc.name = storyCollection.getName();
			sc.imageUrl = storyCollection.getImageUrl();
			return sc;
		} 
		sc.id = storyCollection.getId();
		sc.name = storyCollection.getName();
		sc.description = storyCollection.getDescription();
		sc.imageUrl = storyCollection.getImageUrl();
		sc.published = storyCollection.getPublished();
		sc.noStories = storyCollection.getStories().size();
		sc.noFollowers = storyCollection.getFollowers().size();
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
