package controllers.utils;

import java.util.HashMap;
import java.util.Map;

public class IdUtil {
	private static Map<String, Long> idMap = new HashMap<String, Long>();
	
	public static Long getId(String type){
		if (!idMap.containsKey(type)){
			idMap.put(type, 0L);
		}
		long result = idMap.get(type);
		idMap.put(type, result+1);
		return result;
	}
	
//	public static void setId(String type, Long id){
//		++id;
//		if (!idMap.containsKey(type)){
//			idMap.put(type, id);
//		}
//		long result = idMap.get(type);
//		idMap.put(type, result+1);
//		idMap.put(type, (result > id ? result + 1: id + 1));
//	}
}
