
//--- initialize global variables ---//
var map;
var story;
var postWindow;
var cursor;
var user;
var storyPostIdList = [];

var softArrow;
var enableSoftArrow = false;

var enablePostCreation = false;

var leftClickedPost;
var transitionsReadOnly = false;
var connectPostsList = [];
var enableTransitionSelectStartPost = false;
var enableTransitionCreation = false;

var helpOn = true;

var defaultLocation = new google.maps.LatLng(38.711652, -9.131238);


//--- initialize method ---//
function initialize() {

	postWindow = new PostWindow();
	//createStory();
	//$('#storyTitleInput').focus();
	//$('#storyTitleInput').val('Untitled Story');
	centerOnUserLocation();
	Dropzone.autoDiscover = false;
	
	initializeUserStoriesModal();
	
	intializeEvents();
	
	user = newUserObj();
	user.constructor();
	user.readLoggedUser(function (user){
		$('#create-link').css('display' , 'block' );
		$('#user-link').html(user.getFullName() + '  <span class="caret">')
						.css('display','block')
		
		$('#userStoriesModal').modal({
			keyboard: false,
			backdrop: 'static'
		});
	});
	
	// $('#userStoriesModal').modal({
			// keyboard: false,
			// backdrop: 'static'
		// })
	
	/*var myUpload = $('#uploadStoryButton').upload({
		name: 'storyFile',
		action: '/story/upload',
		enctype: 'multipart/form-data',
		params: {},
		autoSubmit: true,
		onSubmit: function(){},
		onComplete: function(storyData) {
			if (story) { story.clearMapElements(); }
			story = newStoryObj(map);
			story.constructor();
			story.setDomainStory($.parseJSON(storyData));
			story.loadStoryElements();
		},
		onSelect: function() {}
	});*/
	
	
	$("#story-fileupload").fileupload({
		url: '/story/upload',
		dataType: 'json',
		done: function(e, data) {
			storyData = data.result;
			if (story) { story.clearMapElements(); }
			////console.log('storyData :', storyData);
			story = newStoryObj(map);
			story.constructor();
			story.setDomainStory(storyData);
			story.loadStoryElements();
			$('#title-input').val(story.getTitle());
		}
	}).prop('disabled', !$.support.fileInput)
	.parent().addClass($.support.fileInput ? undefined : 'disabled');
	
	//--- postImage upload
	$(function () {
		'use strict';
		var url = '';
		var uploadButton = $('<button/>').attr('id','uploadImage-button')
			.addClass('btn btn-primary')
			.prop('disabled', true)
			.text('Processing...')
			.on('click', function () {
				var storyId = story.getStoryId();
				var postId = postWindow.post.getPostId();
				url = '/story/'+storyId+'/post/'+postId+'/uploadimage';
				$('#uploadImage-fileupload').fileupload({ url: url});
				var $this = $(this),
					data = $this.data();
				$this
					.off('click')
					.text('Abort')
					.on('click', function () {
						$this.remove();
						data.abort();
					});
				data.submit().always(function () {
					$this.remove();
				});
			});
		$('#uploadImage-fileupload').fileupload({
			url: url,
			dataType: 'json',
			autoUpload: false,
			acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
			maxFileSize: 5000000, // 5 MB
			// Enable image resizing, except for Android and Opera,
			// which actually support image resizing, but fail to
			// send Blob objects via XHR requests:
			disableImageResize: /Android(?!.*Chrome)|Opera/
				.test(window.navigator.userAgent),
			//previewMaxWidth: 200,
			//previewMaxHeight: 200,
			previewCrop: false
		}).on('fileuploadadd', function (e, data) {
			$('#uploadImage-preview').html('');
			$('#uploadImage-button').remove('');
			data.context = $('<div/>').appendTo('#uploadImage-preview');
			$.each(data.files, function (index, file) {
				var node = $('<div/>')
						.append($('<span/>').text(file.name));
				if (!index) {
					//node
						//.append('<br>')
					$("#uploadImage-preview")
						.after(uploadButton.clone(true).data(data));						
				}
				node.appendTo(data.context);
			});
		}).on('fileuploadprocessalways', function (e, data) {
			////console.log('Processing ' + data.files[data.index].name + ' ended.');
			var index = data.index,
				file = data.files[index],
				node = $(data.context.children()[index]);
			if (file.preview) {
				node
					.prepend('<br>')
					.prepend(file.preview);
			}
			if (file.error) {
				node
					.append('<br>')
					.append($('<span class="text-danger"/>').text(file.error));
			}
			if (index + 1 === data.files.length) {
				//data.context.find('button')
				$("#uploadImage-button")
					.text('Upload')
					.prop('disabled', !!data.files.error);
			}
		}).on('fileuploadprogressall', function (e, data) {
			var progress = parseInt(data.loaded / data.total * 100, 10);
			$('#uploadImage-progress .progress-bar').css(
				'width',
				progress + '%'
			);
		}).on('fileuploaddone', function (e, data) {
			if (data.result.image) {
				postWindow.post.resetImageDomainPost();
				postWindow.post.setImageUrl(data.result.image.imageUrl);
				postWindow.post.updatePost(function (post){
					postWindow.drawPostImage();
					// var link = $('<a>')
						// .attr('target', '_blank')
						// .prop('href', postWindow.post.getImageUrl());
					//$(data.context.children()[index]).wrap(link);
					////console.log('image uploaded. url: ',postWindow.post.getImageUrl());
					setTimeout(function() {$('#uploadPostImageModal').modal('hide');},500);
				});
			} 
			//else if (file.error) {
			//	var error = $('<span class="text-danger"/>').text(file.error);
			//	$(data.context.children()[index])
			//		.append('<br>')
			//		.append(error);
			//}
		}).on('fileuploadfail', function (e, data) {
			$.each(data.files, function (index, file) {
				var error = $('<span class="text-danger"/>').text('File upload failed.');
				$(data.context.children()[index])
					.append('<br>')
					.append(error);
			});
		}).prop('disabled', !$.support.fileInput)
			.parent().addClass($.support.fileInput ? undefined : 'disabled');
	});	
}

