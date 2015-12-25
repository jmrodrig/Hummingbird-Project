package controllers.json;

public class Location {
	public Double latitude;
	public Double longitude;
	public Double radius;
	
	public static Location getLocation(com.lir.library.domain.Location location){
		if (location == null)
			return null;
		Location result = new Location();
		result.latitude = location.getLatitude();
		result.longitude = location.getLongitude();
		result.radius = location.getRadius();
		return result;
	}

	public static Location getLocation(models.Location location) {
		if (location == null)
			return null;
		Location result = new Location();
		result.latitude = location.getLatitude();
		result.longitude = location.getLongitude();
		result.radius = location.getRadius();
		return result;
	}
}
