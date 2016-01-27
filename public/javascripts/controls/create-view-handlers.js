
//--- initialize global variables ---//

var map;
var helpOn = true;
var story;
var defaultLocation = new google.maps.LatLng(38.711652, -9.131238);
var fitZoom;

var user;
var posts;
var enablePostCreation;
var previousPostId;
var nextPostId;

var defaultStoryMapCss
var defaultStoryMapColapseCss
var openStoryMapCss
var openStoryMapColapseCss

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

//--- initialize method ---//
function initialize() {


	user = newUserObj();
	user.constructor();
	user.readLoggedUser(function (user){
			if (user.getAvatarUrl())
				avatarUrl = user.getAvatarUrl();
			else
				avatarUrl = ""
			$('#user-link').html('<div/><span>' + user.getFullName() + '  <span class="caret"></span></span>')
							.css('display' , 'block' );
			$('#user-link div').css('background-image','url(' + avatarUrl + ')');
			if (avatarUrl) $('#user-link').addClass('with-avatar');

			$('#publish-link, #delete-link').css('display','block');
		}
	);


	initiateMap();
	storyId = document.URL.split("/create/")[1];

	story = new newStoryObj(map);
	story.constructorId(storyId);
	story.readStory( function(s) {
		s.loadStoryElements(true,false,true, function(s){
			if (story.getAuthor().email != user.getEmail() || !story.getAuthor().email.indexOf("@lostinreality.net")) {
				alert('This Story does not belong to you or you are not allowed to edit.');
				document.location.href = '/profile';
				return;
			}
			posts = story.getOrderedPosts();
			//posts = story.getPosts();
			document.title = story.getTitle();
			$('#publish-link, #delete-link').css('display' , 'block' );
			if (story.isPublished()) $('#publish-link').removeClass('ga-event-maker-publish').addClass('published');
			buildStoryBody();
			buildStoryPostList();
			fitStoryOnView(s.getMarkers());
		});
	});

	//initialize events
	intializeEvents();
	//loadGaEvents();
}

function intializeEvents() {
	//----------------
	$('#content-wrapper').css({ height: $(window).innerHeight() - $('.navbar').outerHeight(true)});

	//----------------
	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');
	updateMapContainerSize();

	//----------------
	$('#btn-show-map').click(function() {
		$('#content-wrapper').removeClass('posts-open');
		$('#content-wrapper').toggleClass('map-open');
		toggleMapContainerState()
	});

	$('#btn-show-posts').click(function() {
		$('#content-wrapper').removeClass('map-open');
		$('#content-wrapper').toggleClass('posts-open');
	});

	$('#story-menu').hover(function() {
		if ($('#content-wrapper').hasClass('container-collapsed')) return;
		$('#content-wrapper').removeClass('map-open');
		$('#content-wrapper').toggleClass('posts-open');
	});

	//----------------
	$(window).resize(function() {
		$('#content-wrapper').css({ height: $(window).innerHeight() - $('.navbar').outerHeight(true) });
		$('#content-wrapper').removeClass('map-open');
		updateMapContainerSize();
		if ($(window).innerWidth() < 768)
			$('#content-wrapper').addClass('container-collapsed');
		else
			$('#content-wrapper').removeClass('container-collapsed');
	});

	//----------------
	$('#story-map').hover(function() {
		// if ($('#content-wrapper').hasClass('map-open')) return;
		// toggleOpenMap()
	});



}

