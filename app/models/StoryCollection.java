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

import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;

import models.exceptions.ModelAlreadyExistsException;
import models.utils.DBConstants;
import play.db.ebean.Model;

import com.avaje.ebean.Expr;

@Entity
@Table(name="story_collections")
public class StoryCollection extends Model {

	private static final long serialVersionUID = 1L;

	@Version
  public long version;

	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;

	@Column(name = "name")
	private String name;

	@Column(name = "date")
	private String date;

	@Column(name = "description")
	private String description;

	@Column(name = "imageUrl")
	private String imageUrl;

	@ManyToMany(fetch=FetchType.LAZY, mappedBy="storyCollections")
	private List<User> users;

	@ManyToMany(fetch=FetchType.LAZY, mappedBy="storyCollections")
	private List<Story> stories;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String url) {
		this.imageUrl = url;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public List<User> getUsers() {
		return users;
	}

	public void setUsers(List<User> users) {
		this.users = users;
	}

	public List<Story> getStories() {
		return stories;
	}

	public void setStories(List<Story> stories) {
		this.stories = stories;
	}

	public void addStoryToCollection(Story story){
		this.stories.add(story);
		this.save();
	}

	public void removeStoryFromCollection(Story story){
		this.stories.remove(story);
		this.save();
	}

	public void addUserToCollection(User user){
		this.users.add(user);
		this.save();
	}

	public void removeUserFromCollection(User user){
		this.users.remove(user);
		this.save();
	}

	private static Finder<Long, StoryCollection> finder = new Finder<Long, StoryCollection>(Long.class, StoryCollection.class);

	public static StoryCollection findCollectionById(Long id) {
			StoryCollection storyCollection = finder.where().eq("id", id).findUnique();
			return storyCollection;
	}

	public static StoryCollection create(User user, String name) {
		StoryCollection storyCollection = new StoryCollection();
		storyCollection.addUserToCollection(user);
		storyCollection.setName(name);
		storyCollection.save(DBConstants.lir_backoffice);
		return storyCollection;
	}

	public static void delete(StoryCollection storyCollection) {
		storyCollection.delete(DBConstants.lir_backoffice);
	}
}