function intializeEvents() {
	//----------------
	$('#content-area').css({ height: $(window).innerHeight() - $('.navbar').outerHeight(true)});
	
	//----------------
	$(window).resize(function() {	
		$('#content-wrapper').css({ height: $(window).innerHeight() - $('.navbar').outerHeight(true) });
	});
}

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

//--- Listener for title-input ---//
$('#title-input').live('click', function() {
	//console.log('story title focus')
	var focusedinput = document.createElement('input');
	focusedinput.id = 'focusedinput';
	focusedinput.className = 'form-control input-lg ';
	var title = $("#title-input").val();
	focusedinput.value = title;
	focusedinput.size = title.length;
	focusedinput.maxLength = 50;
	document.getElementById('navbar-storytitle').appendChild(focusedinput);
	focusedinput.focus();
	focusedinput.onblur = function() {
		//console.log('story title updated');	
		var newTitle = focusedinput.value;
		var oldTitle = $("#title-input").val();
		if (!newTitle || newTitle.length == 0 || newTitle == oldTitle) {
			document.getElementById('navbar-storytitle').removeChild(focusedinput);
			return
		} else if (storyTitleExists(newTitle)) {
			openMessageModal('A story with this title already exists. This story should have a different title!','info','OK');
		} else {
			$("#title-input").val(newTitle);
			story.setTitle(newTitle);
			story.updateStory();
		}
		document.getElementById('navbar-storytitle').removeChild(focusedinput);
	}
});