function updateMapContainerSize() {
	var wS = $('#content-wrapper').innerWidth();
	var hS = $('#content-wrapper').innerHeight();
	if ($('#content-wrapper').hasClass('map-open')) {
		if ($('#content-wrapper').hasClass('container-collapsed'))
			size = { left:.10*wS , top:0*hS, width:.90*wS , height:1.00*hS, borderRadius:0 }
		else
			size = { left:.40*wS , top:0*hS, width:.60*wS , height:1.00*hS, borderRadius:0 }
	} else {
		if ($('#content-wrapper').hasClass('container-collapsed'))
			size = { left:.95*wS-50 , top:.95*hS-50, width:50 , height:50, borderRadius:25  }
		else
			size = { left:.88*wS , top:0*hS, width:.12*wS , height:1.00*hS, borderRadius:0  }
	}
	$('#story-map').css(size)
	$('#map-canvas').css({width:size.width, height:size.height})
	google.maps.event.trigger(map, 'resize');
}

function toggleMapContainerState() {
	var wS = $('#content-wrapper').innerWidth();
	var hS = $('#content-wrapper').innerHeight();
	defaultStoryMapCss = { left:.88*wS , top:0*hS, width:.12*wS , height:1.00*hS, borderRadius:0  }
	defaultStoryMapColapseCss = { left:.95*wS-50 , top:.95*hS-50, width:50 , height:50, borderRadius:25  }
	openStoryMapCss = { left:.40*wS , top:0*hS, width:.60*wS , height:1.00*hS, borderRadius:0 }
	openStoryMapColapseCss = { left:.10*wS , top:0*hS, width:.90*wS , height:1.00*hS, borderRadius:0 }

	if ($('#content-wrapper').hasClass('map-open')) {
		if ($('#content-wrapper').hasClass('container-collapsed'))
			resizeMap(defaultStoryMapColapseCss,openStoryMapColapseCss,true);
		else
			resizeMap(defaultStoryMapCss,openStoryMapCss,true);
	} else {
		if ($('#content-wrapper').hasClass('container-collapsed'))
			resizeMap(openStoryMapColapseCss,defaultStoryMapColapseCss,false);
		else
			resizeMap(openStoryMapCss,defaultStoryMapCss,false);
	}
}

function toggleOpenMap() {
	$('#content-wrapper').removeClass('posts-open');
	$('#content-wrapper').toggleClass('map-open');
	toggleMapContainerState()
}

