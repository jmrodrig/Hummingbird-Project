
//--- initialize global variables ---//
var map;
var helpOn = true;
var userStories;
var defaultLocation = new google.maps.LatLng(38.711652, -9.131238);
var fitZoom;

var user;
var storyMarkerList;

var defaultStoryMapCss 
var defaultStoryMapColapseCss 
var openStoryMapCss 
var openStoryMapColapseCss 

//--- initialize method ---//
function initialize() {
	
	$('#blog-link').css('display' , 'block' );
	
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
			
			$('#create-link, #stories-link').css('display' , 'block' );
			$('#library-body h1').text(user.getFullName() + '\'s stories')
		}
	);



	initiateMap();
	
	intializeEvents();
	
	readUserStories();
}

function intializeEvents() {
	//----------------
	$('#content-wrapper').css({ height: $(window).innerHeight() });
	
	//----------------
	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');
	updateMapContainerSize();
	
	//----------------
	$('#btn-show-map').click(function() {
		$('#content-wrapper').toggleClass('map-open');
		toggleMapContainerState()
	});
	
	//----------------
	$(window).resize(function() {	
		$('#content-wrapper').css({ height: $(window).innerHeight() });
		$('#content-wrapper').removeClass('map-open');
		updateMapContainerSize();
		if ($(window).innerWidth() < 768) 
			$('#content-wrapper').addClass('container-collapsed');
		else 
			$('#content-wrapper').removeClass('container-collapsed');
			
		$('.story-container').removeClass('active').removeClass('options-active')
	});
	
	//----------------
	// $('#story-map').hover(function() {
		// if (!$('#content-wrapper').hasClass('container-collapsed'))
			// toggleOpenMap();
	// });
	
	var lastScrollTop = $('#library-body').scrollTop()
	
	$('#library-body').scroll(function() {
		var currentScrollTop = $('#library-body').scrollTop();
		lastScrollTop = retractNavBar(lastScrollTop,currentScrollTop);
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
			size = { left:.76*wS , top:0*hS, width:.24*wS , height:1.00*hS, borderRadius:0  }
	}
	$('#library-map').css(size)
	$('#map-canvas').css({width:size.width, height:size.height})
	google.maps.event.trigger(map, 'resize');	
}

function toggleMapContainerState() {
	var wS = $('#content-wrapper').innerWidth();
	var hS = $('#content-wrapper').innerHeight();
	defaultLibraryMapCss = { left:.76*wS , top:0*hS, width:.24*wS , height:1.00*hS, borderRadius:0  }
	defaultLibraryMapColapseCss = { left:.95*wS-50 , top:.95*hS-50, width:50 , height:50, borderRadius:25  }
	openLibraryMapCss = { left:.40*wS , top:0*hS, width:.60*wS , height:1.00*hS, borderRadius:0 }
	openLibraryMapColapseCss = { left:.10*wS , top:0*hS, width:.90*wS , height:1.00*hS, borderRadius:0 }
	
	if ($('#content-wrapper').hasClass('map-open')) {
		if ($('#content-wrapper').hasClass('container-collapsed'))
			resizeMap(defaultLibraryMapColapseCss,openLibraryMapColapseCss,true);
		else
			resizeMap(defaultLibraryMapCss,openLibraryMapCss,true);
	} else {
		if ($('#content-wrapper').hasClass('container-collapsed'))
			resizeMap(openLibraryMapColapseCss,defaultLibraryMapColapseCss,false);
		else
			resizeMap(openLibraryMapCss,defaultLibraryMapCss,false);
	}
}

function toggleOpenMap() {
	$('#content-wrapper').toggleClass('map-open');
	toggleMapContainerState()
}

function buildLibraryBody(userStories) {
	libraryBody = $("#library-body");
	
	userStories.forEach(function(story) {
		var storyContainer = $('<div/>').attr('id', 'story-' + story.id)
							.addClass('story-container')
							.addClass('animate-translation-all')
		
		//Thumbnail
		var imageContainer = $('<div class="image-container"/>').attr('id', 'image-story-' + story.id)
							.append('<img atl="image for ' + story.title + '">');
		
		
		imageContainer.find('img').load(function() {
			$(this).height(storyContainer.height())
			storyContainer.css({ width: $(this).width(), opacity:1 });
			$(this).unbind();
		});
		
		if (story.thumbnail && story.thumbnail.length > 0) 
			imageContainer.find('img').attr('src',story.thumbnail)
		else
			imageContainer.find('img').attr('src','/assets/images/logo-lir-thumbnail.png')

		storyContainer.append(imageContainer);
		
		// overlay container
		var overlayContainer = $('<div class="overlay-container animate-transition"/>').appendTo(storyContainer);
		
			// details container
			var detailsContainer = $('<div class="details-container"/>').appendTo(overlayContainer);
				
				//City
				if (story.locationName && story.locationName.length > 0) {
					var storyCity = $("<span class='story-city'></span>").appendTo(detailsContainer)
																		.text(story.locationName);
				}
				
			
				//Title
				detailsContainer.append("<div class='story-title'>" + story.title + "</div>");
				
				//Is Published
				if (story.published)
					detailsContainer.append("<div class='story-published'><em>- Published -</em></div>");
				
			// Summary container
			var summaryContainer = $('<div class="summary-container"/>').appendTo(overlayContainer);
			$('<a class="btn"><span class="glyphicon glyphicon-chevron-right"  aria-hidden="true"></span></a>')
				.click(function() { storyContainer.addClass("options-active") })
				.appendTo(summaryContainer);
				//Summary/ Intro Text
				var textarea = $('<textarea readonly class="story-summary" />').val(story.summary)
																				.appendTo(summaryContainer);
		
		
			// options container
			var optionsContainer = $('<div class="options-container"/>').appendTo(overlayContainer);
			$('<a class="btn"><span class="glyphicon glyphicon-chevron-left"  aria-hidden="true"></span></a>')
				.click(function() { storyContainer.removeClass("options-active") })
				.appendTo(optionsContainer);
			$('<a class="btn" href="/read/' + story.id + '">Read</a>').appendTo(optionsContainer);
			$('<a class="btn" href="/create/' + story.id + '">Edit</a>').appendTo(optionsContainer);
			$('<a class="btn">Remove</a>')
				.click(function() { storyContainer.addClass("delete-active") })
				.appendTo(optionsContainer);
		
			// delete dialogue container
			var deleteContainer = $('<div class="delete-container"/>').appendTo(overlayContainer)
			$('<p>This story will be deleted forever.<br>It can\'t be undone.<br>Would you like to proceed?</p>').appendTo(deleteContainer);
			$('<a class="btn btn-info">No</a>').click(function() { storyContainer.removeClass("delete-active") })
				.appendTo(deleteContainer);
			$('<a class="btn btn-warning">Yes</a>').click(function() { 
					deleteStory(story.id, function() {
						storyContainer.fadeOut(function() {
							storyContainer.remove();
							removeStoryMarker(story.id);
						});
						
					});
				})
				.appendTo(deleteContainer);
		
		//add to Library Body
		storyContainer.appendTo(libraryBody);
		
		// EVENTS
		// overlayContainer.click(function() {
			// storyContainer.addClass('options-active');
		// });
		
		storyContainer.hover(function() {
			if (!$('#content-wrapper').hasClass('container-collapsed')) {
				storyContainer.toggleClass('active').removeClass('options-active').removeClass('delete-active');
				if (storyContainer.hasClass('active')) 
					focusOnPostMarker(story.location)
				//else 
					//fitStoryOnView(storyMarkerList);
			}
		});
		
		storyContainer.click(function() {
			if ($('#content-wrapper').hasClass('container-collapsed') && !storyContainer.hasClass('active')) {
				$('.story-container').removeClass('active').removeClass('options-active')
				storyContainer.toggleClass('active').removeClass('options-active').removeClass('delete-active');
				if (storyContainer.hasClass('active')) 
					focusOnPostMarker(story.location)
				else 
					fitStoryOnView(storyMarkerList);
			}
		});
		
	});
	
	$('<div id="create-story" class="story-container">NEW</div>')
		.appendTo(libraryBody)
		.click(function() {
				createStory();
			});

	$('.story-container .image-container img').load(function() {
		var imageWidth = $(this).width(),
		imageHeight = $(this).height(),
		containerWidth = $(this).parent().width(),
		containerHeight = $(this).parent().height();
		
		if (imageWidth/imageHeight > containerWidth/containerHeight)
			$(this).height(containerHeight).css({ left: (containerWidth-containerHeight*imageWidth/imageHeight)/2, top: 0 })
		else
			$(this).width(containerWidth).css({left: 0, top: (containerHeight-containerWidth*imageHeight/imageWidth)/2 })
	});
};

//--- initiateMap method ---//
function initiateMap() {
	var mapOptions = {
		zoom : 16,
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
		google.maps.event.removeListener(listener);
	});
}

