package models;

import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Version;
import javax.persistence.ManyToOne;
import javax.persistence.ManyToMany;
import javax.persistence.JoinTable;
import javax.persistence.JoinColumn;
import javax.persistence.FetchType;



import models.exceptions.ModelAlreadyExistsException;
import models.utils.DBConstants;
import play.Logger;
import play.db.ebean.Model;
import securesocial.core.Identity;
import securesocial.core.IdentityId;

import com.avaje.ebean.Expr;
import com.avaje.ebean.Ebean;

@Entity
@Table(name = "users")
public class User extends Model {

	private static final long serialVersionUID = 1L;

	@Version
	public long version;

	@Id
	@GeneratedValue
	@Column(name = "id")
	private String id;

	@GeneratedValue
	@Column(name = "numberId")
	private Long numberId;

	@Column(name = "provider")
	private String provider;

	@Column(name = "firstName")
	private String firstName;

	@Column(name = "lastName")
	private String lastName;

	@Column(name = "fullName")
	private String fullName;

	@Column(name = "email")
	private String email;

	@Column(name="avatarUrl")
	private String avatarUrl;

	@Column(name = "password")
	private String password;

	@OneToMany(mappedBy = "user", cascade=CascadeType.ALL)
	private List<UserStory> userStories;

	@OneToMany(mappedBy = "user", cascade=CascadeType.ALL)
	private List<Like> likes;

	@OneToMany(mappedBy = "user", cascade=CascadeType.ALL)
	private List<SavedStory> savedstories;

	@OneToMany(mappedBy = "user", cascade=CascadeType.ALL)
	private List<Invitation> invitations;

	@ManyToMany(fetch=FetchType.LAZY, mappedBy="users")
	private List<StoryCollection> storyCollections;

	@ManyToMany
	@JoinTable(name = "collections_followers", joinColumns = { @JoinColumn(name = "user_id", referencedColumnName = "id") }, inverseJoinColumns = { @JoinColumn(name = "collection_id", referencedColumnName = "id") })
	private List<StoryCollection> followingCollections;

	@ManyToMany
	@JoinTable(name = "users_followers", joinColumns = { @JoinColumn(name = "user_id", referencedColumnName = "id") }, inverseJoinColumns = { @JoinColumn(name = "following_user_id", referencedColumnName = "id") })
	private List<User> followingUsers;

	@ManyToMany(fetch=FetchType.LAZY, mappedBy="followingUsers")
	private List<User> followers;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public Long getNumberId() {
		return numberId;
	}

	public void setNumberId(Long numberId) {
		this.numberId = numberId;
	}

	public String getProvider() {
		return provider;
	}

