package controllers;

import java.io.File;
import java.io.IOException;

import play.api.Play;
import play.mvc.Controller;
import play.mvc.Http.MultipartFormData;
import play.mvc.Http.MultipartFormData.FilePart;
import play.mvc.Result;

public class Files extends Controller {
	
	
	//TODO: get file from amazon
	public static String getFilePath(String name){
		return name;
	}
	
	public static Result uploadPublic(){
		
		MultipartFormData body = request().body().asMultipartFormData();
		FilePart storyFilePart = body.getFile("file");
		if (storyFilePart != null) {
			String fileName = storyFilePart.getFilename();
			File file = storyFilePart.getFile();
			String uploadPath = Play.current().path().getAbsolutePath() + "/public/upload";
			File destDir = new File(uploadPath);
//			try {
////				org.apache.commons.io.FileUtils.copyFileToDirectory(file, destDir);
//			} catch (IOException e) {
//				e.printStackTrace();
//				return badRequest("Could not upload file");
//			}
			
			
			return ok("/assets/upload/" + fileName);
		} else {
			flash("error", "Missing file");
			return redirect(routes.Application.index());
		}
	}
}
