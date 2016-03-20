package models;

import java.util.List;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Version;
import javax.persistence.CascadeType;
import models.utils.DBConstants;

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

	@OneToMany(mappedBy="label", cascade=CascadeType.ALL)
	private List<StoryLabel> labelstories;

	public List<StoryLabel> getLabelStories() {
		return labelstories;
	}

	public Long getId() {
		return this.id;
	}

	public String getName() {
		return this.name;
	}

	public void setName(String name) {
		this.name = name;
	}

	private static Finder<Long, Label> finder = new Finder<Long, Label>(Long.class, Label.class);

	public static Label findByName(String name) {
		Label label = finder.where().eq("name", name).findUnique();
		return label;
	}

	public static List<Label> findByStartingWith(String value) {
		List<Label> labels = finder.where().startsWith("name", value).findList();
		return labels;
	}

	public static Label create(String name) {
		Label label = findByName(name);
		if (label != null)
			return label;
		label = new Label();
		label.setName(name);
		label.save(DBConstants.lir_backoffice);
		return label;
	}

}