function buildStoryBody() {
	storyBody = $("#story-body");
	storyHeader = $('<div/>').attr('id', 'post-' + story.getInitPost().getPostId())
							.addClass('story-header')
							.addClass('post-node');

	//Prologue/Intro Image - !!! FALTA ADICIONAR O IMAGE CONTROL
	var imageContainer = $('<div class="image-container no-image"/>').attr('id', 'image-post-' + story.getInitPost().getPostId())
							.append('<img atl="image for ' + story.getInitPost().getTitle() + '">');
	var imageOverlay = $('<div class="image-overlay no-image"></div>').appendTo(imageContainer);
	var removeImageButton = $('<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>')
							.appendTo(imageOverlay);
	var fileinputButton = $('<span class="btn fileinput-button"><span class="glyph-icon icon-medium flaticon-picture11"></span> Place a location image</span>')
							.appendTo(imageOverlay);
	var fileUploadInputElem = $('<input type="file" name="files[]" multiple>')
							.appendTo(fileinputButton);
	setupImageUploadOnElement(fileUploadInputElem);

	imageContainer.find('img').load(function() {
		if (story.getInitPost().getImageUrl() && story.getInitPost().getImageUrl().length > 0)
			imageContainer.removeClass('no-image').addClass('image');
		else
			imageContainer.removeClass('image').addClass('no-image');
		$(this).unbind();
	});
	imageContainer.find('img').attr('src',story.getInitPost().getImageUrl())

	// remove post image
	removeImageButton.click(function() {
		story.getInitPost().setImageUrl(null);
		story.setThumbnail(null);
		story.getInitPost().updatePost(function() {
			story.updateStory(function() {
				imageContainer.removeClass('image').addClass('no-image');
				imageContainer.find('img').attr('src','');
				$('#story-body').scrollspy('refresh');
			});
		});
	});

	storyHeader.append(imageContainer);

	//Location
	addressInput = $('<input class="post-location"/>')
				.attr('placeholder','LOCATION')
				.change(function() {
					var address = addressInput.val();
					story.setLocationName(address);
					story.updateStory(function() {});
				});

	if (story.getLocationName() && story.getLocationName().length > 0)
		addressInput.val(story.getLocationName());
	else
		addressInput.val('');

	storyHeader.append(addressInput);

	//Title
	titleInput = $('<input class="post-title"/>')
				.attr('placeholder','Story Title')
				.change(function() {
					var newtitle = titleInput.val();
					// need to validate
					story.setTitle(newtitle);
					story.getInitPost().setTitle(newtitle);
					story.getInitPost().updatePost(function() {
						story.updateStory(function() {
							$('#post-list a[href="#post-' + story.getInitPost().getPostId() + '"]').html(story.getTitle());
							document.title = story.getTitle();
						});
					});
				});

	if (story.getTitle() && story.getTitle().length > 0)
		titleInput.val(story.getTitle());
	else
		titleInput.val('');

	storyHeader.append(titleInput);

	//Author
	storyHeader.append("<div class='post-author'><em>by " + story.getAuthor().fullName + "</em></div>");

	//Summary/ Intro Text
	var textAreaInput = $('<textarea class="post-text" type="text" maxlength="255"/>')
						.attr('placeholder','...')
						.change(function() {
							var newtext = textAreaInput.val();
							// need to validate
							story.getInitPost().setText(newtext);
							story.setSummary(newtext);
							story.updateStory(function() {
								story.getInitPost().updatePost()
							});
						});

	if (story.getInitPost().getText() && story.getInitPost().getText().length > 0)
		textAreaInput.val(story.getInitPost().getText());
	else
		textAreaInput.val('');

	storyHeader.append(textAreaInput);

	//Post Overlay
	storyHeader.append("<div class='post-overlay'/>");

	//Add Location Button
	$("<div class='add-location-button'>+ Add Location</div>").appendTo(storyHeader)
		.click(function() {
			var previousPostId = parseInt($(this).parent().attr('id').replace('post-',''))
			if ($(this).parent().next().hasClass('post-node'))
				var nextPostId = parseInt($(this).parent().next().attr('id').replace('post-',''));
			else
				var nextPostId = null;
			setNewPostPosition(previousPostId,nextPostId);
			enableCreatePost();
		});

	storyHeader.resize(function() {
		console.log('post-node resized')
	});

	storyHeader.appendTo(storyBody);


	//Posts
	posts.forEach(function(p) {
		if (!p.isInitPost())
			buildPostDomElementsEdit(p).appendTo(storyBody);
	});

	$('.post-text').elastic();

	$('.post-text').keydown(function() {
		$('#story-body').scrollspy('refresh');
	});

	$('img').load(function() {
		console.log('scrollspy refresh')
		$('#story-body').scrollspy('refresh');
	});

};

