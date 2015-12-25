package models;

import java.util.List;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToMany;
import javax.persistence.Table;
import javax.persistence.Version;

import play.db.ebean.Model;

@Entity
@Table(name="labels")
public class Label extends Model {

	private static final long serialVersionUID = 1L;
	
	@Version
	public long version;
	
	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;
	
	@Column(name="name")
	private String name;
	
	@ManyToMany(mappedBy="labels")
	private List<Story> stories;

	public List<Story> getStories() {
		return stories;
	}

	public void setStories(List<Story> stories) {
		this.stories = stories;
	}

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
	
	private static Finder<Long, Label> finder = new Finder<Long, Label>(Long.class, Label.class);

}
