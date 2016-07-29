package models;

import java.io.File;
import java.io.IOException;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.Version;

import org.h2.server.web.DbContents;

import models.exceptions.ModelAlreadyExistsException;
import models.exceptions.ModelNotFountException;
import models.utils.Constants;
import models.utils.DBConstants;
import models.utils.FileUtils;
import play.api.Play;
import play.db.ebean.Model;
import utils.StringUtils;

import com.avaje.ebean.Expr;
import com.lir.library.domain.Post;
import com.lir.library.domain.factory.InternalStorageStoryFactory;
import com.lir.library.domain.post.transition.BaseTransition;
import com.lir.library.domain.post.transition.LocationTransition;
import com.lir.library.tools.LirDebug;
import com.lir.library.tools.LirDebug.IDebug;

import flexjson.JSONSerializer;

@Entity
@Table(name = "stories")
public class Story extends Model {

	private static final long serialVersionUID = 1L;

	private static final Integer CURRENT_MODEL_VERSION = 2;

	private static HashMap<Long, com.lir.library.domain.Story> loadedStories = new HashMap<Long, com.lir.library.domain.Story>();

	@Version
	public Timestamp version;

	@Id
	@GeneratedValue
	@Column(name = "id")
	private long id;

	@Column(name = "title")
	private String title;

	@Column(name = "summary")
	private String summary;

	@Column(name = "content")
	private String content;

	@Column(name = "cost")
	private double cost;

	@Column(name = "published")
	private boolean published;

	@Column(name = "thumbnail")
	private String thumbnail;

	@Column(name = "location_name")
	private String locationName;

	@Column(name = "model_version")
	private Integer modelversion;

	@Column(name = "story_language")
	private String language;

	@OneToMany(mappedBy = "story", cascade = CascadeType.ALL)
	private List<UserStory> userStories;

	@OneToMany(mappedBy = "story", cascade = CascadeType.ALL)
	private List<StoryLabel> storylabels;

	@OneToMany(mappedBy = "story", cascade=CascadeType.ALL)
	private List<Like> likes;

	@OneToMany(mappedBy = "story", cascade=CascadeType.ALL)
	private List<SavedStory> savedstories;

	@Column(name = "path")
	private String path;

	@Column(name = "article_title")
	private String articleTitle;

	@Column(name = "article_description")
	private String articleDescription;

	@Column(name = "article_image")
	private String articleImage;

	@Column(name = "article_link")
	private String articleLink;

	@Column(name = "article_source")
	private String articleSource;

	@Column(name = "article_date")
	private String articleDate;

	@Column(name = "article_author")
	private String articleAuthor;

	@Column(name = "article_language")
	private String articleLanguage;

	@Transient
	private com.lir.library.domain.Story domainStory;

