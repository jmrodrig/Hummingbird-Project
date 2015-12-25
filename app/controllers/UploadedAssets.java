package controllers;
import java.io.File;
import java.io.FileInputStream;
import play.api.Play;

import play.mvc.Controller;
import play.mvc.Result;
import play.api.mvc.Action;
import play.api.mvc.AnyContent;

public class UploadedAssets extends Controller {
//	public static Action<AnyContent> at(String path, String file){
//		return Assets.at(path, file);
//	}
	public static Result at(String path, String file){
		String uploadPath = Play.current().path().getAbsolutePath() + path;
		File dir = new File(uploadPath);
		if (!dir.exists()){
			dir.mkdirs();
		}
		File result = new File(dir, file);
		if (!result.exists()){
			return badRequest("File does not exist");
		}
		try{
			return ok(result);
		}
		catch(Exception e){
			return badRequest(e.getMessage());
		}
		
	}
}
