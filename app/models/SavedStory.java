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
import models.utils.DBConstants;
import play.db.ebean.Model;

import com.avaje.ebean.Expr;

@Entity
@Table(name="savedstories")
public class SavedStory extends Model {

	private static final long serialVersionUID = 1L;

	@Version
  public long version;

	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;

	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="user_id")
	private User user;

	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="story_id")
	private Story story;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public Story getStory() {
		return story;
	}

	public void setStory(Story story) {
		this.story = story;
	}

	private static Finder<Long, SavedStory> finder = new Finder<Long, SavedStory>(Long.class, SavedStory.class);

	public static List<SavedStory> findByUserId(String userId) {
		List<SavedStory> savedstories = finder.where().eq("user_id", userId).findList();
		return savedstories;
	}

	public static List<SavedStory> findByStoryId(long storyId) {
		List<SavedStory> savedstories = finder.where().eq("story_id", storyId).findList();
		return savedstories;
	}

	public static List<Long> findStoryIdsByUser(String userId){
		List<Long> storyIds = new ArrayList<Long>();
		for (SavedStory savedstory : SavedStory.findByUserId(userId)) {
			storyIds.add(savedstory.getStory().getId());
		}
		return storyIds;
	}

	public static SavedStory findByUserIdAndStoryId(String userId, long storyId) {
		SavedStory savedstory = finder.where(Expr.and(Expr.eq("user_id", userId), Expr.eq("story_id", storyId))).findUnique();
		return savedstory;
	}

	public static SavedStory create(User user, Story story) throws ModelAlreadyExistsException{
		SavedStory savedstory = SavedStory.findByUserIdAndStoryId(user.getId(), story.getId());
		if (savedstory != null)
			throw new ModelAlreadyExistsException();
		savedstory = new SavedStory();
		savedstory.setUser(user);
		savedstory.setStory(story);
		savedstory.save(DBConstants.lir_backoffice);
		return savedstory;
	}

	public static void delete(SavedStory savedstory) {
		savedstory.delete(DBConstants.lir_backoffice);
	}
}
