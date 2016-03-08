package models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.CascadeType;

import java.util.List;

import play.db.ebean.Model;

import models.utils.DBConstants;

@Entity
@Table(name = "places")
public class Place extends Model {

	/*
	 *
	 */
	private static final long serialVersionUID = -1029079807380583068L;

	@Id
	@GeneratedValue
	@Column(name = "id")
	private long id;

	@Column(name = "nwlat")
	private Double nwlat;

	@Column(name = "nwlng")
	private Double nwlng;

	@Column(name = "selat")
	private Double selat;

	@Column(name = "selng")
	private Double selng;

	@Column(name = "name")
	private String name;

	@Column(name = "osmid")
	private String osmid;

	@OneToOne(cascade=CascadeType.ALL, mappedBy = "place")
	private Story story;

	public Double getNWlat() {
		return nwlat;
	}

	public Double getNWlng() {
		return nwlng;
	}

	public Double getSElat() {
		return selat;
	}

	public Double getSElng() {
		return selng;
	}

	public void setNWlat(Double nwlat) {
		this.nwlat = nwlat;
	}

	public void setNWlng(Double nwlng) {
		this.nwlng = nwlng;
	}

	public void setSElat(Double selat) {
		this.selat = selat;
	}

	public void setSElng(Double selng) {
		this.selng = selng;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getOSMId() {
		return osmid;
	}

	public void setOSMId(String osmid) {
		this.osmid = osmid;
	}

	public long getId() {
		return id;
	}

	public Story getStory() {
		return story;
	}

	public Place(controllers.json.Place place) {
		this.name = place.name;
		this.selat = place.selat;
		this.nwlat = place.nwlat;
		this.nwlng =  place.nwlng;
		this.selng =  place.selng;
		this.save(DBConstants.lir_backoffice);
	}

	private static Finder<Long, Place> finder = new Finder<Long, Place>(Long.class, Place.class);

	public static List<Place> findLocationsWithinBounds(Double w, Double n, Double e, Double s) {
		List<Place> places = finder.where().gt("selat", s)
																			.lt("nwlat", n)
																			.gt("nwlng", w)
																			.lt("selng", e)
																			.findList();
		return places;
	}

}
