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
@Table(name="users_stories")
public class UserStory extends Model {

	private static final long serialVersionUID = 1L;
	
	@Version
    public long version;
	
	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;
	
	@Column(name="is_author")
	private boolean isAuthor;
	
	@Column(name="is_owner")
	private boolean isOwner;
	
	@Column(name="rating")
	private int	rating;
	
	@Column(name="comment")
	private String comment;
	
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="user_id")
	private User user;
	
	@ManyToOne(fetch=FetchType.LAZY, cascade=CascadeType.ALL)
	@JoinColumn(name="story_id")
	private Story story;
	
	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public boolean isAuthor() {
		return isAuthor;
	}

	public void setAuthor(boolean isAuthor) {
		this.isAuthor = isAuthor;
	}

	public boolean isOwner() {
		return isOwner;
	}

	public void setOwner(boolean isOwner) {
		this.isOwner = isOwner;
	}

	public int getRating() {
		return rating;
	}

	public void setRating(int rating) {
		this.rating = rating;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
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
	
	private static Finder<Long, UserStory> finder = new Finder<Long, UserStory>(Long.class, UserStory.class);

	public static List<UserStory> fingByUserId(String userId) {
		List<UserStory> userStories = finder.where().eq("user_id", userId).findList(); 
		return userStories;
	}
	
	public static List<Long> findStoryIds(String userId){
		List<Long> storyIds = new ArrayList<Long>();
		for (UserStory userStory : UserStory.fingByUserId(userId)) {
			storyIds.add(userStory.getId());
		}
		return storyIds;
	}
	
	public static UserStory fingByUserIdAndStoryId(String userId, long storyId) {
		UserStory userStory = finder.where(Expr.and(Expr.eq("user_id", userId), Expr.eq("story_id", storyId))).findUnique(); 
		return userStory;
	}
	
	public static UserStory fingByStoryIdAndIsAuthor(long storyId, boolean isAuthor) {
		UserStory userStory = finder.where(Expr.and(Expr.eq("is_author", isAuthor), Expr.eq("story_id", storyId))).findUnique(); 
		return userStory;
	}
	
	public static UserStory fingByStoryIdAndIsOwner(long storyId, boolean isOwner) {
		UserStory userStory = finder.where(Expr.and(Expr.eq("is_owner", isOwner), Expr.eq("story_id", storyId))).findUnique(); 
		return userStory;
	}
	
	public static UserStory create(boolean isAuthor, boolean isOwner, int rating, String comment, User user, Story story) throws ModelAlreadyExistsException{
		UserStory userStory = UserStory.fingByUserIdAndStoryId(user.getId(), story.getId());
		if (userStory != null)
			throw new ModelAlreadyExistsException();
		userStory = new UserStory();
		userStory.setAuthor(isAuthor);
		userStory.setOwner(isOwner);
		userStory.setRating(rating);
		userStory.setComment(comment);
		userStory.setUser(user);
		userStory.setStory(story);
		userStory.save(DBConstants.lir_backoffice);
		return userStory;
	}
}