	@OneToMany(mappedBy = "story", cascade=CascadeType.ALL)
	private List<Location> locations;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "place_id")
	private Place place;

	@Transient
	private Double distance;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public Integer getModelVersion() {
		return modelversion;
	}

	public void setModelVersion(Integer modelversion) {
		this.modelversion = modelversion;
	}

	public Boolean isModelVersion(Integer cmodelversion) {
		if (this.getModelVersion() == cmodelversion)
			return true;
		return false;
	}

	public String getTitle() {
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
		// com.lir.library.domain.Story story = getDomainStory();
		// if (story != null)
		// 	story.setTitle(title);
	}

	public String getSummary() {
		return summary;
	}

	public void setSummary(String summary) {
		this.summary = summary;
		// com.lir.library.domain.Story story = getDomainStory();
		// if (story != null)
		// 	story.setSummary(summary);
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public double getCost() {
		return cost;
	}

	public void setCost(double cost) {
		this.cost = cost;
	}

	public List<UserStory> getUserStories() {
		return userStories;
	}

	public void setUserStories(List<UserStory> userStories) {
		this.userStories = userStories;
	}

	public Boolean storyIsOwnedByUser(User user) {
		UserStory userStory = UserStory.fingByUserIdAndStoryId(user.getId(),this.id);
		if (userStory != null)
			return true;
		return false;
	}

	public List<Like> getLikes() {
		return likes;
	}

	public void setLikes(List<Like> likes) {
		this.likes = likes;
	}

	public List<SavedStory> getSavedStories() {
		return savedstories;
	}

	public void setSavedStories(List<SavedStory> savedstories) {
		this.savedstories = savedstories;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}

	public boolean isPublished() {
		return published;
	}

	public void setPublished(boolean published) {
		this.published = published;
	}

	// public boolean isDomainStoryLoaded() {
	// 	return domainStory != null;
	// }

	public Location getLocation() {
		return locations.get(0);
	}

	public List<Location> getLocations() {
		return locations;
	}

	public void setLocations(List<controllers.json.Location> jsonLocations) {
		for (controllers.json.Location jsonLocation : jsonLocations) {
			Location location = new Location(jsonLocation,this);
			locations.add(location);
		}
	}

	public void setLocation(controllers.json.Location jsonLocation) {
		locations.add(new Location(jsonLocation, this));
	}

	public Place getPlace() {
		return place;
	}

	public void setPlace(Place p) {
		this.place = p;
	}

	public Double getDistance() {
		if (this.distance != null)
			return this.distance;
		return -1.0;
	}

	public void setDistance(Double d) {
		this.distance = d;
	}

	public List<StoryLabel> getLabels() {
		return this.storylabels;
	}

	public void setLabels(List<String> labels) {
		System.out.println("StoryId -story: " + this.getId());
		for (String labelname : labels) {
			StoryLabel.create(this,Label.create(labelname));
		}
	}

	public String getArticleTitle() { return articleTitle; }
	public String getArticleDescription() { return articleDescription; }
	public String getArticleImage() { return articleImage; }
	public String getArticleLink() { return articleLink; }
	public String getArticleDate() { return articleDate; }
	public String getArticleSource() { return articleSource; }
	public String getArticleAuthor() { return articleAuthor; }
	public String getArticleLanguage() { return articleLanguage; }

	public void setArticle(String title, String  description, String  image, String  link, String  date, String  source, String  author, String lang) {
		this.articleTitle = title;
		this.articleDescription = description;
		this.articleImage = image;
		this.articleLink = link;
		this.articleDate = date;
		this.articleSource = source;
		this.articleAuthor = author;
		this.articleLanguage = lang;
	}

	public String getThumbnail() {
		return this.thumbnail;
	}

	public void setThumbnail(String th) {
		this.thumbnail = th;
	}

	public String getLocationName() {
		return this.locationName;
	}

	public void setLocationName(String ln) {
		this.locationName = ln;
	}

	public String getLanguage() {
		return this.language;
	}

	public void setLanguage(String lang) {
		this.language = lang;
	}

	public com.lir.library.domain.Story getDomainStory() {

		loadCachedDomainStory();
		if (domainStory != null)
			domainStory.setId(this.getId());
		return domainStory;
	}

	private void loadCachedDomainStory() {
		if (loadedStories.containsKey(this.getId())) {
			domainStory = loadedStories.get(this.getId());
		} else {
			if (domainStory == null && this.path != null) {
				domainStory = Story.loadDomainStory(this.path);
			}
			cacheDomainStory();
		}
	}

	private void cacheDomainStory() {
		if (Story.loadedStories.containsKey(this.getId()))
			Story.loadedStories.remove(this.getId());
		Story.loadedStories.put(this.getId(), this.domainStory);
	}

	public void setDomainStory(com.lir.library.domain.Story domainStory) {
		this.domainStory = domainStory;
		cacheDomainStory();
		this.domainStory.setId(this.getId());
	}

	public void saveDomainStory() {
		loadCachedDomainStory();
		while (this.domainStory.isLoading() && !this.domainStory.isLoaded()) {
			try {
				Thread.sleep(100);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
		//this.updateStoryLocation();
		this.setPath(Story.saveDomainStory(this.domainStory));
		cacheDomainStory();
		this.save(DBConstants.lir_backoffice);
	}

	public static Finder<Long, Story> finder = new Finder<Long, Story>(Long.class, Story.class);
	public static JSONSerializer json = new JSONSerializer().include("id", "title", "summary", "cost", "labels.name").exclude("*");

	public static List<Story> findAllUserStories(User user) {
		List<Story> stories = finder.where().in("id", UserStory.findStoryIdsByUser(user.getId()))
																				.eq("model_version", CURRENT_MODEL_VERSION)
																				.findList();
		return stories;
	}

	public static List<Story> findAllUserSavedStories(User user) {
		List<Story> stories = finder.where().in("id", SavedStory.findStoryIdsByUser(user.getId()))
																				.eq("model_version", CURRENT_MODEL_VERSION)
																				.findList();
		return stories;
	}

	public static Story findByUserAndTitle(User user, String title) {
		Story story = finder.where().and(Expr.eq("title", title), Expr.in("id", UserStory.findStoryIdsByUser(user.getId()))).findUnique();
		return story;
	}

	public static Story findById(Long id) {
		Story story = finder.where().eq("id", id).findUnique();
		return story;
	}

	public static List<Story> findAll() {
		List<Story> stories = finder.all();
		return stories;
	}

	public static List<models.Story> findAllByPublished() {
		List<Story> stories = finder.where().eq("published", true)
																				.eq("model_version", CURRENT_MODEL_VERSION)
																				.findList();
		return stories;
	}

	public static List<models.Story> findAllByPublishedWithLocation(Double lat, Double lng) {
		List<Story> stories = new ArrayList<Story>();
		System.out.println("Location.finAll().size() : " + Location.findAll().size());
		for (Location location : Location.findAll()) {
			Story story = location.getStory();
			System.out.println("story : " + story);
			if (story != null && story.isPublished() && story.isModelVersion(CURRENT_MODEL_VERSION)) {
				Double distance = controllers.utils.Utils.distanceBetweenCoordinates(lat,lng,location.getLatitude(),location.getLongitude(),0.0,0.0);
				story.setDistance(distance);
				stories.add(story);
				System.out.println("storyId : " + story.getId());
			}
		}
		System.out.println("findAllByPublishedWithLocation result size : " + stories.size());
		return stories;
	}

	public static List<Story> findPublicStoriesWithinBounds(Double w, Double n, Double e, Double s){
		System.out.println("Location : " + w + ", " + n + ", " + e + ", " + s);
		List<Story> stories = new ArrayList<Story>();
		for (Location location : Location.findLocationsWithinBounds(w,n,e,s)) {
			Story story = location.getStory();
			if (story != null && story.isPublished() && !stories.contains(story) && story.isModelVersion(CURRENT_MODEL_VERSION)) {
				stories.add(story);
			}
		}
		return stories;
	}

	public JSONSerializer json() {
		return json;
	}

	public static Story create(User user, String title, String summary, String content, double cost, Boolean published, String filePath,
								String locationName,
								String articleTitle, String articleDescription, String articleImage, String articleLink, String articleDate, String articleSource, String articleAuthor, String articleLanguage,
								controllers.json.Location location,
								List<String> labels)
								throws ModelAlreadyExistsException, IOException, ModelNotFountException {

		Story story = Story.findByUserAndTitle(user, title); //search for a story with the same title. If found, updates that story
		if (story != null) {
			return Story.update(story.getId(), title, summary, content, cost, published, filePath, locationName,
																				articleTitle,
																				articleDescription,
																				articleImage,
																				articleLink,
																				articleDate,
																				articleSource,
																				articleAuthor,
																				articleLanguage,
																				location,
																				labels);
		}
		story = new Story();
		setStory(story,
				title,
				summary,
				content,
				cost,
				published,
				filePath,
				locationName,
				articleTitle,
				articleDescription,
				articleImage,
				articleLink,
				articleDate,
				articleSource,
				articleAuthor,
				articleLanguage,
				location);
		// System.out.println(articleLanguage + ";;" + articleAuthor + ";;" +articleSource  + ";;" + articleDate  + ";;" + articleLink + ";;" + articleImage + ";;" + articleTitle);
		story.save(DBConstants.lir_backoffice);
		UserStory.create(true, true, 0, "", user, story);
		story.setLabels(labels);
		return story;
	}

	public static Story create(User user, String title, String summary, String contentJSON, Boolean published, List<controllers.json.Location> locations, List<String> labels)
								throws ModelAlreadyExistsException, IOException, ModelNotFountException {

		Story story = new Story();
		setStory(story, title, summary, contentJSON, published,	locations);
		story.setModelVersion(CURRENT_MODEL_VERSION);
		story.save(DBConstants.lir_backoffice);
		UserStory.create(true, true, 0, "", user, story);
		story.setLabels(labels);
		return story;
	}

	public static Story create(User user)	throws ModelAlreadyExistsException, IOException, ModelNotFountException {
		Story story = new Story();
		story.setModelVersion(CURRENT_MODEL_VERSION);
		story.save(DBConstants.lir_backoffice);
		System.out.println(story.getId());
		UserStory.create(true, true, 0, "", user, story);
		return story;
	}

	public static Story update(long id, String title, String summary, String content, Double cost, Boolean published, String filePath, String locationName, String articleTitle, String articleDescription, String articleImage, String articleLink, String articleDate, String articleSource, String articleAuthor, String articleLanguage, controllers.json.Location location, List<String> labels) throws ModelNotFountException, IOException {
		Story story = Story.findById(id);
		if (story == null) {
			throw new ModelNotFountException();
		}

		setStory(story, title, summary, content, cost, published, filePath, locationName, articleTitle,
				articleDescription,
				articleImage,
				articleLink,
				articleDate,
				articleSource,
				articleAuthor,
				articleLanguage,
				location);
		story.save(DBConstants.lir_backoffice);
		story.setLabels(labels);
		return story;
	}

	public static Story update(long id, String title, String summary, String contentJSON, Boolean published, List<controllers.json.Location> locations, List<String> labels) throws ModelNotFountException, IOException {
		Story story = Story.findById(id);
		if (story == null) {
			throw new ModelNotFountException();
		}

		setStory(story, title, summary, contentJSON, published,	locations);
		story.save(DBConstants.lir_backoffice);
		story.setLabels(labels);
		return story;
	}

	private static void setStory(Story story, String title, String summary, String content, double cost, Boolean published, String filePath, String locationName, String articleTitle, String articleDescription, String articleImage, String articleLink, String articleDate, String articleSource, String articleAuthor, String articleLanguage, controllers.json.Location location) throws IOException {
		story.setTitle(title);
		story.setSummary(summary);
		story.setContent(content);
		story.setCost(cost);
		story.setPublished(published);
		story.setPath(filePath);
		story.setLocationName(locationName);
		story.setArticle(articleTitle,articleDescription,articleImage,articleLink,articleDate,articleSource,articleAuthor,articleLanguage);
		story.setLocation(location);
	}

	private static void setStory(Story story, String title, String summary, String contentJSON, Boolean published, List<controllers.json.Location> locations) throws IOException {
		story.setTitle(title);
		story.setSummary(summary);
		story.setContent(contentJSON);
		story.setPublished(published);
		story.setLocations(locations);
	}

	public static void delete(Long id) throws ModelNotFountException {
		Story story = Story.findById(id);
		if (story == null) {
			throw new ModelNotFountException();
		}
		FileUtils.deleteFile(story.getPath());
		story.delete(DBConstants.lir_backoffice);
	}

	public static com.lir.library.domain.Story loadDomainStory(String path) {
		if (path == null) {
			return null;
		}
		File storyFile = new File(Play.current().path().getAbsolutePath() + path);
		return loadDomainStory(storyFile);
	}

	public static com.lir.library.domain.Story loadDomainStory(File storyFile) {
		String uploadPath = Play.current().path().getAbsolutePath() + Constants.publicStoryPath;
		InternalStorageStoryFactory factory = new InternalStorageStoryFactory(uploadPath);

		LirDebug.setDebugger(new IDebug() {

			@Override
			public void log(String arg0, String arg1, Exception arg2) {
				System.out.println(arg0 + " " + arg1 + " " + arg2.getMessage());
			}

			@Override
			public void log(String arg0, String arg1, String arg2) {
				System.out.println(arg0 + " " + arg1 + " " + arg2);
			}

			@Override
			public void log(String arg0, String arg1) {
				System.out.println(arg0 + " " + arg1);
			}
		});

		com.lir.library.domain.Story story = factory.loadStory(storyFile, true);
		story.startLoadData();

		for (Post post : story.getPosts()) {
			for (BaseTransition transition : post.getTransitions()) {
				if (transition instanceof LocationTransition) {
					LocationTransition lt = (LocationTransition) transition;
					lt.getTransitionPost().setLocation(lt.getLocation());
				}
			}
		}

		for (Post post : story.getPosts()) {
			if (post.getLocation() == null) {
				for (BaseTransition transition : post.getTransitions()) {
					if (transition instanceof LocationTransition) {
						LocationTransition lt = (LocationTransition) transition;
						lt.getTransitionPost().setFirstPost(true);
					}
				}
			}
		}
		return story;
	}

	public static String saveDomainStory(com.lir.library.domain.Story story) {
		String uploadPath = Play.current().path().getAbsolutePath() + Constants.privateStoryPath;

		InternalStorageStoryFactory factory = new InternalStorageStoryFactory(uploadPath);
		String path = factory.saveStory(story);
		path = StringUtils.removeRemovePreString(path, Play.current().path().getAbsolutePath());
		return path;
	}

}