	public void setProvider(String provider) {
		this.provider = provider;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getAvatarUrl() {
		return avatarUrl;
	}

	public void setAvatarUrl(String avatarUrl) {
		this.avatarUrl = avatarUrl;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public List<Invitation> getInvitations() {
		return invitations;
	}

	public void setInvitations(List<Invitation> invitations) {
		this.invitations = invitations;
	}

	public List<UserStory> getUserStories() {
		return userStories;
	}

	public void setUserStories(List<UserStory> userStories) {
		this.userStories = userStories;
	}

	public void addUserStory(UserStory userStory){
		this.userStories.add(userStory);
		this.save();
	}

	public List<StoryCollection> getStoryCollections() {
		return storyCollections;
	}

	public void setStoryCollections(List<StoryCollection> storyCollections) {
		this.storyCollections = storyCollections;
	}

	public List<StoryCollection> getFollowingCollections() {
		return this.followingCollections;
	}

	public List<User> getFollowingUsers() {
		return this.followingUsers;
	}

	public List<User> getFollowers() {
		return this.followers;
	}

	public void addFollowingCollection(StoryCollection storyCollection) {
		this.followingCollections.add(storyCollection);
		this.saveManyToManyAssociations("followingCollections");
	}

	public void removeFollowingCollection(StoryCollection storyCollection) {
		this.followingCollections.remove(storyCollection);
		this.deleteManyToManyAssociations("followingCollections");
	}

	public void addFollowingUser(User user) {
		this.followingUsers.add(user);
		this.saveManyToManyAssociations("followingUsers");
	}

	public void removeFollowingUser(User user) {
		this.followingUsers.remove(user);
		this.deleteManyToManyAssociations("followingUsers");
	}

	private static Finder<Long, User> finder = new Finder<Long, User>(Long.class, User.class);

	public static User findByIdentityId(IdentityId identity){
		return finder.where(Expr.and(Expr.eq("id", identity.userId()), Expr.eq("provider", identity.providerId()))).findUnique();
	}

	public static User findByUserId(String userId){
		return finder.where().eq("id", userId).findUnique();
	}

	public static User findByUserNumberId(Long numberId){
		return finder.where().eq("numberId", numberId).findUnique();
	}

	public static User findByEmail(String email) {
		if (email != null) {
			User user = finder.where().eq("email", email).findUnique();
			return user;
		} else {
			return null;
		}
	}

	public static User findByEmailAndProvider(String email, String provider) {
		if (email != null) {
			User user = finder.where(Expr.and(Expr.eq("email", email), Expr.eq("provider", provider))).findUnique();
			return user;
		} else {
			return null;
		}
	}

	public static List<User> findAll() {
		return finder.all();
	}

	public static User create(String userId, String provider, String firstName, String lastName, String fullName, String email, String avatarUrl, String password) throws ModelAlreadyExistsException {
		User user = User.findByEmailAndProvider(email, provider);
		if (user != null)
			throw new ModelAlreadyExistsException();

		user = new User();
		user.setId(userId);
		user.setProvider(provider);
		user.setFirstName(firstName);
		user.setLastName(lastName);
		user.setFullName(fullName);
		user.setEmail(email);
		user.setAvatarUrl(avatarUrl);
		user.setPassword(password);
		user.save(DBConstants.lir_backoffice);
		return user;
	}

	public static User create(Identity identity) throws ModelAlreadyExistsException{
		String firstName = null;
		String lastName = null;
		String email = null;
		String avatarUrl = null;
		String passwordInfo = null;
				try{
			firstName = identity.firstName();
			lastName = identity.lastName();
		} catch(Exception e){
			Logger.error(e.getMessage());
		}
		try{
			email = identity.email().get();
		} catch(Exception e){
			Logger.error(e.getMessage());
		}
		try{
			passwordInfo = identity.passwordInfo().get().password();
		} catch(Exception e){
			Logger.error(e.getMessage());
		}
		try{
			avatarUrl = identity.avatarUrl().get();
		} catch(Exception e){
			Logger.error(e.getMessage());
		}
		return User.create(
				identity.identityId().userId(),
				identity.identityId().providerId(),
				firstName,
				lastName,
				identity.fullName(),
				email,
				avatarUrl,
				passwordInfo);
	}

	public void update(Identity identity){
		String firstName = null;
		String lastName = null;
		String email = null;
		String avatarUrl = null;
		String passwordInfo = null;
		try{
			firstName = identity.firstName();
			lastName = identity.lastName();
		} catch(Exception e){
			Logger.error(e.getMessage());
		}
		try{
			email = identity.email().get();
		} catch(Exception e){
			Logger.error(e.getMessage());
		}
		try{
			passwordInfo = identity.passwordInfo().get().password();
		} catch(Exception e){
			Logger.error(e.getMessage());
		}
		try{
			avatarUrl = getAvatarUrl();
			if (avatarUrl == null)
				avatarUrl = identity.avatarUrl().get();
		} catch(Exception e){
			Logger.error(e.getMessage());
		}
		this.setFirstName(firstName);
		this.setLastName(lastName);
		// this.setFullName(identity.fullName());
		this.setEmail(email);
		this.setAvatarUrl(avatarUrl);
		this.setPassword(passwordInfo);
		this.update(DBConstants.lir_backoffice);
	}
}
