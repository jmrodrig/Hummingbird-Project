package models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import java.util.List;
import java.util.ArrayList;

import play.db.ebean.Model;

import models.utils.DBConstants;

@Entity
@Table(name = "locations")
public class Location extends Model {

	/**
	 *
	 */
	private static final long serialVersionUID = -1029079807380583068L;

	private static final Integer CURRENT_MODEL_VERSION = 2;

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

	@Column(name = "zoom")
	private Double zoom;

	@Column(name = "showpin")
	private Boolean showpin;

	@Column(name = "ismain")
	private Boolean ismain;

	@Column(name = "name")
	private String name;

	@Column(name = "model_version")
	private Integer modelversion;

	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="story_id")
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

	public String getName() {
		return name;
	}

	public Double getZoom() {
		return zoom;
	}

	public void setAsMainStoryLocation(Boolean bol){
		this.ismain = bol;
		this.save(DBConstants.lir_backoffice);
	}

	public Boolean isMainStoryLocation(){
		return ismain;
	}

	public Boolean isShowPin() {
		return showpin;
	}

	public Story getStory() {
		return story;
	}

	public void setStory(Story story) {
		this.story = story;
	}

	public Boolean isWithinBounds(Double w, Double n, Double e, Double s) {
		if (this.latitude + this.radius > n || this.latitude - this.radius < s)
			return false;
		if (this.longitude + this.radius > e || this.longitude - this.radius < w)
			return false;
		return true;
	}

	public Location(controllers.json.Location l, models.Story story) {
		this.name = l.name;
		this.latitude = l.latitude;
		this.longitude = l.longitude;
		this.radius = l.radius;
		this.zoom = l.zoom;
		this.showpin = l.showpin;
		this.ismain = l.ismain;
		this.story = story;
		this.modelversion = CURRENT_MODEL_VERSION;
		this.save(DBConstants.lir_backoffice);
	}

	public Location(com.lir.library.domain.Location location) {
		this.latitude = location.getLatitude();
		this.longitude = location.getLongitude();
		this.radius = location.getRadius();
	}

	public Location() {}

	private static Finder<Long, Location> finder = new Finder<Long, Location>(Long.class, Location.class);

	public static List<Location> findLocationsWithinBounds(Double w, Double n, Double e, Double s) {
		List<Location> locations = finder.where().gt("latitude", s)
																							.lt("latitude", n)
																							.gt("longitude", w)
																							.lt("longitude", e)
																							.findList();
		// Correct with the radius
		List<Location> trueLocations = new ArrayList<Location>();
		for (Location location : locations) {
			if (location.isWithinBounds(w,n,e,s))
				trueLocations.add(location);
		}
		return trueLocations;
	}

	public static List<Location> findAll() {
		List<Location> locations = finder.where().eq("model_version", CURRENT_MODEL_VERSION)
																							.findList();
		return locations;
	}

	public static Location findById(Long id) {
		if (id == null) return null;
		Location location = finder.where().eq("id", id).findUnique();
		return location;
	}

	public static Location findByIdAndStoryId(Long id, Long storyid) {
		if (id == null) return null;
		Location location = finder.where().eq("story_id", storyid)
																				.eq("id", id)
																				.findUnique();
		return location;
	}

	public static Location findMainStoryLocation(Long storyid) {
		Location location = finder.where().eq("story_id", storyid)
																				.eq("ismain", true)
																				.findUnique();
		return location;
	}

	public static Location create(controllers.json.Location l, models.Story story) {
		Location location = new Location();
		location.name = l.name;
		location.latitude = l.latitude;
		location.longitude = l.longitude;
		location.radius = l.radius;
		location.zoom = l.zoom;
		location.showpin = l.showpin;
		location.ismain = l.ismain;
		location.story = story;
		location.modelversion = CURRENT_MODEL_VERSION;
		location.save(DBConstants.lir_backoffice);
		return location;
	}

	public static Location update(controllers.json.Location l, Location location) {
		location.name = l.name;
		location.latitude = l.latitude;
		location.longitude = l.longitude;
		location.radius = l.radius;
		location.zoom = l.zoom;
		location.showpin = l.showpin;
		location.ismain = l.ismain;
		location.update(DBConstants.lir_backoffice);
		return location;
	}

}
