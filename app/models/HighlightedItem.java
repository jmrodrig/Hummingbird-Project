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

import models.exceptions.ModelAlreadyExistsException;
import models.utils.DBConstants;
import play.db.ebean.Model;

import com.avaje.ebean.Expr;

@Entity
@Table(name="highlighted_items")
public class HighlightedItem extends Model {

	private static final long serialVersionUID = 1L;

	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;

	@Column(name="item_id")
	private long itemId;

	@Column(name="type")
	private Integer type;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public long getItemId() {
		return itemId;
	}

	public void setItemId(long itemId) {
		this.itemId = itemId;
	}

	public Integer getType() {
		return type;
	}

	public void setType(Integer type) {
		this.type = type;
	}

	private static Finder<Long, HighlightedItem> finder = new Finder<Long, HighlightedItem>(Long.class, HighlightedItem.class);

	public static List<HighlightedItem> findAll() {
		List<HighlightedItem> hilighteditems = finder.all();
		return hilighteditems;
	}

	public static HighlightedItem findByItemIdAndType(long itemId, Integer type) {
		HighlightedItem item = finder.where(Expr.and(Expr.eq("item_id", itemId), Expr.eq("type", type))).findUnique();
		return item;
	}

	public static HighlightedItem create(long itemId, Integer type) {
		HighlightedItem item = HighlightedItem.findByItemIdAndType(itemId,type);
		if (item != null) {
			item.delete();
			return item;
		}
		item = new HighlightedItem();
		item.setItemId(itemId);
		item.setType(type);
		item.save(DBConstants.lir_backoffice);
		return item;
	}

	public static void delete(SavedStory savedstory) {
		savedstory.delete(DBConstants.lir_backoffice);
	}
}