//--- centerOnUserLocation method ---//
function centerOnUserLocation() {
	
//	var mapOptions = {
//			zoom : 12,
//			streetViewControl: false,
//			streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
//			mapTypeId : google.maps.MapTypeId.ROADMAP,
//			panControl: true,
//			panControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
//			zoomControl: true,
//			zoomControlOptions: {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
//			center : new google.maps.LatLng(60, 105)
//		};
//		initiateMap(mapOptions);
	
	
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			var user_location = new google.maps.LatLng(
					position.coords.latitude, position.coords.longitude);
			//console.log(user_location);
			var mapOptions = {
				zoom : 12,
				center : user_location,
				streetViewControl: false,
				streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
				mapTypeId : google.maps.MapTypeId.ROADMAP,
				mapTypeControl : true,
				//mapTypeControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
				panControl: true,
				panControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
				zoomControl: true,
				zoomControlOptions: {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER}
			};
			initiateMap(mapOptions);
		}, function(){
			var mapOptions = {
					zoom : 4,
					streetViewControl: false,
					streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
					panControl: true,
					panControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
					zoomControl: true,
					zoomControlOptions: {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
					mapTypeId : google.maps.MapTypeId.ROADMAP,
					mapTypeControl : true,
					//mapTypeControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
					center : defaultLocation
				};
				initiateMap(mapOptions);
		});
	} else {
		var mapOptions = {
			zoom : 4,
			streetViewControl: false,
			streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
			panControl : true,
			panControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
			zoomControl : true,
			zoomControlOptions : {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			mapTypeControl : true,
			//mapTypeControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
			center : defaultLocation
		};
		initiateMap(mapOptions);
	}
	//console.log(mapOptions);
}

//--- initiateMap method ---//
function initiateMap(options) {
	map = new google.maps.Map(document.getElementById('map-canvas'),options);
	
	initializeSoftArrow();
	
	//--- add listeners		
	initMapClickHandlers();
	google.maps.event.addListener(map, 'mousemove', function(cursor) { 
										updateSoftArrow(cursor); 
									});
	document.onkeypress = function(event) { 
									if (event.keyCode == 13 && enableTransitionCreation) {
										if (story) story.connectPosts(connectPostsList);
										disableCreateTransition();
									}
								};
	document.onkeydown = function(event) {
									if (event.keyCode == 27) {
										// Cancel transition creation
										if (enableTransitionCreation) disableCreateTransition();
										// Cancel post creation
										if (enablePostCreation) disableCreatePost();
									}
								};
}

//--- EVENT HANDLERS ---//

//--- initMapClickHandlers method ---//
function initMapClickHandlers() {
	var listener = google.maps.event.addListener(map, 'tilesloaded', function() {
		google.maps.event.addListener(map, 'click', mapLeftClicked);
		google.maps.event.removeListener(listener);
	});
}

//--- mapLeftClicked method ---//
function mapLeftClicked(mouseEvent) {
	if (!story) return;
	
	//--- close PostWindows if clicked outside the active PostWindow
	if (!enablePostCreation) {
		if (postWindow.isOpen) postWindow.close();
		return;
	}
	
	//--- create post if PostCreation is enabled
	disableCreatePost();
	var post = newPostObj(map);
	post.constructorStoryLatLngRadius(story, mouseEvent.latLng.lat(), mouseEvent.latLng.lng(), 5.0);
	post.setIsFirstPost(true);
	post.createPost(function(){
		post.setIsFirstPost(true);
		story.addPost(post);
		post.drawMarker()
		storyPostIdList.push(post.getPostId());
		//by default, creates a transition from the post 0 (initPost) to the created post
		story.getInitPost().createTransition(post,false);
		//Open Post Window
		postWindow.open(post);
		story.updateStory(function(story) {
			buildPostList();
		});
	});
}

//--- createInitialPost method ---//
function editInitialPost() {
	if (!story) return;
	story.defaultInitPost = false;
	postWindow.open(story.initPost);
	document.dispatchEvent(story.updatedEvent);
}

//--- createStory method ---//
function createStory() {
	if (story) leaveStory();
	story = newStoryObj(map);
	//set new story title
	var storyCount = user.getStories().length + 1
	var newTitle = 'Untitled Story ' + storyCount;
	while (storyTitleExists(newTitle)) {
		storyCount += 1;
		newTitle = 'Untitled Story ' + storyCount;
	}
	story.setTitle(newTitle);
	story.createStory(function(){
		var initPost = newPostObj();
		initPost.constructorStory(story);
		initPost.setIsInitPost(true);
		initPost.setTitle('Intro');
		initPost.createPost(function () {
			story.addPost(initPost);
			storyPostIdList.push(initPost.getPostId());
			story.setInitPost(initPost);
			showStoryControls();
			story.updateStory(function(story) {
				buildPostList();
				//console.log(story.getStoryId());
			});
		});
		$('#title-input').val(story.getTitle());
		// $('#navbar-story-thumbnail').css('background-image', 'url(' + story.getThumbnail() + ')');
		showHintsPanel('Start creating story locations by clicking on <b>Add location</b>. Then, if you wish to set a story path, click on <b>Connect Locations</b>.');
	});
}

