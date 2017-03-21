package models;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Version;
import models.utils.DBConstants;

import models.exceptions.ModelAlreadyExistsException;
import models.exceptions.ModelNotFountException;
import models.utils.DBConstants;
import play.db.ebean.Model;

import com.avaje.ebean.Expr;

@Entity
@Table(name="stories_labels")
public class StoryLabel extends Model {

	private static final long serialVersionUID = 1L;

	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;

	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="label_id")
	private Label label;

	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="story_id")
	private Story story;

	public Label getLabel() {
		return label;
	}

	public void setLabel(Label label) {
		this.label = label;
	}

	public Story getStory() {
		return story;
	}

	public void setStory(Story story) {
		System.out.println("StoryId -storylabel: " + story.getId());
		this.story = story;
	}

	private static Finder<Long, StoryLabel> finder = new Finder<Long, StoryLabel>(Long.class, StoryLabel.class);

	public static StoryLabel findByStoryIdAndLabelId(long storyId, long labelId) {
		StoryLabel storylabel = finder.where(Expr.and(Expr.eq("story_id", storyId), Expr.eq("label_id", labelId))).findUnique();
		return storylabel;
	}

	public static List<StoryLabel> findByStoriesByLabelId(long labelId) {
		return finder.where().eq("label_id", labelId).findList();
	}

	public static StoryLabel create(Story story, Label label) {
		StoryLabel storylabel = findByStoryIdAndLabelId(story.getId(),label.getId());
		if (storylabel != null)
			return storylabel;
		storylabel = new StoryLabel();
		storylabel.setStory(story);
		storylabel.setLabel(label);
		storylabel.save(DBConstants.lir_backoffice);
		return storylabel;
	}

	public static void delete(Story story, Label label) {
		StoryLabel storylabel = findByStoryIdAndLabelId(story.getId(),label.getId());
		if (storylabel != null)
			storylabel.delete(DBConstants.lir_backoffice);
	}
}
