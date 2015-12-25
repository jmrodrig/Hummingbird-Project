package models.utils;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.sql.Timestamp;

import com.google.common.io.Files;


public class FileUtils {
	public static File getDirectory(String path){
		File dir = new File(path);
		if (!dir.exists())
			dir.mkdirs();
		return dir;
	}
	
	public static File storeFile(File dir, File file, String rename) throws IOException{
		File dest = new File(dir, rename);
		Files.copy(file, dest);
		return dest;
	}
	
	public static File storeFile(String dirName, String fileName) throws IOException{
		File dir = new File(dirName);
		File file = new File(fileName);
		if (!dir.exists() || !file.exists()){
			return null;
		}
		return storeFile(dir, file, file.getName());
	}
	
	public static File storeFile(File dir, File file) throws IOException{
		return storeFile(dir, file, file.getName());
	}

	public static void deleteFile(String path) {
		File file = new File(path);
		if (file.exists())
			file.delete();
	}
	
	public static String getCurrentTimeStamp() {
		java.util.Date date= new java.util.Date();
		return Long.toString((new Timestamp(date.getTime())).getTime());
	}
}
