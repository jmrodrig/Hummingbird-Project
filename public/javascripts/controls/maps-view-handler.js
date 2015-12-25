
//--- initialize global variables ---//
var map;
var story;
var postWindow;
var user;
var playerStories = [];
var storyMarkers = [];


var leftClickedPost;
var enableTransitionSelectStartPost = false;
var enableTransitionCreation = false;

var defaultLocation = new google.maps.LatLng(38.75408327579141, -8.96484375);


//--- initialize method ---//
function initialize() {

	postWindow = new PostWindow();
	centerOnUserLocation();
	Dropzone.autoDiscover = false;
	
	user = newUserObj();
	user.constructor();
	user.readLoggedUser(function (user){
		if (user.getFullName()){
			$('#user-button').attr('data-toggle' , "dropdown" ).prop( "onclick", null ).html(user.getFullName() + '  <span class="caret">');
		}
	});
	
}

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

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
			console.log(user_location);
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
	console.log(mapOptions);
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
		console.log(publishedStories);
		loadPublishedStories(publishedStories);
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
							s.loadStoryElements(false,true, function(st){ 
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

//--- showStoryDetails method ---//
function showStoryDetails(story) {
	$("#story-title").text(story.getTitle());
	$("#story-author").text(" ");
	$("#story-summary").text(story.getSummary());
	$("#story-details-container").show();
}

//--- hideStoryDetails method ---//
function hideStoryDetails() {
	$("#story-details-container").hide();
}