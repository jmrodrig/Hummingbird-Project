package controllers.json;
import java.util.ArrayList;
import java.util.List;
import java.util.Comparator;

import com.lir.library.domain.Post;

public class Story implements Comparable<Story> {
	public Long id;
	public String title;
	public String summary;
	public String content;
	public boolean published;
	public List<Location> locations;
	public Location location;
	public Place place;
	public User author;
	public String thumbnail;
	public String locationName;
	public Integer noOfLikes;
	public Integer noOfSaves;
	public Boolean currentUserLikesStory;
	public Boolean currentUserSavedStory;
	public String articleTitle;
	public String articleDescription;
	public String articleImage;
	public String articleLink;
	public String articleDate;
	public String articleSource;
	public String articleAuthor;
	public String articleLanguage;
	public Long nextStoryId;
	public Long previousStoryId;
	public Integer type;
	public Integer noStories;
	public Integer noUsers;
	public Integer noFollowers;
	public List<StoryCollection> collections;
	public List<String> labels;

//	public static Story getStory(com.lir.library.domain.Story story){
//		if (story == null)
//			return null;
//		Story result = new Story();
//		result.storyId = story.getId();
//		result.title = story.getTitle();
//		result.summary = story.getSummary();
//
//		Long[] postIds = new Long[story.getPosts().size()];
//		int count = 0;
//		for (Post post : story.getPosts()) {
//			postIds[count] = post.getId();
//			count++;
//		}
//		result.postIds = postIds;
//		return result;
//	}

	public static Story getStory(models.Story story, boolean forceReadDomainStory){
		if (story == null)
			return null;
		Story result = new Story();
		result.id = story.getId();
		result.title = story.getTitle();
		result.summary = story.getSummary();
		result.content = story.getContent();
		result.published = story.isPublished();
		result.thumbnail = story.getThumbnail();
		result.locationName = story.getLocationName();
		result.articleTitle = story.getArticleTitle();
		result.articleDescription = story.getArticleDescription();
		result.articleImage = story.getArticleImage();
		result.articleLink = story.getArticleLink();
		result.articleDate = story.getArticleDate();
		result.articleSource = story.getArticleSource();
		result.articleAuthor = story.getArticleAuthor();
		result.articleLanguage = story.getArticleLanguage();
		result.author = controllers.json.User.getUser(models.UserStory.fingByStoryIdAndIsAuthor(story.getId(), true).getUser(),false);
		result.noOfLikes = models.Like.findByStoryId(story.getId()).size();
		result.noOfSaves = models.SavedStory.findByStoryId(story.getId()).size();
		result.type = 0;

		// if (forceReadDomainStory || story.isDomainStoryLoaded()){
		// 	com.lir.library.domain.Story domainStory = story.getDomainStory();
		// 	Long[] postIds = new Long[domainStory.getPosts().size()];
		// 	int count = 0;
		// 	for (Post post : domainStory.getPosts()) {
		// 		postIds[count] = post.getId();
		// 		count++;
		// 	}
		// 	result.postIds = postIds;
		// }
		return result;
	}

	public static Story getStory(models.Story story, models.User currentUser, boolean forceReadDomainStory){
		if (story == null)
			return null;
		Story result = getStory(story,forceReadDomainStory);
		if (currentUser == null)
			return result;
		result.currentUserLikesStory = (models.Like.findByUserIdAndStoryId(currentUser.getId(), story.getId()) != null) ? true : false;
		result.currentUserSavedStory = (models.SavedStory.findByUserIdAndStoryId(currentUser.getId(), story.getId()) != null) ? true : false;
		return result;
	}

	// public static Story getCollectionAsStory(models.StoryCollection collection) {
	// 	if (collection == null)
	// 		return null;
	// 	Story result = new Story();
	// 	result.id = collection.getId();
	// 	result.title = collection.getName();
	// 	result.summary = collection.getDescription();
	// 	result.published = collection.isPublished();
	// 	result.location = Location.getLocation(collection.getCollectionLocation());
	// 	result.thumbnail = collection.getImageUrl();
	// 	result.noFollowers = collection.getFollowers().size();
	// 	result.noUsers = collection.getUsers().size();
	// 	result.noStories = collection.getStories().size();
	// 	result.type = 1;
	// 	return result;
	// }

	// private static List<StoryCollection> getPublicCollections(models.Story story) {
	// 	List<StoryCollection> collections = new ArrayList<controllers.json.StoryCollection>();
	// 	for (models.StoryCollection collection : models.StoryStoryCollection.findCollectionsByStoryId(story.getId())) {
	// 		if (collection.isPublished())
	// 			collections.add(StoryCollection.getStoryCollection(collection,true));
	// 	}
	// 	return collections;
	// }

  public int compareTo(Story story) {
      return (story.id).compareTo(this.id);
  }

	public static Comparator<Story> StoryLikesComparator
                          = new Comparator<Story>() {

	    public int compare(Story story1, Story story2) {
	      return (story2.noOfLikes).compareTo(story1.noOfLikes);
	    }

	};
}
