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
@Table(name="likes")
public class Like extends Model {

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

	private static Finder<Long, Like> finder = new Finder<Long, Like>(Long.class, Like.class);

	public static List<Like> findByUserId(String userId) {
		List<Like> likes = finder.where().eq("user_id", userId).findList();
		return likes;
	}

	public static List<Like> findByStoryId(long storyId) {
		List<Like> likes = finder.where().eq("story_id", storyId).findList();
		return likes;
	}

	public static Like findByUserIdAndStoryId(String userId, long storyId) {
		Like like = finder.where(Expr.and(Expr.eq("user_id", userId), Expr.eq("story_id", storyId))).findUnique();
		return like;
	}

	public static Like create(User user, Story story) throws ModelAlreadyExistsException{
		Like like = Like.findByUserIdAndStoryId(user.getId(), story.getId());
		if (like != null)
			throw new ModelAlreadyExistsException();
		like = new Like();
		like.setUser(user);
		like.setStory(story);
		like.save(DBConstants.lir_backoffice);
		return like;
	}

	public static void delete(Like like) {
		like.delete(DBConstants.lir_backoffice);
	}
}
