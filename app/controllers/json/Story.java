package controllers.json;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.Comparator;
import play.api.Play;
import com.google.gson.Gson;
import models.utils.Constants;
import java.io.File;

import com.lir.library.domain.Post;

public class Story implements Comparable<Story> {
	public Long id;
	public String title;
	public String summary;
	public String content;
	public Integer published;
	public Place place;
	public User author;
	public String thumbnail;
	public Location location;
	public List<Location> locations;
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
	public Integer format;
	public Integer noStories;
	public Integer noUsers;
	public Integer noFollowers;
	public List<StoryCollection> collections;
	public List<String> labels;
	public Double distance;
	public Boolean isDummy;
	public Boolean userCanEdit;

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
		result.location = controllers.json.Location.getLocation(story.getLocation());
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
		result.format = story.getFormat();
		result.isDummy = false;
		result.distance = story.getDistance();
		result.userCanEdit = false;

		result.locations = new ArrayList<controllers.json.Location>();
		for (models.Location l : story.getLocations()) {
			result.locations.add(controllers.json.Location.getLocation(l));
		}

		result.checkIfPicturesAreUploadedOnServer();
		return result;
	}

	public static Story getStory(models.Story story, models.User currentUser, boolean forceReadDomainStory){
		if (story == null)
			return null;
		Story result = getStory(story,forceReadDomainStory);
		if (currentUser == null) {
			System.out.println("currentUser == null");
			return result;
		}

		result.currentUserLikesStory = (models.Like.findByUserIdAndStoryId(currentUser.getId(), story.getId()) != null) ? true : false;
		result.currentUserSavedStory = (models.SavedStory.findByUserIdAndStoryId(currentUser.getId(), story.getId()) != null) ? true : false;
		if (currentUser.getNumberId() == result.author.numberId)
			result.userCanEdit = true;
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

	public static Comparator<Story> StoryDistanceComparator
                          = new Comparator<Story>() {

	    public int compare(Story story1, Story story2) {
	      return (story2.distance).compareTo(story1.distance);
	    }

	};

	private void checkIfPicturesAreUploadedOnServer() {
		System.out.println("Story CONTENT (before checkIfPicturesAreUploadedOnServer): " + this.content);
		if (this.content == null) return;
		String uploadPath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath + "/images/";
		ContentSection[] contentarray = new Gson().fromJson(this.content, ContentSection[].class);
		List<ContentSection> content = new LinkedList<ContentSection>(Arrays.asList(contentarray));
    for (ContentSection section : content) {
        if (section.type == Constants.HEADER_SECTION && section.link != null) {
					File picturefile = new File(uploadPath + section.link);
					section.linkUploadState = picturefile.exists();
        } else {
						if (section.content != null) {
	            for (ContentItem item : section.content) {
	                if (item.type == Constants.PICTURE_CONTAINER && item.link != null) {
										File picturefile = new File(uploadPath + item.link);
										item.linkUploadState = picturefile.exists();
									}
	            }
						}
        }
    }
    this.content = new Gson().toJson(content);
		System.out.println("Story CONTENT (after checkIfPicturesAreUploadedOnServer): " + this.content);
	}

	public static class ContentSection {
		public long id;
		public int type;
		public String link;
		public Boolean linkUploadState;
		public Location location;
		public ContentItem[] content;
  }

  public static class ContentItem {
    public int type;
    public String text;
    public String link;
    public String position;
		public Boolean linkUploadState;
  }
}