//--- storyTitleExists method ---//
function storyTitleExists(newTitle){
	var userStoryList = user.getStories()
	for (var i = 0; i < userStoryList.length; i++) {  
		var oldTitle = userStoryList[i].getTitle();
		if (oldTitle == newTitle) return true;
	}
	return false;
}


//--- enableCreatePost method ---//
function enableCreatePost(){
	if (enableTransitionCreation) disableCreateTransition(); 
	enablePostCreation = true;
	map.setOptions({draggableCursor:'crosshair'});
	$('#controls-bar input').addClass('cursor-crosshair');
	showHintsPanel('Click on the map to drop a new story location.');	
}

//--- disableCreatePost method ---//
function disableCreatePost() {
	enablePostCreation = false;
	map.setOptions({draggableCursor: null });
	$('#controls-bar input').removeClass('cursor-crosshair');
	hideHintsPanel();
}

//--- toggleCreatePost method ---//	
function toggleCreatePost() {
	if (!story) return;
	if (!enablePostCreation) 
		enableCreatePost();
	else
		disableCreatePost();
}

//--- enableCreateTransition method ---//
function enableCreateTransition(){
	if (enablePostCreation) disableCreatePost();
	
	enableTransitionCreation = true;
	
	showHintsPanel('Click on the locations to set a <i>story path</i>. Press <b>ENTER</b> to finish and <b>ESC</b> to cancel.');	
	connectPostsList = [];
	toggleSoftArrow();
}

//--- disableCreateTransition method ---//
function disableCreateTransition() {
	enableTransitionCreation = false;
	leftClickedPost = null;
	toggleSoftArrow();
	hideHintsPanel();
}

//--- toggleCreateTransition method ---//
function toggleCreateTransition() {
	if (!story) return;
	if (!enableTransitionCreation)
		enableCreateTransition();
	else
		disableCreateTransition();
}

//--- downloadStoryRequest method ---//
function downloadStoryRequest(){
	if (!story) return;
	story.downloadStory();
}

//--- leaveStory method ---//
function leaveStory() {
	if (story) { 
		story.clearMapElements(); 
		story.posts = [];
		storyPostIdList = [];
		postWindow.close();	
		story = null;
		// $('#navbar-story-thumbnail').css('background-image', 'url("")');
		$('#title-input').val('');
		hideStoryControls();
		buildPostList();
		//createStory();
	}
}

//--- fitStoryOnView method ---//
function fitStoryOnView(markers) {
	//if (!story) return;
	var bound = new google.maps.LatLngBounds();
	if (markers.length == 0) {
		if (map) centerOnUserLocation();
	}
	else if (markers.length == 1) {
		if (map) {
			map.setCenter(markers[0].getPosition())
			map.setZoom(14);
		}
	}
	else {
		for (var i = 0; i < markers.length; i++) {
				bound.extend( markers[i].getPosition() );
		}
		if (map) map.fitBounds(bound);
	}
}

//--- initializeSoftArrow method ---//
function initializeSoftArrow() {

	var lineSymbol = {
		path : google.maps.SymbolPath.FORWARD_CLOSED_ARROW
	};
	
	softArrow = new google.maps.Polyline({
		strokeColor : '#444444',
		strokeOpacity : 0.6,
		strokeWeight : 2,
		/*icons : [ {
			icon : lineSymbol,
			offset : '100%'
		} ],*/
	});
	
	softArrow.setMap(map);
	
	//--- cancel transition creation
	google.maps.event.addListener(softArrow, 'click', function() { disableCreateTransition(); });
	
}

//--- toggleSoftArrow method ---//
function toggleSoftArrow() {
	enableSoftArrow = !enableSoftArrow;
	if (!enableSoftArrow) softArrow.setPath([]);
}