//--- Method buildPostDomElementsEdit ---//
function buildPostDomElementsEdit(post) {
	var postDomElement = $('<div/>').attr('id', 'post-' + post.getPostId())
								.addClass('post-node')
								.addClass('story-post');

	//Title
	var titleInput = $('<input/>')
		.attr('placeholder','New Location')
		.change(function() {
			var newtitle = titleInput.val();
			// missing validation
			post.setTitle(newtitle);
			post.updatePost(function() {
				changePostListItemTitle(post);
			});
		});

	if (post.getTitle() && post.getTitle().length > 0)
		titleInput.val(post.getTitle());
	else
		titleInput.val('');

	$('<div class="post-title" />').append('<span class="glyph flaticon-facebook30"></span>')
										.append(titleInput)
										.appendTo(postDomElement)

	//Post Image - !!! FALTA ADICIONAR O IMAGE CONTROL
	var imageContainer = $('<div class="image-container no-image"/>').attr('id', 'image-post-' + post.getPostId())
							.append('<img atl="image for ' + post.getTitle() + '">');
	var imageOverlay = $('<div class="image-overlay"></div>').appendTo(imageContainer)
	var removeImageButton = $('<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>')
							.appendTo(imageOverlay);
	var fileinputButton = $('<span class="btn fileinput-button"><span class="glyph-icon icon-medium flaticon-picture11"></span> Place a location image</span>')
							.appendTo(imageOverlay);
	var fileUploadInputElem = $('<input type="file" name="files[]" multiple>')
							.appendTo(fileinputButton);
	setupImageUploadOnElement(fileUploadInputElem);

	imageContainer.find('img').load(function() {
		if (post.getImageUrl() && post.getImageUrl().length > 0)
			imageContainer.removeClass('no-image').addClass('image');
		else
			imageContainer.removeClass('image').addClass('no-image');
		$(this).unbind();
	});
	imageContainer.find('img').attr('src',post.getImageUrl())

	// remove post image
	removeImageButton.click(function() {
		post.setImageUrl(null);
		post.updatePost(function() {
			imageContainer.addClass('no-image').removeClass('image');
			imageContainer.find('img').attr('src','');
		});
	});

	postDomElement.append(imageContainer);

	//Text
	var textAreaInput = $('<textarea class="post-text"/>')
		.attr('placeholder','...')
		.change(function() {
			var newtext = textAreaInput.val();
			// missing validation
			post.setText(newtext);
			post.updatePost();
		});

	if (post.getText() && post.getText().length > 0)
		textAreaInput.val(post.getText());
	else
		textAreaInput.val('');

	postDomElement.append(textAreaInput);

	//Post Overlay
	postDomElement.append("<div class='post-overlay'/>");

	//Delete Location Button
	$("<div class='delete-location-button'>- Delete Location</div>").appendTo(postDomElement)
		.click(function() {
			removePost(post);
		});

	//Add Location Button
	$("<div class='add-location-button'>+ Add Location</div>").appendTo(postDomElement)
		.click(function() {
			var previousPostId = parseInt($(this).parent().attr('id').replace('post-',''));
			if ($(this).parent().next().hasClass('post-node'))
				var nextPostId = parseInt($(this).parent().next().attr('id').replace('post-',''));
			else
				var nextPostId = null;
			setNewPostPosition(previousPostId,nextPostId);
			enableCreatePost();
		});

	return postDomElement
}

//--- Method buildStoryPostList ---//
function buildStoryPostList() {
	storyMenu = $("#story-menu");
	postList = $('<ul id="post-list" class="nav nav-pills nav-stacked"/>');

	//Intro item
	postItem = $('<li/>');
	postItem.append($('<a/>').attr('href','#post-' + story.getInitPost().getPostId())
			.addClass('post-title')
			.append(story.getTitle())
	);

	postItem.appendTo(postList);

	//Post items
	posts.forEach(function(p) {
		if (!p.isInitPost())
			buildPostListItem(p).appendTo(postList);
	});

	postList.appendTo(storyMenu);

	// Events

	$('#story-body').scrollspy({
		target: '#story-menu',
		offset: 200
	});

	$('#story-menu').on('activate.bs.scrollspy', function () {
		activePost = $( "#story-menu li.active a").attr('href');

		//$( "#story-body " + activePost + " .post-overlay" ).hide();
		//$( "#story-body :not(" + activePost + ") .post-overlay" ).show();

		postId = parseInt(activePost.replace('#post-',''));
		if (activePost == '#story-header')
			fitStoryOnView(story.getMarkers());
		else
			focusOnPostMarker(story.getPostFromId(postId));

		//########################################

		// var plist = []
		// var post = story.getPostFromId(postId);
		// post.getPreviousPosts().forEach(function(p) {
			// plist.push(p.getTitle());
		// })
		// console.log(post.getTitle() + '\'s previous Posts: ' + plist);
		// var plist = []
		// post.getNextPosts().forEach(function(p) {
			// plist.push(p.getTitle());
		// })
		// console.log(post.getTitle() + '\'s next Posts: ' + plist);

		//########################################
	});
};

