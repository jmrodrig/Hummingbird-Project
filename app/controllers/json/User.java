package controllers.json;

import java.util.ArrayList;
import java.util.List;

public class User {

	public String id;
	public String firstName;
	public String lastName;
	public String fullName;
	public String email;
	public String avatarUrl;
	public Integer noOfStories;
	public Integer noOfSaved;
	public Integer noOfFollowers;
	public Integer noOfFollowing;
	public List<StoryCollection> storyCollections;


	public static User getUser(models.User domainUser, Boolean fetchAll) {
		User user = new User();
		user.id = domainUser.getId();
		user.firstName = domainUser.getFirstName();
		user.lastName = domainUser.getLastName();
		user.fullName = domainUser.getFullName();
		user.email = domainUser.getEmail();
		user.avatarUrl = domainUser.getAvatarUrl();
		if (fetchAll)
			user.storyCollections = getStoryCollections(domainUser);
		return user;
	}

	private static List<StoryCollection> getStoryCollections(models.User domainUser) {
		List<StoryCollection> storyCollectionList = new ArrayList<StoryCollection>();
		for (models.StoryCollection sc : domainUser.getStoryCollections()) {
			storyCollectionList.add(StoryCollection.getStoryCollection(sc));
		}
		return storyCollectionList;
	}
}
