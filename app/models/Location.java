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

	public Location(controllers.json.Location location, models.Story story) {
		this.name = location.name;
		this.latitude = location.latitude;
		this.longitude = location.longitude;
		this.radius = location.radius;
		this.zoom = location.zoom;
		this.showpin = location.showpin;
		this.story = story;
		this.modelversion = CURRENT_MODEL_VERSION;
		this.save(DBConstants.lir_backoffice);
	}

	public Location(com.lir.library.domain.Location location) {
		this.latitude = location.getLatitude();
		this.longitude = location.getLongitude();
		this.radius = location.getRadius();
	}

	public Location() {
		this.name = null;
		this.latitude = null;
		this.longitude = null;
		this.radius = null;
		this.zoom = null;
		this.showpin = false;
		this.modelversion = CURRENT_MODEL_VERSION;
	}

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

}
