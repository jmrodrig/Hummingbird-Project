package controllers.json;

import com.lir.library.domain.post.data.Audio;
import com.lir.library.domain.post.data.Data;
import com.lir.library.domain.post.data.Movie;
import com.lir.library.domain.post.data.Text;
import com.lir.library.domain.post.transition.BaseTransition;

public class Post {

	public String title;
	public Long id;
	public Location location;
	public boolean isFirstPost;
	public String movieUrl;
	public Image image;
	public String audioUrl;
	public String text;
	public Long[] transitionIds;

	public static Post getPost(com.lir.library.domain.Story story, com.lir.library.domain.Post post) {
		if (post == null)
			return null;
		Post result = new Post();
		result.id = post.getId();
		result.title = post.getTitle();
		result.location = Location.getLocation(post.getLocation());

		for (Data data : post.getData()) {
			if (data instanceof com.lir.library.domain.post.data.Image && story.getComplexData(((com.lir.library.domain.post.data.Image) data).getSrc()) != null ) {
				com.lir.library.domain.post.data.Image domainImage = (com.lir.library.domain.post.data.Image) data; 
				Image img = new Image();
				img.imageUrl = getPublicPath(story.getComplexData((domainImage).getSrc()).getAbsolutePath());
				if (domainImage.isAdjust()){
					img.x = domainImage.getX();
					img.y = domainImage.getY();
					img.height = domainImage.getHeight();
					img.width = domainImage.getWidth();
				}
				result.image = img;
				// result.imageUrl =
				// controllers.Files.getFilePath(((Image)data).getSrc());
			}
			if (data instanceof Movie) {
				result.movieUrl = controllers.Files.getFilePath(((Movie) data).getSrc());
			}
			if (data instanceof Audio) {
				result.audioUrl = controllers.Files.getFilePath(((Audio) data).getSrc());
			}
			if (data instanceof Text) {
				result.text = ((Text) data).getText();
			}
		}

		Long[] transitions = new Long[post.getTransitions().size()];
		int count = 0;
		for (BaseTransition transition : post.getTransitions()) {
			Transition t = new Transition();
			t.id = transition.getId();
			t.startPostId = post.getId();
			t.endPostId = transition.getTransitionPost().getId();
			transitions[count] = transition.getId();
			count++;
		}
		result.transitionIds = transitions;

		result.isFirstPost = post.isFirstPost();
		return result;
	}

	private static String getPublicPath(String path) {
		System.out.println("path: " + path);
		String result = "/uploads/" + path.substring(path.indexOf("upload") + 6).replace('\\', '/');
		System.out.println("url: " + result);
		return result;
	}
}