//--- buildPostListItem method ---//
function buildPostListItem(post) {
	postItem = $('<li/>');
	//Post Title
	var title;
	if (!post.getTitle() || post.getTitle().length == 0)
		title = 'New Location'
	else
		title = post.getTitle();

	postItem.append($('<a/>').attr('href','#post-' + post.getPostId())
			.addClass('post-title')
			.append('<span class="glyph flaticon-facebook30"></span>' + title)
			// .append(title)
	);

	//click event
	postItem.click(function() {});

	return postItem
}

//--- addPostItemToPostList method ---//
function addPostItemToPostList(post) {
	$("#post-list").append(buildPostListItem(post));
	$('#story-body').scrollspy('refresh');
}

//--- changePostListItemText method ---//
function changePostListItemTitle(post) {
	var postId = post.getPostId();
	newtitle = post.getTitle()
	$('#post-list a[href="#post-' + postId + '"]').html('<span class="glyph flaticon-facebook30"></span>' + newtitle);
}

//--- initiateMap method ---//
function initiateMap() {
	var mapOptions = {
		zoom : 12,
		streetViewControl: false,
		streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
		panControl : false,
		panControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
		zoomControl : false,
		zoomControlOptions : {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		mapTypeControl : true,
		center : defaultLocation,
		styles: mapstyles
	}

	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);

	//--- Map Event Handlers ---//
	var listener = google.maps.event.addListener(map, 'tilesloaded', function() {
		google.maps.event.addListener(map, 'click', mapLeftClicked);
		//$('#map-canvas').addClass('retracted');
		//fitStoryOnView(story.getMarkers());
		google.maps.event.removeListener(listener);
	});
}

//--- method resizeMap ---//
function resizeMap(oldState,newState,isExpand) {
	if (!map) return;
	if (isExpand) {
		$('#story-map').animate(newState, 500, 'easeOutCubic');
		$('#map-canvas').css( {width: newState.width, height: newState.height});
		google.maps.event.trigger(map, 'resize');
	} else {
		$('#story-map').animate( newState, 500, 'easeOutCubic', function() {
			$('#map-canvas').css( {width: newState.width, height: newState.height});
			google.maps.event.trigger(map, 'resize');
		});
	}
	panX = (oldState.width-newState.width)/2;
	panY = (oldState.height-newState.height)/2;
	map.panBy(panX,panY);
}

//--- focusOnPostMarker ---//
function focusOnPostMarker(post) {
	if (!post.getMarker()) return;

	var latlng = post.getMarker().getPosition();
	//fitStoryOnView(story.getMarkers())
	map.panTo(latlng);
	map.setZoom(20);

    // if (map) map.setOptions({
			// center: latlng,
			// zoom : 13
		// });

}

//--- fitStoryOnView ---//
function fitStoryOnView(markers) {
	//if (!story) return;
	var bound = new google.maps.LatLngBounds();
	if (markers.length == 0) {
		if (map) centerOnUserLocation();
	}
	else if (markers.length == 1) {
		if (map) map.setOptions({
			center: markers[0].getPosition(),
			zoom : 16 });
	}
	else {
		for (var i = 0; i < markers.length; i++) {
				bound.extend( markers[i].getPosition() );
		}
		if (map) map.fitBounds(bound);
	}
}

//--- toggleStatusIndicator method ---//
function toggleStatusIndicator() {
	$('#status').show();
	setTimeout(function() {
		$('#status').fadeOut(200);
	}, 1000);
}

//--- mapLeftClicked method ---//
function mapLeftClicked(mouseEvent) {
	if (!story) return;
	// random click does nothing
	if (!enablePostCreation) {
		return;
	}

	// create post if PostCreation is enabled
	var clickedLocation = mouseEvent.latLng;
	addNewPost(clickedLocation);

	disableCreatePost();
}

