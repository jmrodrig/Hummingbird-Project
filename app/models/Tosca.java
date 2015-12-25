package models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Version;

import models.exceptions.ModelAlreadyExistsException;
import models.utils.DBConstants;
import play.db.ebean.Model;
import securesocial.core.IdentityId;

import com.avaje.ebean.Expr;

@Entity
@Table(name = "toscas")
public class Tosca extends Model {

	private static final long serialVersionUID = 1L;

	@Version
	public long version;
	
	@Id
	@GeneratedValue
	@Column(name = "id")
	private String id;
	
	@Column(name = "name")
	private String name;
	
	@Column(name = "email")
	private String email;
	
	@Column(name = "age")
	private int age;

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public int getAge() {
		return age;
	}

	public void setAge(int age) {
		this.age = age;
	}
	
	private static Finder<Long, Tosca> finder = new Finder<Long, Tosca>(Long.class, Tosca.class);

	public static Tosca findByIdentityId(IdentityId identity){
		return finder.where(Expr.and(Expr.eq("id", identity.userId()), Expr.eq("provider", identity.providerId()))).findUnique();
	}
	
	public static Tosca findByEmail(String email) {
		Tosca user = finder.where().eq("email", email).findUnique();
		return user;
	}
	
	public static Tosca create(String name, String email, int age) throws ModelAlreadyExistsException {
		Tosca tosca = Tosca.findByEmail(email);
		if (tosca != null)
			throw new ModelAlreadyExistsException();

		tosca = new Tosca();
		tosca.setName(name);
		tosca.setEmail(email);
		tosca.setAge(age);
		tosca.save(DBConstants.lir_backoffice);
		return tosca;
	}
}
