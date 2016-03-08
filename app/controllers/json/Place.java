package controllers.json;

public class Place {
	public Double nwlat;
	public Double nwlng;
	public Double selat;
	public Double selng;
	public String name;

	public static Place getPlace(models.Place place) {
		if (place == null)
			return null;
		Place result = new Place();
		result.name = place.getName();
		result.nwlat = place.getNWlat();
		result.nwlng = place.getNWlng();
		result.selat = place.getSElat();
		result.selng = place.getSElng();
		return result;
	}
}
