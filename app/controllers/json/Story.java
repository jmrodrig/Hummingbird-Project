package controllers.json;

import com.lir.library.domain.Post;

public class Story {
	public Long id;
	public String title;
	public String summary;
	public String content;
	public Long[] postIds;
	public boolean published;
	public Location location;
	public User author;
	public String thumbnail;
	public String locationName;
	public String articleTitle;
	public String articleDescription;
	public String articleImage;
	public String articleLink;

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
		result.location = Location.getLocation(story.getLocation());
		result.thumbnail = story.getThumbnail();
		result.locationName = story.getLocationName();
		result.articleTitle = story.getArticleTitle();
		result.articleDescription = story.getArticleDescription();
		result.articleImage = story.getArticleImage();
		result.articleLink = story.getArticleLink();


		if (forceReadDomainStory || story.isDomainStoryLoaded()){
			com.lir.library.domain.Story domainStory = story.getDomainStory();
			Long[] postIds = new Long[domainStory.getPosts().size()];
			int count = 0;
			for (Post post : domainStory.getPosts()) {
				postIds[count] = post.getId();
				count++;
			}
			result.postIds = postIds;
		}
		return result;
	}

}
