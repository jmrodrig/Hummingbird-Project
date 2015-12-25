package utils;

public class StringUtils {

	public static String removeRemovePreString(String str, String pre){
		int from;
		for (from = 0; from < pre.length(); from++) {
			if (str.charAt(from) != pre.charAt(from)){
				break;
			}
		}
		return str.substring(from);
	}
}
