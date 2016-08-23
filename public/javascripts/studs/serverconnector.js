
function stud_createStory(story, success, error){
	$.ajax({
		url: "/story",
		type: "POST",
		dataType: "json",
		data: JSON.stringify(story),
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_publisherCreateStory(success, error){
	$.ajax({
		url: "/story/create",
		type: "POST",
		success: success,
		error: error
	});
}

function stud_updateStory(story, success, error){
	$.ajax({
		url: "/story/" + story.id,
		type: "PUT",
		dataType: "json",
		data: JSON.stringify(story),
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_readStory(storyId, success, error){
	$.ajax({
		url: "/story/load/" + storyId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_publishStory(storyId, publish, success, error){
	$.ajax({
		url: "/story//publish/" + storyid + "/" + publish,
		type: "POST",
		dataType: "json",
		// contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_notifyStorySubmission(storyId, success, error){
	$.ajax({
		url: "/notify/" + storyId ,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_deleteStory(storyId, success, error){
	$.ajax({
		url: "/story/" + storyId,
		type: "DELETE",
		success: success,
		error: error
	});
}

function stud_downloadStory(storyId, success, error){
	$.fileDownload('/story/' + storyId + "/download", {
	    successCallback: success,
	    failCallback: error
	});
}


function stud_createPost(storyId, post, success, error){
	$.ajax({
		url : "/story/" + storyId + "/post",
		type : "POST",
		dataType : "json",
		data : JSON.stringify(post),
		contentType : "application/json",
		success : success,
		error : error
	});
}

function stud_deletePost(storyId, postId, success, error){
	$.ajax({
		url : "/story/" + storyId + "/post/" + postId,
		type : "DELETE",
		success : success,
		error : error
	});
}

function stud_updatePost(storyId, post, success, error){
	$.ajax({
		url : "/story/" + storyId + "/post/" + post.id,
		type : "PUT",
		dataType : "json",
		data : JSON.stringify(post),
		contentType : "application/json",
		success : success,
		error : error
	});
}

function stud_readPost(storyId, postId, success, error){
	$.ajax({
		url: "/story/"+storyId+"/post/"+postId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readTransition(storyId, postId, transitionId, success, error){
	$.ajax({
		url: "/story/"+storyId+"/post/"+postId+"/transition/"+transitionId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}


function stud_createTransition(storyId, postId, transition, success, error){
	$.ajax({
		url: "/story/"+storyId+"/post/"+postId+"/transition",
		type: "POST",
		dataType: "json",
		data: JSON.stringify(transition),
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_updateThumbnail(storyId, imageData, success, error){
	$.ajax({
		url: "/story/"+storyId+"/uploadThumbnail",
		type: "POST",
		dataType: "json",
		data: JSON.stringify(imageData),
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_updateTransition(storyId, postId, transition, success, error){

	$.ajax({
		url: "/story/"+storyId+"/post/"+postId+"/transition/"+transition.id,
		type: "PUT",
		dataType: "json",
		data: JSON.stringify(transition),
		contentType:"application/json",
		success: success,
		error: error
	});
}


function stud_deleteTransition(storyId, postId, transitionId, success, error){
	$.ajax({
		url: "/story/"+storyId+"/post/"+postId+"/transition/" + transitionId,
		type: "DELETE",
		success: success,
		error: error
	});
}

function stud_readLoggedUser(success, error){
	$.ajax({
		url: "/user",
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readUserDetails(numberId, success, error){
	$.ajax({
		url: "/user/" + numberId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readUserStories(success, error){
	$.ajax({
		url: "/story",
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readPublishedStories(success, error){
	$.ajax({
		url: "/listpublicstories",
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_logoutUser(success, error){
	$.ajax({
		url: "/logout",
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_fetchHtml(url,success, error){
	$.ajax({
		url: "/fetch/html/" + encodeURIComponent(url),
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_uploadStoryImage(imageData,storyId,onFinished) {
	url = '/story/uploadimage/' +storyId;
	//var imageData = new FormData($('.lg-container #image-upload-form')[0]);
	$.ajax( {
	  url: url,
	  type: 'POST',
	  data:  imageData,
	  processData: false,
	  contentType: false,
    dataType: "json",
	  success: onFinished
	} );
}

function stud_uploadStoryThumbnail(imageData,storyId,onFinished) {
	url = '/story/uploadthumbnail/' +storyId;
	//var imageData = new FormData($('.lg-container #image-upload-form')[0]);
	$.ajax( {
	  url: url,
	  type: 'POST',
	  data:  imageData,
	  processData: false,
	  contentType: false,
    dataType: "json",
	  success: onFinished
	} );
}

function stud_deleteStoryThumbnail(storyId,success,error) {
  $.ajax({
		url: '/story/deletethumbnail/' +storyId,
		type: "DELETE",
    dataType: "json",
		success: success,
		error: error
	});
}