//--- updateSoftArrow method ---//
function updateSoftArrow(cursor) {
	if (enableSoftArrow && connectPostsList.length > 0) {
		var postsPath = new google.maps.MVCArray();
		connectPostsList.forEach(function(post) { postsPath.push(post.marker.getPosition()) });
		postsPath.push(cursor.latLng)
		softArrow.setPath( postsPath );
	}
}

//--- buildPostList method ---//
function buildPostList() {
	navPostListDiv = document.getElementById("navPostList");
	navPostListDiv.innerHTML = '';
	if (!story) return;
	
	// if (storyPostIdList.length == 0) storyPostIdList = story.domainStory.postIds;
	
	storyPostIdList = story.domainStory.postIds;

	////console.log(story.posts);
	//console.log(storyPostIdList);
	storyPostIdList.forEach(function(postId) {
		post = story.getPostFromId(postId);
		//console.log(postId);
		navPostListDiv.appendChild(createPostListEntry(post));
	});
}

//--- createPostListEntry method ---//
function createPostListEntry(post) {
	postListEntry = document.createElement('a');
	postListEntry.className = 'list-group-item';
	postListEntry.href = '#'
	if (post.domainPost.title == '' || !post.domainPost.title)
		postListEntry.innerHTML = 'untitled location';
	else
		postListEntry.innerHTML = post.domainPost.title;
	if (post.isInitPost()) postListEntry.id = 'list-initpost-item';
	
	// control functionalities - hover - highlight Post
	if (!post.isInitPost()) {
		postListEntry.onmouseover = function() { 
			if (post.isFirstPost())
				post.marker.setIcon('/assets/images/green-dot-glow.png'); 
			else 
				post.marker.setIcon('/assets/images/red-dot-glow.png');
		}
		postListEntry.onmouseout = function() { 
			if (post.isFirstPost()) 
				post.marker.setIcon('/assets/images/green-dot.png'); 
			else
				post.marker.setIcon('/assets/images/red-dot.png');
		}
	}
	
	// control functionalities - click/select
	postListEntry.onclick = function() { 
		if ( (postWindow.isOpen && postWindow.post != post ) || !postWindow.isOpen) {
			postWindow.open(post);
		}
		else {
			postWindow.close();	
		}
	}
	
	post.listEntry = postListEntry;
	
	return postListEntry;	
}

//--- buildUserStoryList method ---//
function buildUserStoryList(userStories) {
	if (userStories.length == 0) {
		$('<p><i>no stories created yet</i></p>').css('text-align','center').addClass('text-muted')
												.appendTo('#userStoryList');
	}
	userStories.forEach(function(userStory) {
		var userStoryListItem = document.createElement('a');
		userStoryListItem.className = 'list-group-item';
		userStoryListItem.id = 'user-story-list-item'
		userStoryListItem.href = '#'
		userStoryListItem.setAttribute("data-dismiss","modal");
		if (userStory.isPublished()) {
			userStoryListItem.innerHTML = '<img id="list-item-story-thumbnail" src=' + userStory.getThumbnail() + '>      ' + userStory.getTitle() + '<span> &ndash; <i>published</i></span>';
			//userStoryListItem.innerHTML = userStory.getTitle() + '<span> &ndash; <i>published</i></span>';
		} else {
			userStoryListItem.innerHTML = '<img id="list-item-story-thumbnail" src=' + userStory.getThumbnail() + '>      ' + userStory.getTitle();
			//userStoryListItem.innerHTML = userStory.getTitle();
		}
		userStoryListItem.onclick = function() {
			if (story) leaveStory();
			//console.log(userStory.domainStory)
			story = userStory;
			story.map = map;
			story.readStory(function(story) {
				story.loadStoryElements(true,false,false, function() {
					//console.log('olссссс')
					buildPostList();
					fitStoryOnView(story.getMarkers());
				});
				$('#title-input').val(story.getTitle());
				// $('#navbar-story-thumbnail').css('background-image', 'url(' + story.getThumbnail() + ')');
				if (story.isPublished()) 
					$('#publish-story-button').removeClass('btn-success').addClass('btn-danger').text('Unpublish Story');
				else
					$('#publish-story-button').removeClass('btn-danger').addClass('btn-success').text('Publish Story');
				initializeStoryDetailsModal();
				showStoryControls();				
				//console.log(story.getStoryId());
			});
		};
		document.getElementById('userStoryList').appendChild(userStoryListItem);
	});
}

