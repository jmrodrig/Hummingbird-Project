package models.utils;

public class Constants {
	public static final String privateStoryPath = "/private/stories";
	public static final String publicStoryPath = "/private/upload";

	public static final int SECTION = 0;
  public static final int LOCATION_SECTION = 1;
  public static final int HEADER_SECTION = 2;
  public static final int STORY_TEXT = 10;
  public static final int PICTURE_CONTAINER = 11;
  public static final int STORY_SUBTITLE = 12;

	public static final Integer CURRENT_MODEL_VERSION = 2;

	public static final Integer PUBLISHED_STATE_DRAFT = 0;
	public static final Integer PUBLISHED_STATE_PUBLISHED_ALL = 1;
	public static final Integer PUBLISHED_STATE_PUBLISHED_FOLLOWERS = 2;
	public static final Integer PUBLISHED_STATE_PRIVATE = 3;
}
