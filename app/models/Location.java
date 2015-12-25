package models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import javax.persistence.Table;

import play.db.ebean.Model;

import models.utils.DBConstants;

@Entity
@Table(name = "story_location")
public class Location extends Model {

	/**
	 * 
	 */
	private static final long serialVersionUID = -1029079807380583068L;

	@Id
	@GeneratedValue
	@Column(name = "id")
	private long id;

	@Column(name = "latitude")
	private Double latitude;

	@Column(name = "longitude")
	private Double longitude;

	@Column(name = "radius")
	private Double radius;

	@OneToOne(fetch = FetchType.LAZY, mappedBy = "location")
	private Story story;

	public Double getLatitude() {
		return latitude;
	}

	public void setLatitude(Double latitude) {
		this.latitude = latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public void setLongitude(Double longitude) {
		this.longitude = longitude;
	}

	public Double getRadius() {
		return radius;
	}

	public void setRadius(Double radius) {
		this.radius = radius;
	}

	public long getId() {
		return id;
	}

	public Story getStory() {
		return story;
	}

	public void setStory(Story story) {
		this.story = story;
	}
	
	public Location(controllers.json.Location location) {
		this.latitude = location.latitude;
		this.longitude = location.longitude;
		this.radius =  (location.radius == null) ? 5.0 : location.radius;
		this.save(DBConstants.lir_backoffice);
	}

	public Location(com.lir.library.domain.Location location) {
		this.latitude = location.getLatitude();
		this.longitude = location.getLongitude();
		this.radius = location.getRadius();
	}
}
