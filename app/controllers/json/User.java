package controllers.json;

import java.util.ArrayList;
import java.util.List;

public class User {

	public String id;
	public Long numberId;
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
	public List<StoryCollection> userFollowingCollections;
	public Boolean publicprofile;


	public static User getUser(models.User domainUser, Boolean fetchAll) {
		User user = new User();
		//user.id = domainUser.getId();
		user.numberId = domainUser.getNumberId();
		user.fullName = domainUser.getFullName();
		user.avatarUrl = domainUser.getAvatarUrl();
		user.noOfSaved = models.SavedStory.findByUserId(domainUser.getId()).size();
		user.noOfStories = models.UserStory.findByUserId(domainUser.getId()).size();
		user.noOfFollowers = domainUser.getFollowers().size();
		user.noOfFollowing = domainUser.getFollowingUsers().size();
		if (fetchAll)
			user.storyCollections = getStoryCollections(domainUser);
			user.userFollowingCollections = getUserFollowingCollections(domainUser);
			user.email = domainUser.getEmail();
			user.firstName = domainUser.getFirstName();
			user.lastName = domainUser.getLastName();
		return user;
	}

	public static List<StoryCollection> getStoryCollections(models.User domainUser) {
		List<StoryCollection> storyCollectionList = new ArrayList<StoryCollection>();
		for (models.StoryCollection sc : domainUser.getStoryCollections()) {
			storyCollectionList.add(StoryCollection.getStoryCollection(sc,true));
		}
		return storyCollectionList;
	}

	public static List<StoryCollection> getUserFollowingCollections(models.User domainUser) {
		List<StoryCollection> list = new ArrayList<StoryCollection>();
		for (models.StoryCollection sc : domainUser.getFollowingCollections()) {
			list.add(StoryCollection.getStoryCollection(sc,true));
		}
		return list;
	}
}