//--- deleteCurrentStory method ---//
function deleteCurrentStory() {
	if (story) story.deleteStory(function(story) {
		leaveStory();
		$('#delete-dialogue').fadeOut(200);
		$('#userStoriesModal').modal({
			keyboard: false,
			backdrop: 'static'
		});
	});
}

//--- toggleStatusIndicator method ---//
function toggleStatusIndicator() {
	$('#status').show();
	setTimeout(function() {
		$('#status').fadeOut(200);
	}, 1000);
}

//--- showStoryControls method ---//
function showStoryControls() {
	$('.story-controls').show();
	$('#lir-logo, #create-link').hide();
	$('#title-input, #lir-logo-small, #publish-link, #delete-link').css('display','block');
	$('#story-dropdown-options-divider')
		.after('<li class="divider story-dropdown-options"></li>')
		.after($('<li><a class="story-dropdown-options" href="#">Delete this Story</a></li>'))
		//.after('<li><a class="story-dropdown-options" href="#">Share this Story</a></li>')
		//.after('<li><a class="story-dropdown-options" href="#" data-toggle="modal" data-target="#storyDetailsModal">Story Details</a></li>');			
}

//--- hideStoryControls method ---//
function hideStoryControls() {
	$('.story-controls').hide();
	$('.story-dropdown-options').remove();
	$('#title-input, #lir-logo-small, #publish-link, #delete-link').css('display','none');
	$('#lir-logo, #create-link').css('display','block');
}

//--- showHintsPanel method ---//
function showHintsPanel(message) {
	if (!helpOn) return;
	$('#hintMessage').html(message);
	$('#hintsPanel').show("fade");
}

//--- hideHintsPanel method ---//
function hideHintsPanel() {
	$('#hintsPanel').hide("fade");
}

