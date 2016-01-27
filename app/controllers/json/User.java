package controllers.json;

public class User {

	public String id;
	public String firstName;
	public String lastName;
	public String fullName;
	public String email;
	public String avatarUrl;
	public Integer noOfStories;
	public Integer noOfSaved;
	public Integer noOfFollowers;
	public Integer noOfFollowing;


	public static User getUser(models.User domainUser) {
		User user = new User();
		user.id = domainUser.getId();
		user.firstName = domainUser.getFirstName();
		user.lastName = domainUser.getLastName();
		user.fullName = domainUser.getFullName();
		user.email = domainUser.getEmail();
		user.avatarUrl = domainUser.getAvatarUrl();
		return user;
	}
}
