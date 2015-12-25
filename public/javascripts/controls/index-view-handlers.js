
//--- initialize global variables ---//
var map;
var user;
var story;
var postWindow;

var playerStories = [];
var storyMarkers = [];
var helpOn = true;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"


var leftClickedPost;
var enableTransitionSelectStartPost = false;
var enableTransitionCreation = false;

var defaultLocation = new google.maps.LatLng(38.711652, -9.131238);

var player;
var toggleStatusIndicator;


//--- initialize method ---//
function initialize() {
	
	$('#blog-link').css('display' , 'block' );
	
	user = newUserObj();
	user.constructor();
	user.readLoggedUser(function (user){
			if (user.getAvatarUrl())
				avatarUrl = user.getAvatarUrl();
			else
				avatarUrl = defaultAvatarPic
			$('#stories-link').css('display' , 'block' );
			$('#user-link').html('<div/><span>' + user.getFullName() + '  <span class="caret"></span></span>')
							.css('display' , 'block' );
			$('#user-link div').css('background-image','url(' + avatarUrl + ')');
		},
		function (){
			$('#login-link, #stories-link').css('display' , 'block' );
		}
	);

	initializeEvents();
}


function initializeEvents() {
	positionVideoFrame();

	$(window).resize(function() {	
		positionVideoFrame()
	});
	
	loadYTIframeAPI();
}
	
//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

