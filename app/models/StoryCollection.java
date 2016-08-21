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
import models.exceptions.ModelNotFountException;
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

	@Column(name = "published")
	private Integer published;

	@Column(name = "description")
	private String description;

	@Column(name = "imageUrl")
	private String imageUrl;

	@ManyToMany
	@JoinTable(name = "users_story_collections", joinColumns = { @JoinColumn(name = "collection_id", referencedColumnName = "id") }, inverseJoinColumns = { @JoinColumn(name = "user_id", referencedColumnName = "id") })
	private List<User> users;

	@ManyToMany(fetch=FetchType.LAZY, mappedBy="followingCollections")
	private List<User> followers;

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

	public Integer getPublished() {
		return published;
	}

	public Boolean isPublished() {
		if (this.published != null && this.published == 1)
			return true;
		return false;
	}

	public void setPublished(Integer published) {
		this.published = published;
		this.save();
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
		return StoryStoryCollection.findStoriesByCollectionId(this.getId());
	}

	public List<User> getFollowers() {
		return followers;
	}

	public Boolean userFollowsCollection(User user) {
		for (User follower : this.followers) {
			if (follower.getId().equals(user.getId()))
				return true;
		}
		return false;
	}

	public void addStoryToCollection(Story story) throws ModelAlreadyExistsException {
		StoryStoryCollection.create(this,story);
	}

	public void removeStoryFromCollection(Story story) throws ModelNotFountException {
		StoryStoryCollection.delete(this,story);
	}

	public void addUserToCollection(User user){
		this.users.add(user);
		this.saveManyToManyAssociations("users");
	}

	public void removeUserFromCollection(User user){
		this.users.remove(user);
		this.deleteManyToManyAssociations("users");
	}

	public Boolean userOwnsCollection(User user) {

		List<User> users = this.getUsers();
		for (User u : users) {
			if (u.getId().equals(user.getId())) return true;
		}
		return false;
	}

	public Boolean collectionUsersOwnStory(Story story) {
		List<User> collectionUsers = this.getUsers();
		for (User u : users) {
			if (story.isOwnedByUser(u)) return true;
		}
		return false;
	}

	public void setPreviousStoryId(Long currentstoryId, Long previousStoryId) throws ModelNotFountException {
		StoryStoryCollection storyStoryCollection = StoryStoryCollection.findByStoryCollectionIdAndStoryId(this.getId(),currentstoryId);
		if (storyStoryCollection == null)
			throw new ModelNotFountException();
		if (previousStoryId==null)
			storyStoryCollection.setPreviousStoryId(0);
		else
			storyStoryCollection.setPreviousStoryId(previousStoryId);
	}

	public void setNextStoryId(Long currentstoryId, Long nextStoryId) throws ModelNotFountException {
		StoryStoryCollection storyStoryCollection = StoryStoryCollection.findByStoryCollectionIdAndStoryId(this.getId(),currentstoryId);
		if (storyStoryCollection == null)
			throw new ModelNotFountException();
		if (nextStoryId==null)
			storyStoryCollection.setNextStoryId(0);
		else
			storyStoryCollection.setNextStoryId(nextStoryId);
	}

	public Long getPreviousStoryId(Long currentstoryId) {
		return StoryStoryCollection.findByStoryCollectionIdAndStoryId(this.getId(),currentstoryId).getPreviousStoryId();
	}

	public Long getNextStoryId(Long currentstoryId) {
		return StoryStoryCollection.findByStoryCollectionIdAndStoryId(this.getId(),currentstoryId).getNextStoryId();
	}

	public Boolean isCollectionWithinBounds(Double w, Double n, Double e, Double s) {
		List<Story> collectionstories = this.getStories();
		for (Story story : collectionstories) {
			Location location = story.getLocation();
			if (!location.isWithinBounds(w,n,e,s))
				return false;
		}
		return true;
	}

	public Location getCollectionLocation() {
		Location location = new Location();
		List<Story> collectionstories = this.getStories();
		if (collectionstories.size() == 0)
			return location;
		Location storylocation = collectionstories.get(0).getLocation();
		Double north = storylocation.getLatitude() + storylocation.getRadius();
		Double east = storylocation.getLongitude() + storylocation.getRadius();
		Double south = storylocation.getLatitude() - storylocation.getRadius();
		Double west = storylocation.getLongitude() - storylocation.getRadius();
		Double aux = null;
		for (Story story : collectionstories) {
			storylocation = story.getLocation();
			aux = storylocation.getLatitude() + storylocation.getRadius();
			if (aux > north )
				north = aux;
			aux = storylocation.getLatitude() - storylocation.getRadius();
			if (aux < south )
				south = aux;
			aux = storylocation.getLongitude() + storylocation.getRadius();
			if (aux > east )
				east = aux;
			aux = storylocation.getLongitude() - storylocation.getRadius();
			if (aux < west )
				west = aux;
		}
		location.setLatitude(0.5 * (north + south));
		location.setLongitude(0.5 * (east + west));
		if (north - south > east - west)
			location.setRadius(0.5 * (north - south));
		else
			location.setRadius(0.5 * (east - west));

		return location;
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

	public static List<StoryCollection> findPublicCollectionsWithinBounds(Double w, Double n, Double e, Double s){
		System.out.println("Collection Location : " + w + ", " + n + ", " + e + ", " + s);
		List<StoryCollection> publishedCollections = new ArrayList<StoryCollection>();
		for (Location location : Location.findLocationsWithinBounds(w,n,e,s)) {
			Story story = location.getStory();
			if (story != null) {
				List<StoryCollection> collections = StoryStoryCollection.findCollectionsByStoryId(story.getId());
				for (StoryCollection collection : collections) {
					if (collection != null && collection.isPublished() && !publishedCollections.contains(collection) && collection.isCollectionWithinBounds(w,n,e,s)) {
						publishedCollections.add(collection);
					}
				}
			}
		}
		return publishedCollections;
	}

}