//--- addNewPost method ---//
function addNewPost(latLng) {
	if (!story || previousPostId == null) return;
	var newPost = newPostObj(map);
	newPost.constructorStoryLatLngRadius(story, latLng.lat(), latLng.lng(), 5.0);
	var previousPost = story.getPostFromId(previousPostId);
	if (nextPostId) var nextPost = story.getPostFromId(nextPostId);
	if (nextPostId) {
		// delete previous transition
		previousPost.getTransitionByEndPost(nextPost).deleteTransitionSimple(function() {
			console.log('transition deleted');
			newPost.createPost(function() {
				story.addPost(newPost);
				newPost.drawMarker();
				// create new transitions
				previousPost.createTransition(newPost,true);
				newPost.createTransition(nextPost,true);
				$("#post-" + previousPostId).after(buildPostDomElementsEdit(newPost));
				$('.post-text').elastic()
				$('#post-list a[href="#post-' + previousPostId + '"]').parent().after(buildPostListItem(newPost));
				$('#story-body').scrollspy('refresh');
				setNewPostPosition(null,null);
				story.updateStory(function() {});
			});
		});
	} else {
		newPost.createPost(function() {
			story.addPost(newPost);
			newPost.drawMarker();
			// create new transitions
			previousPost.createTransition(newPost,true);
			$("#post-" + previousPostId).after(buildPostDomElementsEdit(newPost));
			$('.post-text').elastic()
			$('#post-list a[href="#post-' + previousPostId + '"]').parent().after(buildPostListItem(newPost));
			$('#story-body').scrollspy('refresh');
			setNewPostPosition(null,null);
			story.updateStory(function() {});
		});
	}
}

function removePost(post) {
	if (post.getNextPosts()[0]) {
		previousPost = post.getPreviousPosts()[0]
		nextPost = post.getNextPosts()[0];
		story.removePost(post,function() {
			console.log('post removed')
			previousPost.createTransition(nextPost,true);
			//remove post html elements
			$('#story-body #post-' + post.getPostId()).remove();
			$('#post-list a[href="#post-' + post.getPostId() + '"]').parent().remove();
			$('#story-body').scrollspy('refresh');
		})
	} else {
		story.removePost(post,function() {
			console.log('last post deleted')
			//remove post html elements
			$('#story-body #post-' + post.getPostId()).remove();
			$('#post-list a[href="#post-' + post.getPostId() + '"]').parent().remove();
			$('#story-body').scrollspy('refresh');
		})
	}
}

//--- enableCreatePost method ---//
function enableCreatePost(){
	enablePostCreation = true;
	map.setOptions({draggableCursor:'crosshair'});
	toggleOpenMap();
}

//--- disableCreatePost method ---//
function disableCreatePost() {
	enablePostCreation = false;
	map.setOptions({draggableCursor: null });
	toggleOpenMap();
}

function setNewPostPosition(pPI,nPI) {
	previousPostId = pPI;
	nextPostId = nPI;
}

function setupImageUploadOnElement(element) {
	var imageContainer = element.parent().parent().parent();
	var storyId = story.getStoryId();
	var postId = parseInt(imageContainer.attr('id').replace('image-post-',''));
	var post = story.getPostFromId(postId)
	element.fileupload({
        url: '/story/'+storyId+'/post/'+postId+'/uploadimage',
        dataType: 'json',
        //autoUpload: false,
        acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        maxFileSize: 5000000, // 5 MB
        // Enable image resizing, except for Android and Opera,
        // which actually support image resizing, but fail to
        // send Blob objects via XHR requests:
        // disableImageResize: /Android(?!.*Chrome)|Opera/
        // .test(window.navigator.userAgent),
        // previewMaxWidth: 100,
        // previewMaxHeight: 100,
        // previewCrop: true,
		done: function (e, data) {
			if (data.result.image && data.result.image.imageUrl != post.getImageUrl()) {
				post.setImageUrl(data.result.image.imageUrl);
				if (post.isInitPost()) {
					story.setThumbnail(data.result.image.imageUrl);
					story.updateStory();
				}
				imageContainer.addClass('no-image').removeClass('image')
					.find('img')
					.load(function() {
						post.setImageWidth($(this).width())
						post.setImageHeight($(this).height())
						post.updatePost(function() {
							imageContainer.removeClass('no-image').addClass('image')
							$('#story-body').scrollspy('refresh');
						});
						$(this).unbind();
					})
					.attr('src',post.getImageUrl())
			}
		}
	});
}

function centerOnUserLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			var user_location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			var mapOptions = {center : user_location,};
		}, function(){
			var mapOptions = {center : defaultLocation};
			map.setOptions(mapOptions);
		});
	} else {
		var mapOptions = {center : defaultLocation};
		map.setOptions(mapOptions);
	}
}

//--- deleteStory method ---//
function deleteStory() {
	if (story) story.deleteStory(function(story) {
		document.location.href = '/profile';
	});
}

//--- publishCurrentStory method ---//
function publishStory() {
	if (story) {
		story.publishStory('1',function(s) {
			$('#publish-dialogue').fadeOut(200);
			$('#share-dialogue').fadeIn(200);
		});
	}
}

//--- unpublishCurrentStory method ---//
function unpublishStory() {
	if (story) {
		story.publishStory('0', function(s) {
			$('#share-dialogue').fadeOut(200);
		});
	}
}

function openPublishDialog() {
	if (story.isPublished())
		$('#share-dialogue').fadeIn(200);
	else
		$('#publish-dialogue').fadeIn(200);
}

//--- Convert latLng in readable address ---//
function getStoryAddress(story,latlng,onFinished) {
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({'latLng': latlng }, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				story.setLocationName(buildStoryLocation(results[0]));
			}
		} else {
			console.log("Geocoder failed due to: " + status);
		}
		if (onFinished) onFinished()
	});
}

function getTypeGeoCode(result,type) {
	var adrcmps = result.address_components;
	for ( var i = 0; i < adrcmps.length; i++) {
		for ( var j = 0; j < adrcmps[i].types.length; j++) {
			if (adrcmps[i].types[j] == type)
				return adrcmps[i].long_name;
		}
	}
	return '';
}

function buildStoryLocation(result) {
	var country = getTypeGeoCode(result,'country')
	var locality = getTypeGeoCode(result,'locality') + ', '
	if (locality == ', ')
		locality = getTypeGeoCode(result,'administrative_area_level_2') + ', '
	if (country == '')
		country = getTypeGeoCode(result,'administrative_area_level_1')

	return locality + country;
}

//SOCIAL
//Facebook
function openFacebookSharePopup() {
	var width  = 575,
		height = 400,
		left   = ($(window).width()  - width)  / 2,
		top    = ($(window).height() - height) / 2,
		url    = 'http://www.facebook.com/sharer/sharer.php?s=100&amp;p[url]=http://lostinreality.net/read/' + story.getStoryId(),
		opts   = 'status=1' +
				 ',width='  + width  +
				 ',height=' + height +
				 ',top='    + top    +
				 ',left='   + left;

	window.open(url, 'popup', opts);
}
//Twitter
function openTwitterSharePopup() {
	var width  = 830,
		height = 630,
		left   = ($(window).width()  - width)  / 2,
		top    = ($(window).height() - height) / 2,
		url    = 'https://twitter.com/intent/tweet?url=http://lostinreality.net/read/' + story.getStoryId() + '&amp;text=' + story.getTitle() + '&amp;via=LstnReality',
		opts   = 'status=1' +
				 ',width='  + width  +
				 ',height=' + height +
				 ',top='    + top    +
				 ',left='   + left;

	window.open(url, 'popup', opts);
}