function positionVideoFrame() {
	var windowHeight = $("#hero-1").innerHeight() - $(".navbar").outerHeight(true),
		windowWidth = $("#hero-1").innerWidth(),
		windowAspectRatio = windowWidth/windowHeight,
		videoAspectRatio = 640/360,
		width,
		height,
		left,
		top;
	
	if ( windowAspectRatio >= videoAspectRatio) {
		$('#video-hero-1').css({ 
			height: windowWidth / videoAspectRatio, 
			width: windowWidth,
			left: 0,
			top: (windowHeight - windowWidth / videoAspectRatio)/2
		});
	} else {
		$('#video-hero-1').css({ 
			height: windowHeight, 
			width: windowHeight * videoAspectRatio,
			left: (windowWidth - windowHeight * videoAspectRatio)/2,
			top: 0
		});
	}
}

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
				mapTypeControl : false,
				//mapTypeControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
				panControl: true,
				panControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
				zoomControl: true,
				zoomControlOptions: {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER}
			};
			initiateMap(mapOptions);
		}, function(){
			var mapOptions = {
					zoom : 12,
					streetViewControl: false,
					streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
					panControl: true,
					panControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
					zoomControl: true,
					zoomControlOptions: {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
					mapTypeId : google.maps.MapTypeId.ROADMAP,
					mapTypeControl : false,
					//mapTypeControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
					center : defaultLocation
				};
				initiateMap(mapOptions);
		});
	} else {
		var mapOptions = {
			zoom : 12,
			streetViewControl: false,
			streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
			panControl : true,
			panControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
			zoomControl : true,
			zoomControlOptions : {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			mapTypeControl : false,
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
	
	readPublishedStories();
	
	//--- add listeners		
	initMapClickHandlers();
	google.maps.event.addListener(map, 'mousemove', function(cursor) { 
										//updateSoftArrow(cursor); 
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
}

//--- fitStoryOnView method ---//
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


//--- readPublishedStories method ---//
function readPublishedStories() {
	var lirmanager = newLirManagerObj();
	lirmanager.readPublishedStories(function(lirmanager){
		publishedStories = lirmanager.getStories();
		//console.log(publishedStories);
		drawPublishedStoryMarkersOnMap(publishedStories);
	});
}


//--- loadPublishedStories method ---//
function loadPublishedStories(publishedStories) {
	storyMarkers = [];
	for ( var i = 0; i < publishedStories.length; i++) {
		story = publishedStories[i];
		story.map = map;
		story.readStory( function(s) {
							playerStories.push(s);
							s.loadStoryElements(false,true,true, function(st){ 
								st.drawStoryMarker(function(st) { 
									showStoryDetails(st);
									fitStoryOnView([st.marker]);
								}); 
								storyMarkers.push(s.marker);
								if (playerStories.length >= publishedStories.length) {
									fitStoryOnView(storyMarkers);
								}
							});
						});
	}
}

//--- drawPublishedStoryMarkersOnMap method ---//
function drawPublishedStoryMarkersOnMap(publishedStories) {
	var storyMarkerList = [];
	var storyDetails
	var story
	for ( var i = 0; i < publishedStories.length; i++) {
		storyDetails = publishedStories[i];
		if (storyDetails.location != null) { 
			marker = new google.maps.Marker({
				position : new google.maps.LatLng(storyDetails.location.latitude, storyDetails.location.longitude, true),
				map : map,
				title : storyDetails.title,
				draggable : false
			});
			
			marker.storyDetails = storyDetails;
			
			google.maps.event.addListener(marker, 'click', function() {
					//showStoryDetails(this.storyDetails);
					
					fitStoryOnView([this]);
				});
			storyMarkerList.push(marker);

			
			story = new newStoryObj(map);
			story.constructor();
			story.setDomainStory(storyDetails);
			story.readStory( function(s) {
				addStoryListEntry(s,storyDetails);
			});
		}
	fitStoryOnView(storyMarkerList);
	}
}


//--- showStoryDetails method ---//
function showStoryDetails(storyDetails) {
	hideHintsPanel();
	$("#story-summary").text('');
	$("#story-thumbnail").css('background-image','url()');
	$("#story-details-container").nanoScroller();
	var story = new newStoryObj(map);
	story.constructor();
	story.setDomainStory(storyDetails);
	story.readStory( function(s) {
		$("#story-title").text(s.getTitle());
		$("#story-author").text('by ' + storyDetails.author.fullName);
		$("#story-summary").text(s.getSummary());
		$("#story-thumbnail").css('background-image','url(' + s.getThumbnail() + ')');
		$("#story-details-container").show("fade");
		$("#story-details-container").nanoScroller();
	});
	
	//----- Scroll bar -----//
	 
}

//--- buildStoryList method ---//
function addStoryListEntry(s,storyDetails) {
	$("#accordion").append( '<div class="panel panel-default">' +
		'<div class="panel-heading">' +
		  '<h4 class="panel-title">' +
			'<a data-toggle="collapse" data-parent="#accordion" href="#collapse' + s.getStoryId() + '" id="story-title">' + s.getTitle() + '</a><br>' +
			'<p id="story-author" >by ' + storyDetails.author.fullName + '</p>' +
		  '</h4>' +
		'</div>' +
		'<div id="collapse' + s.getStoryId() + '" class="panel-collapse collapse">' +
		  '<div class="panel-body" id="story-summary">' + s.getSummary() + '</div>' +
		'</div>' +
	  '</div>'
	 );
}

//--- hideStoryDetails method ---//
function hideStoryDetails() {
	$("#story-details-container").hide("fade");
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

//--- browseStories method ---//
function browseStories() {
	hideStoryDetails();
	showHintsPanel('Click on a story location marker on the map to bring up its details.');
	setTimeout(function() { hideHintsPanel(); }, 3500 );
	fitStoryOnView(storyMarkers);
	$('body').animate({scrollTop: 0}, 400);
}

function openVideoWindow() {
    $('#video-container').lightbox_me({
        centered: 	true,
		onLoad: 	function() {
			loadYTIframeAPI();
		},
		onClose:	function() {
			try { 
				player.destroy(); 
			}
			catch(err) { 
				////console.log(err) 
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
	player = new YT.Player('video-hero-1', {
		width: '640',
		height: '360',
		videoId: 'QPldHdOtuMU',
		events: {
			'onStateChange': onPlayerStateChange
		},
		playerVars: {
			autoplay: 0,
			controls: 0,
			modestbranding: 1,
			rel: 0,
			showInfo: 0,
			loop: 1
		}
	});
}

function onPlayerStateChange(event) {
	//console.log(event.data)
	if (event.data == YT.PlayerState.PLAYING) {
		//
	}
}

function stopVideo() {
	player.stopVideo();
}

function scrollToSoon() {
	var pos = $('#lir-soon-wrapper').offset()
	//window.scrollTo(0,pos.top-200);
	var body = $("html, body");
	body.animate({scrollTop:pos.top-200}, '500', 'swing');
}

//--- createStory method ---//
function createStory() {
	if (!user) {
		document.location.href = '/login'
		return;
	}
	var newTitle = 'Untitled Story';
	var story = newStoryObj();
	story.setTitle(newTitle);
	story.createStory(function(){
		var initPost = newPostObj();
		initPost.constructorStory(story);
		initPost.setIsInitPost(true);
		initPost.setTitle(newTitle);
		initPost.createPost(function () {
			story.addPost(initPost);
			story.setInitPost(initPost);
			story.updateStory(function(story) {
				//console.log(story.getStoryId());
				document.location.href = '/create/' + story.getStoryId()
			});
		});
	});
}



