package controllers;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.OptimisticLockException;

import play.api.Play;
import play.mvc.Controller;
import play.mvc.Http.MultipartFormData;
import play.mvc.Http.MultipartFormData.FilePart;
import play.mvc.Result;

import com.google.gson.Gson;
import com.lir.library.domain.Location;
import com.lir.library.domain.Post;
import com.lir.library.domain.Story;
import com.lir.library.domain.post.data.Data;
import com.lir.library.domain.post.data.Image;
import com.lir.library.domain.post.data.Text;

import controllers.utils.Constants;
import controllers.utils.IdUtil;

public class Posts extends Controller {

	public static Result listPosts(Long storyId) {

		Story story = models.Story.findById(storyId).getDomainStory();
		if (story == null) {
			return badRequest("Invalid story id");
		}

		controllers.json.Post[] result = new controllers.json.Post[story.getPosts().size()];
		int count = 0;
		for (com.lir.library.domain.Post post : story.getPosts()) {
			result[count] = controllers.json.Post.getPost(story, post);
			count++;
		}

		// String json = new
		// JSONSerializer().exclude("*.class").deepSerialize(result);
		String json = new Gson().toJson(result);
		return ok(json);
	}

	public static Result createPost(Long storyId) {
		boolean optimisticError = false;
		String json = "";
		do {
			try {
				models.Story story = models.Story.findById(storyId);
				Story domainStory = story.getDomainStory();
				if (domainStory == null) {
					return badRequest("Invalid story id");
				}

				// controllers.json.Post jsonPost = new
				// JSONDeserializer<controllers.json.Post>().deserialize(request().body().asJson().asText());

				controllers.json.Post jsonPost = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Post.class);
				com.lir.library.domain.Post post = new com.lir.library.domain.Post();
				Long id;
				do {
					id = IdUtil.getId(Constants.POST);
				} while (domainStory.getPost(id) != null);

				post.setId(id);

				populatePost(domainStory, post, jsonPost);

				domainStory.addPost(post);

				story.saveDomainStory();

				jsonPost = controllers.json.Post.getPost(domainStory, post);
				// String json = new
				// JSONSerializer().exclude("*.class").deepSerialize(jsonPost);
				json = new Gson().toJson(jsonPost);
			} catch (OptimisticLockException ole) {
				optimisticError = true;
			}
		} while (optimisticError);
		return ok(json);
	}

	public static Result readPost(Long storyId, Long postId) {

		Story story = models.Story.findById(storyId).getDomainStory();
		if (story == null) {
			return badRequest("Invalid story id");
		}

		Post post = story.getPost(postId);
		if (post == null) {
			return badRequest("Invalid post id");
		}

		controllers.json.Post jsonPost = controllers.json.Post.getPost(story, post);
		// String json = new
		// JSONSerializer().exclude("*.class").deepSerialize(jsonPost);
		String json = new Gson().toJson(jsonPost);
		return ok(json);
	}

	public static Result updatePost(Long storyId, Long postId) {
		boolean optimisticError = false;
		String json = "";
		do {
			optimisticError = false;

			try {
				models.Story story = models.Story.findById(storyId);
				Story domainStory = story.getDomainStory();
				if (domainStory == null) {
					return badRequest("Invalid story id");
				}

				Post post = domainStory.getPost(postId);
				if (post == null) {
					return badRequest("Invalid post id");
				}

				controllers.json.Post jsonPost = new Gson().fromJson(request().body().asJson().toString(), controllers.json.Post.class);

				populatePost(domainStory, post, jsonPost);
				story.saveDomainStory();

				jsonPost = controllers.json.Post.getPost(domainStory, post);
				json = new Gson().toJson(jsonPost);
			} catch (OptimisticLockException ole) {
				optimisticError = true;
			}
		} while (optimisticError);

		return ok(json);
	}

	public static Result deletePost(Long storyId, Long postId) {
		models.Story story = models.Story.findById(storyId);
		Story domainStory = story.getDomainStory();
		if (domainStory == null) {
			return badRequest("Invalid story id");
		}

		Post post = domainStory.getPost(postId);
		if (post == null) {
			return badRequest("Invalid post id");
		}

		domainStory.removePost(post);
		story.saveDomainStory();
		return ok();
	}

	public static Result uploadImage(Long storyId, Long postId) throws IOException {

		Story story = models.Story.findById(storyId).getDomainStory();
		if (story == null) {
			return badRequest("Invalid story id");
		}

		Post post = story.getPost(postId);
		if (post == null) {
			return badRequest("Invalid post id");
		}

		MultipartFormData body = request().body().asMultipartFormData();
		List<FilePart> imageFileParts = body.getFiles();
		for (FilePart imageFilePart : imageFileParts) {
			if (imageFilePart != null) {
				File imageFile = imageFilePart.getFile();
				String fileSrc = "images/";

				String uploadPath = Play.current().path().getAbsolutePath() + "/private/upload/";
				File uploadDir = new File(uploadPath + fileSrc);
				if (!uploadDir.exists()) {
					uploadDir.mkdirs();
				}
				fileSrc += imageFilePart.getFilename();
				File uploadFile = new File(uploadDir, imageFilePart.getFilename());

				imageFile.renameTo(uploadFile);

				story.addComplexData(fileSrc, uploadFile);
				Image imageData = new Image();
				imageData.setSrc(fileSrc);
				imageData.setLocal(true);

				post.addData(imageData);

				controllers.json.Post jsonPost = controllers.json.Post.getPost(story, post);
				String json = new Gson().toJson(jsonPost);
				return ok(json);
			} else {
				flash("error", "Missing file");
				return redirect(routes.Application.index());
			}
		}
		return badRequest("Missing file");
	}

	private static void populatePost(Story story, com.lir.library.domain.Post post, controllers.json.Post jsonPost) {
		post.setTitle(jsonPost.title);
		if (jsonPost.location != null) {
			Location location = new Location();
			location.setLatitude(jsonPost.location.latitude);
			location.setLongitude(jsonPost.location.longitude);
			location.setRadius(jsonPost.location.radius);
			post.setLocation(location);
		}

		List<Data> toRemove = new ArrayList<Data>();
		if (jsonPost.text != null) {
			Text text = new Text(jsonPost.text);
			text.setId(IdUtil.getId(Constants.DATA));
			if (post.getData().size() > 0) {
				for (Data data : post.getData()) {
					if (data instanceof Text) {
						toRemove.add(data);
					}
				}
			}
			post.addData(text);
		}

		// if (jsonPost.audioUrl != null) {
		// Audio audio = new Audio();
		// audio.setId(IdUtil.getId(Constants.DATA));
		// audio.setLocal(true);
		// audio.setSrc(jsonPost.audioUrl);
		//
		// if (post.getData().size() > 0) {
		// for (Data data : post.getData()) {
		// if (data instanceof Audio) {
		// toRemove.add(data);
		// }
		// }
		// }
		//
		// post.addData(audio);
		// }
		//
		if (jsonPost.image != null) {
			if (post.getData().size() > 0) {
				for (Data data : post.getData()) {
					if (data instanceof Image) {
						Image img = (Image) data;
						// Isto estava aqui para salvaguardar o caso de haver
						// muiltiplas imagens
						// if
						// (jsonPost.image.imageUrl.toLowerCase().endsWith(img.getSrc().toLowerCase())){
						img.setX(jsonPost.image.x);
						img.setY(jsonPost.image.y);
						img.setHeight(jsonPost.image.height);
						img.setWidth(jsonPost.image.width);
						img.setAdjust(true);
						if (jsonPost.image.imageUrl == null) {
							img.setSrc(jsonPost.image.imageUrl);
						}
						// }
					}
				}
			}
		}
		//
		// if (jsonPost.movieUrl != null) {
		// Movie movie = new Movie();
		// movie.setId(IdUtil.getId(Constants.DATA));
		// movie.setLocal(true);
		// movie.setSrc(jsonPost.movieUrl);
		//
		// if (post.getData().size() > 0) {
		// for (Data data : post.getData()) {
		// if (data instanceof Movie) {
		// toRemove.add(data);
		// }
		// }
		// }
		//
		// post.addData(movie);
		// }

		for (Data data : toRemove) {
			post.removeData(data);
		}

		// for (Transition jsonTransition : jsonPost.transitions) {
		// com.lir.library.domain.Post transitionPost = story
		// .getPost(jsonTransition.toPostId);
		// LocationTransition locationTransition = new LocationTransition();
		// Location l = new Location(transitionPost.getLocation()
		// .getLatitude(),
		// transitionPost.getLocation().getLongitude(), transitionPost
		// .getLocation().getRadius());
		// locationTransition.setLocation(l);
		// post.addTransition(locationTransition);
		// }
	}
}
