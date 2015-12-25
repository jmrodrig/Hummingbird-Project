package models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Version;

import play.db.ebean.Model;

@Entity
@Table(name="invitations")
public class Invitation extends Model {

	private static final long serialVersionUID = 1L;

	@Version
	public long version;
	
	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;
	
	@Column(name="email")
	private String email;
	
	@Column(name="award_points")
	private double awardPoints;
	
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="user_id")
	private User user;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public double getAwardPoints() {
		return awardPoints;
	}

	public void setAwardPoints(double awardPoints) {
		this.awardPoints = awardPoints;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}
	
	private static Finder<Long, Invitation> finder = new Finder<Long, Invitation>(Long.class, Invitation.class);
	
}
