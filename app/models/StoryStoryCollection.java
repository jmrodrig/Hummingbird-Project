package models;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Version;

import models.exceptions.ModelAlreadyExistsException;
import models.exceptions.ModelNotFountException;
import models.utils.DBConstants;
import play.db.ebean.Model;

import com.avaje.ebean.Expr;

@Entity
@Table(name="stories_story_collections")
public class StoryStoryCollection extends Model {

	private static final long serialVersionUID = 1L;

	@Version
  public long version;

	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;

	@Column(name="previous_story_id")
	private long	previousStoryId;

	@Column(name="next_story_id")
	private long	nextStoryId;

	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="collection_id")
	private StoryCollection storyCollection;

	@ManyToOne(fetch=FetchType.LAZY, cascade = CascadeType.ALL)
	@JoinColumn(name="story_id")
	private Story story;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public long getPreviousStoryId() {
		return previousStoryId;
	}

	public void setPreviousStoryId(long previousStoryId) {
		this.previousStoryId = previousStoryId;
		this.save();
	}

	public long getNextStoryId() {
		return nextStoryId;
	}

	public void setNextStoryId(long nextStoryId) {
		this.nextStoryId = nextStoryId;
		this.save();
	}

	public Story getStory() {
		return story;
	}

	public void setStory(Story story) {
		this.story = story;
	}

	public StoryCollection getStoryCollection() {
		return storyCollection;
	}

	public void setStoryCollection(StoryCollection storyCollection) {
		this.storyCollection = storyCollection;
	}


	private static Finder<Long, StoryStoryCollection> finder = new Finder<Long, StoryStoryCollection>(Long.class, StoryStoryCollection.class);

	public static List<StoryStoryCollection> findByCollectionId(Long storyCollectionId) {
		List<StoryStoryCollection> storyStoryCollection = finder.where().eq("collection_id", storyCollectionId).findList();
		return storyStoryCollection;
	}

	public static List<StoryCollection> findCollectionsByStoryId(Long storyId) {
		List<StoryCollection> collections = new ArrayList<StoryCollection>();
		List<StoryStoryCollection> storyStoryCollections = finder.where().eq("story_id", storyId).findList();
		for (StoryStoryCollection storyStoryCollection : storyStoryCollections) {
			collections.add(storyStoryCollection.getStoryCollection());
		}
		return collections;
	}

	public static List<Story> findStoriesByCollectionId(Long storyCollectionId){
		List<Story> stories = new ArrayList<Story>();
		for (StoryStoryCollection storyStoryCollection : StoryStoryCollection.findByCollectionId(storyCollectionId)) {
			stories.add(storyStoryCollection.getStory());
		}
		return stories;
	}

	public static StoryStoryCollection findByStoryCollectionIdAndStoryId(long storyCollectionId, long storyId) {
		StoryStoryCollection storyStoryCollection = finder.where(Expr.and(Expr.eq("collection_id", storyCollectionId), Expr.eq("story_id", storyId))).findUnique();
		return storyStoryCollection;
	}

	public static StoryStoryCollection create(StoryCollection storyCollection, Story story, Long previousStoryId, Long nextStoryId) throws ModelAlreadyExistsException{
		StoryStoryCollection storyStoryCollection = findByStoryCollectionIdAndStoryId(storyCollection.getId(),story.getId());
		if (storyStoryCollection != null)
			return storyStoryCollection;
		storyStoryCollection = new StoryStoryCollection();
		storyStoryCollection.setPreviousStoryId(previousStoryId);
		storyStoryCollection.setNextStoryId(nextStoryId);
		storyStoryCollection.setStoryCollection(storyCollection);
		storyStoryCollection.setStory(story);
		storyStoryCollection.save(DBConstants.lir_backoffice);
		return storyStoryCollection;
	}

	public static StoryStoryCollection create(StoryCollection storyCollection, Story story) throws ModelAlreadyExistsException{
		StoryStoryCollection storyStoryCollection = findByStoryCollectionIdAndStoryId(storyCollection.getId(),story.getId());
		if (storyStoryCollection != null)
			return storyStoryCollection;
		storyStoryCollection = new StoryStoryCollection();
		storyStoryCollection.setStoryCollection(storyCollection);
		storyStoryCollection.setStory(story);
		storyStoryCollection.save(DBConstants.lir_backoffice);
		return storyStoryCollection;
	}

	public static void delete(StoryCollection storyCollection, Story story) throws ModelNotFountException {
		StoryStoryCollection storyStoryCollection = findByStoryCollectionIdAndStoryId(storyCollection.getId(),story.getId());
		if (storyStoryCollection == null)
			throw new ModelNotFountException();
		storyStoryCollection.delete(DBConstants.lir_backoffice);
	}
}