//--- toogleHelp method ---//
function toogleHelp() {
	if (!helpOn) {
		helpOn = true;
		$('#help-toogle-button').html('Help is on. Turn off?');
	} else if (helpOn) {
		helpOn = false;
		$('#help-toogle-button').html('Help is off.');
		$('#hintsPanel').hide();
	}
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

//--- openMessageModal method ---//
function openMessageModal(message, messageType, acceptOptionText, acceptAction) {
	// unregister accept Action
	$("#accept-button").off();
	
	if (messageType == 'info') {
		$("#accept-button").removeClass('btn-danger').addClass('btn-primary');
		$("#message-icon").removeClass('flaticon-warning12').addClass('flaticon-exclamation');
		$("#cancel-button").hide();
		$("#message").removeClass('danger')
	} else if (messageType == 'danger') {
		$("#accept-button").removeClass('btn-primary').addClass('btn-danger');
		$("#message-icon").removeClass('flaticon-exclamation').addClass('flaticon-warning12');
		$("#cancel-button").show();
		$("#message").removeClass().addClass('danger')
	}
	
	$("#message").text(message);
	
	$("#accept-button").text(acceptOptionText)
	
	if (acceptAction) {
		$("#accept-button").click(function() { acceptAction(); });
	}
	
	$('#messageModal').modal({
		keyboard: false,
		backdrop: 'static'
	});
}

//--- initializeUserStoriesModal method ---//
function initializeUserStoriesModal() {
	$('#userStoriesModal').on('shown.bs.modal', function (e) {
		//$("#userStoryList").html('');
		$('#userStoriesListModalTitle').text(user.getFullName() + '\'s stories.');
		hideHintsPanel();
		user.readStories(function (user){
			//console.log(user.getStories());
			buildUserStoryList(user.getStories());
		});
	});
	
	$('#userStoriesModal').on('hidden.bs.modal', function (e) {
		$("#userStoryList").html('');
	});
}

//--- initializeStoryDetailsModal method ---//
function initializeStoryDetailsModal() {
	//unregister all events before initializing
	$('#storyDetailsModal').off();
	$('#image-crop').off();
	$('#save-thumbnail-btn').off();
	$('#cancel-thumbnail-btn').off();
	$('#thumbnail-image').off();
	$('#storyDetailsModal-summary').off();
	
	//limit characters of summary textarea
	var maxLength = $("#storyDetailsModal-summary").attr("maxlength");
	var remain;
	$('#storyDetailsModal-summary').keyup(function() {
		var tlength = $(this).val().length;
		$(this).val($(this).val().substring(0,maxLength));
		tlength = $(this).val().length;
		remain = maxLength - parseInt(tlength);
		$('#remain-summary').html('<em>You have ' + remain + ' characters left.</em>');
    }); 
	
	if (story) {
		// initialize image cropper					
		$('#image-crop').cropit({
				imageBackground: true,
				imageBackgroundBorderWidth: 15,
				imageState: { src: story.getThumbnail() }
		});
			
		// register save button click event
		$('#save-thumbnail-btn').click(function() {
			console.log('save-thumbnail-btn');
			imageURL = $('#image-crop').cropit('export', {
											type: 'image/png'
										});
			var imageData = {ext: 'png', data: imageURL.substring(22)};
			story.updateThumbnail(imageData, function(data) {
				 $('#thumbnail-image').css('background-image', 'url(' + imageURL + ')');
				 // $('#navbar-story-thumbnail').css('background-image', 'url(' + imageURL + ')');
				// hide image cropper and show thumbnail
				 $('#image-crop').hide();
				 $('#thumbnail-image').show();
				 $('#image-crop').cropit({ imageState: { src: '' } });
			});
		});
		// register cancel button click event
		$('#cancel-thumbnail-btn').click(function() {
			$('#image-crop').hide();
			$('#thumbnail-image').show();
			$('#image-crop').cropit({ imageState: { src: story.getThumbnail() } });
		});
		//register summary textarea
		$('#storyDetailsModal-summary').blur(function() {
			story.setSummary($('#storyDetailsModal-summary').val());
			story.updateStory();
		});
		//register thumbnail
		$('#thumbnail-image').click(function() {
			$('.cropit-image-input').click();
			$('#thumbnail-image').hide();
			$('#image-crop').show();
		});
		//register modal when open event
		$('#storyDetailsModal').on('show.bs.modal', function (e) {
			// title
			$('#storyDetailsModal-title').html(story.getTitle() + '<span>  <em>&mdash; story details</em></span>');
			// summary
			if (story.getSummary() && story.getSummary().length >= 0)
				$('#storyDetailsModal-summary').val(story.getSummary());
			else
				$('#storyDetailsModal-summary').val('');
			remain = maxLength - $('#storyDetailsModal-summary').val().length;
			$('#remain-summary').html('<em>You have ' + remain + ' characters left.</em>');
			// thumbnail
			$('#thumbnail-image').css('background-image', 'url(' + story.getThumbnail() + ')')
								.show();
		});
		//register modal when open event		
		$('#storyDetailsModal').on('hidden.bs.modal', function (e) {
			$('#image-crop').hide();
			$('#thumbnail-image').show();			
		});
	}
}

//--- openVideoWindow method ---//
function openVideoWindow() {
    $('#video-container').lightbox_me({
        centered: 	true,
		zIndex: 2000,
		overlayCSS: {background: 'white', opacity: .6},
		onLoad: 	function() {
			loadYTIframeAPI();
		},
		onClose:	function() {
			try { 
				player.destroy(); 
			}
			catch(err) { 
				//console.log(err) 
			}
		}
	});
}

// LOAD YOUTUBE VIDEO
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function loadYTIframeAPI() {
	player = new YT.Player('player', {
		height: '540',
		width: '960',
		videoId: 'X5hdhTG9JBE',
		events: {
			'onStateChange': onPlayerStateChange
		},
		playerVars: {
			autoplay: 1,
			controls: 0,
			modestbranding: 1,
			rel: 0,
			showInfo: 0
		}
	});
}

function onPlayerStateChange(event) {
	//console.log(event.data)
	if (event.data == YT.PlayerState.ENDED) {
		$('#video-container').trigger('close');
	}
}

function stopVideo() {
	player.stopVideo();
}