//--- method resizeMap ---//
function resizeMap(oldState,newState,isExpand) {	
	if (!map) return;
	if (isExpand) {
		$('#library-map').animate(newState, 500, 'easeOutCubic');
		$('#map-canvas').css( {width: newState.width, height: newState.height});
		google.maps.event.trigger(map, 'resize');
	} else {
		$('#library-map').animate( newState, 500, 'easeOutCubic', function() {
			$('#map-canvas').css( {width: newState.width, height: newState.height});
			google.maps.event.trigger(map, 'resize');
		});
	}
	panX = (oldState.width-newState.width)/2;
	panY = (oldState.height-newState.height)/2;
	map.panBy(panX,panY);
}


//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

//--- focusOnPostMarker ---//
function focusOnPostMarker(location) {
	var latlng = new google.maps.LatLng(location.latitude, location.longitude);
	map.panTo(latlng);
	map.setZoom(17);

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

//--- mapLeftClicked method ---//
function mapLeftClicked(mouseEvent) {
	if (!story) return;
	// random click does nothing
	if (!enablePostCreation) {
		return;
	}
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

//--- readUserStories method ---//
function readUserStories() {
	user.readStories(function(user){
		userStories = user.getStories();
		buildLibraryBody(userStories);
		drawPublishedStoryMarkersOnMap(userStories)
	});
}

//--- drawPublishedStoryMarkersOnMap method ---//
function drawPublishedStoryMarkersOnMap(userStories) {
	storyMarkerList = [];
	var story
	for ( var i = 0; i < userStories.length; i++) {
		story = userStories[i];
		if (story.location != null) { 
			var marker = new google.maps.Marker({
				position : new google.maps.LatLng(story.location.latitude, story.location.longitude, true),
				map : map,
				title : story.title,
				draggable : false
			});
			marker.storyId = story.id;
			// google.maps.event.addListener(marker, 'click', function() {
			// });
			storyMarkerList.push(marker);
		}
	fitStoryOnView(storyMarkerList);
	}
}

function deleteStory(storyId,onFinished) {
	stud_deleteStory(storyId, function() {
			//alert("deleted");
			if (onFinished){
				onFinished();
			}
		},
		function(){
			alert("failed");
		}
	);
}

//--- createStory method ---//
function createStory() {
	var newTitle = 'Untitled Story';
	while (!validateStoryTitle(newTitle))
		newTitle += '(1)'
	var story = newStoryObj();
	story.setTitle(newTitle);
	story.setLocation(0,0);
	story.setArticle("a","a","a","a");
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

function validateStoryTitle(title) {
	for ( var i = 0; i < userStories.length; i++) {
		if (userStories[i].title == title) return false
	}
	return true;
}

//--- toggleStatusIndicator method ---//
function toggleStatusIndicator() {
	$('#status').show();
	setTimeout(function() {
		$('#status').fadeOut(200);
	}, 1000);
}

function removeStoryMarker(storyId) {
	for ( var i = 0; i < storyMarkerList.length; i++) {
		var marker = storyMarkerList[i];
		if (marker.storyId == storyId) {
			marker.setMap(null);
			storyMarkerList.splice(i,1);
			return;
		}
	}
}

//--- Convert latLng in readable address ---//
function codeLatLng(latlng,element) {
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({'latLng': latlng }, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				element.text(buildStoryLocation(results[0]));
			}
		} else {
			console.log("Geocoder failed due to: " + status);
		}
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
