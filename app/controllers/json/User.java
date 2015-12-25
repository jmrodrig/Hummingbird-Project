package controllers.json;

public class User {

	public String firstName;
	public String lastName;
	public String fullName;
	public String email;
	public String avatarUrl;

	public static User getUser(models.User domainUser) {
		User user = new User();
		user.firstName = domainUser.getFirstName();
		user.lastName = domainUser.getLastName();
		user.fullName = domainUser.getFullName();
		user.email = domainUser.getEmail();
		user.avatarUrl = domainUser.getAvatarUrl();
		return user;
	}
}
