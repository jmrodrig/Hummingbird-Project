
//--- initialize global variables ---//
var map;
var helpOn = true;
var publishedStories;
var defaultLocation = new google.maps.LatLng(38.711652, -9.131238);
var fitZoom;

var user = null;
var article = null;
var webUrl = null;
var storyMarkerList;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"

var markerIcon = {
  url: "/assets/images/marker_icon.png",
  origin: new google.maps.Point(0, 0),
  anchor: new google.maps.Point(13, 13)
};


var defaultStoryMapCss 
var defaultStoryMapColapseCss 
var openStoryMapCss 
var openStoryMapColapseCss 

var libOpenWidth = .6;
var mapOpenWidth = .9;

var fr = null;
var imageFile = null;

var lastAddress;

var grabMetadataOnPause = true;

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
			
			$('#user-link div, #user-thumbnail').css('background-image','url(' + avatarUrl + ')');
			$('#story-username-location').html(user.getFullName())
		},
		function (){
			user = null
			$('#login-link, #stories-link').css('display' , 'block' );
		}
	);



	initiateMap();
	
	intializeEvents();
	
	readPublishedStories();
}

function intializeEvents() {
	//----------------
	$('#content-wrapper').css({ height: $(window).innerHeight() });
	
	//----------------
	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');
	updateMapContainerSize(libOpenWidth,mapOpenWidth);
	
	//----------------
	$('#btn-show-map').click(function() {
		$('#content-wrapper').toggleClass('map-open');
		toggleMapContainerState(libOpenWidth,mapOpenWidth)
	});
	
	$(".ga-event-map-publish").click( function() {
		ga('send','event','map', 'publish') //Google Analytics track event
	});
	
	//----------------
	$(window).resize(function() {	
		$('#content-wrapper').css({ height: $(window).innerHeight() });
		$('#content-wrapper').removeClass('map-open');
		updateMapContainerSize(libOpenWidth,mapOpenWidth);
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
	
	// $('#library-body').scroll(function() {
		// var currentScrollTop = $('#library-body').scrollTop();
		// lastScrollTop = retractNavBar(lastScrollTop,currentScrollTop);
	// });	
	
	// STORY TEXT AREA
	$('#story-text').keyup(function() {
		txt = $(this).val();
		webUrl = getUrlFromText(txt);
		if (grabMetadataOnPause && webUrl) {
			grabMetadataOnPause = false;
			grabWebsiteMetadata(webUrl)
			setTimeout(function() { pauseGrabMetadata(); }, 1000 );
		}
	});
	
	function pauseGrabMetadata() {
		grabWebsiteMetadata(webUrl);
		grabMetadataOnPause = true
	}
	
	$('#f').change(function(ev) {
		imageFile = ev.target.files[0];
		var fileReader = new FileReader();
		
		if (imageFile) {
			$('#story-image-container').show();
		} else {
			$('#story-image-container').hide();
		}
		
		fileReader.onload = function(ev2) {
			console.dir(ev2);
			$('#story-image').attr('src', ev2.target.result);
		};
		
		fileReader.readAsDataURL(imageFile);
		fr = fileReader;
	});
	
}

function updateMapContainerSize(libOpenWidth,mapOpenWidth) {
	var mapClosedWidth = 1-libOpenWidth;
	var libClosedWidth = 1 - mapOpenWidth;
	var wS = $('#content-wrapper').innerWidth();
	var hS = $('#content-wrapper').innerHeight();
	if ($('#content-wrapper').hasClass('map-open')) {
		if ($('#content-wrapper').hasClass('container-collapsed'))
			size = { left:.10*wS , top:0*hS, width:.90*wS , height:1.00*hS, borderRadius:0 }
		else
			size = { left:(1-mapOpenWidth)*wS , top:0*hS, width:mapOpenWidth*wS , height:1.00*hS, borderRadius:0 }
	} else {
		if ($('#content-wrapper').hasClass('container-collapsed'))
			size = { left:.95*wS-50 , top:.95*hS-50, width:50 , height:50, borderRadius:25  }
		else
			size = { left:(1-mapClosedWidth)*wS , top:0*hS, width:mapClosedWidth*wS , height:1.00*hS, borderRadius:0  }
	}
	$('#library-map').css(size)
	$('#map-canvas').css({width:size.width, height:size.height})
	google.maps.event.trigger(map, 'resize');	
}

function toggleMapContainerState(libOpenWidth,mapOpenWidth) {
	var mapClosedWidth = 1-libOpenWidth;
	var libClosedWidth = 1 - mapOpenWidth;
	var wS = $('#content-wrapper').innerWidth();
	var hS = $('#content-wrapper').innerHeight();
	defaultLibraryMapCss = { left:(1-mapClosedWidth)*wS , top:0*hS, width:mapClosedWidth*wS , height:1.00*hS, borderRadius:0  }
	defaultLibraryMapColapseCss = { left:.95*wS-50 , top:.95*hS-50, width:50 , height:50, borderRadius:25  }
	openLibraryMapCss = { left:(1-mapOpenWidth)*wS , top:0*hS, width:mapOpenWidth*wS , height:1.00*hS, borderRadius:0 }
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

function toggleOpenMap(libOpenWidth,mapOpenWidth) {
	$('#content-wrapper').toggleClass('map-open');
	toggleMapContainerState(libOpenWidth,mapOpenWidth)
}

function buildLibraryBody(stories) {

	$('.story-container').remove();
	var libraryBody = $("#library-body");
	
	if(!stories[0]) {
		$('#no-stories-message').show();
		return;
	} else
		$('#no-stories-message').hide();
	
	stories.forEach(function(story) {
		var storyContainer = $('<div/>').attr('id', 'story-' + story.id)
							.addClass('story-container')

		
		//Story author container
		var authorContainer = $('<div class="author-container"/>').appendTo(storyContainer);
		
		//Story author thumbnail
		if (story.author.avatarUrl)
			avatarUrl = story.author.avatarUrl;
		else
			avatarUrl = defaultAvatarPic
		var authorThumbnail = $("<div class='story-author-thumbnail'></div>")
								.css('background-image','url(' + avatarUrl + ')')
								.appendTo(authorContainer)
						
		//Story author & Location
		var authorName = story.author.fullName;
		authorContainer.append("<span class='story-author-location'>" + authorName +  "</span>");
		if (story.locationName && story.locationName.length > 0)
			address = " at " + story.locationName + "."
		authorContainer.append('<span class="address">' + address + '</span>');
		
		// Summary container
		if (story.summary && story.summary.length > 0) {
			var summaryContainer = $('<div class="summary-container"/>').appendTo(storyContainer);
			var textarea = $('<textarea readonly class="story-summary"></textarea>').val(story.summary)
																		.appendTo(summaryContainer);
		}

		//Thumbnail
		if (story.thumbnail && story.thumbnail.length > 0) {
			var imageContainer = $('<div class="image-container"/>').attr('id', 'image-story-' + story.id)
								.append('<img atl="image for ' + story.title + '">');
								
			imageContainer.find('img').load(function() {
				// $(this).height(storyContainer.height())
				// storyContainer.css({ width: $(this).width(), opacity:1 });
				$(this).unbind();
			});
			

			imageContainer.find('img').attr('src',story.thumbnail)

			storyContainer.append(imageContainer);
		}
		
		
		// article container
		if (story.articleTitle) {
			var articleContainer = $('<div class="article-container"/>').appendTo(storyContainer)
						.append('<img class="article-image" src=' + story.articleImage + '">')
						.append('<a class="article-title" href="'+ story.articleLink +'">' + story.articleTitle + '</a>')
						.append('<textarea readonly class="article-description" rows=4>' + story.articleDescription + '</textarea>')
						.append('<p class="article-host">' + getHostFromUrl(story.articleLink) + '</p>');			
		}
		

		//UNPUBLISH BUTTON
		var id = story.id;
		if (story.author.email == user.getEmail() || story.author.email.indexOf("ideas@lostinreality.net")) {
			var unpublishButton = $('<a class="story-unpublish-button btn btn-warning" >Unpublish</a>')
									.appendTo(storyContainer)
									.click(function() {
										var storyId = parseInt($(this).parent().attr('id').split('story-')[1])
										unpublish(storyId, function() {
											clearAllMarkers();
											readPublishedStories();
										});
									});
			
		}

		//add to Library Body
		storyContainer.appendTo(libraryBody);	
		
		
	});
	
	$("textarea.story-summary, #story-text").elastic();
	
	
};

function addArticleContainer(data) {
	article = data;
	$('#story-create-article').show();
	$('#story-create-article .article-image').attr('src',article.imageUrl)
	$('#story-create-article .article-title').text(article.title)
	$('#story-create-article .article-description').text(article.description)
	$('#story-create-article .article-host').text(article.host)						
}

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
		mapTypeControlOptions : {style: google.maps.MapTypeControlStyle.DEFAULT, position: google.maps.ControlPosition.LEFT_BOTTOM},
		center : defaultLocation
	}
		
	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);

	//--- Map Event Handlers ---//
	var listener = google.maps.event.addListener(map, 'tilesloaded', function() {
		google.maps.event.addListener(map, 'click', mapLeftClicked);
		google.maps.event.addListener(map, 'dragend', mapCenterChanged);	
		google.maps.event.addListener(map, 'zoom_changed', mapCenterChanged);		
		google.maps.event.removeListener(listener);
	});
	
	updateFocusedAddress();
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

function mapCenterChanged() {
	//console.log("mapCenterChanged");
	selectedStories = selectPublishStoriesWithinRadiusAndPivot(publishedStories,map.getCenter(),computeRadarRadius());
	sortedStories = sortStoriesWithDistance(selectedStories,map.getCenter())
	buildLibraryBody(sortedStories);
	updateFocusedAddress();
}

function updateFocusedAddress() {
	getAddressFromLatLng(map.getCenter(),$('#story-user .address'));
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

//--- readPublishedStories method ---//
function readPublishedStories() {
	var lirmanager = newLirManagerObj();
	lirmanager.readPublishedStories(function(lirmanager){
		publishedStories = lirmanager.getStories();
		drawPublishedStoryMarkersOnMap(publishedStories)
		//console.log(publishedStories);
		selectedStories = selectPublishStoriesWithinRadiusAndPivot(publishedStories,map.getCenter(),computeRadarRadius());
		sortedStories = sortStoriesWithDistance(selectedStories,map.getCenter())
		buildLibraryBody(sortedStories);
	});
}

function getPublishedStoryById(storyId) {
	publishedStories.forEach(function(st) {
		if (st.id==storyId)
			return st;
	})
	return null;
}

function removePublishedStoryById(storyId) {
	story = getPublishedStoryById(storyId)
	index = publishedStories.indexOf();
	publishedStories.splice(index,1);
}


function selectPublishStoriesWithinRadiusAndPivot(publishedStories,pivot,radius) {
	selected = [];
	publishedStories.forEach(function(story) {
		if (computeStoryDistance(pivot,story)<radius)
			selected.push(story);
	});
	return selected;
}

function sortStoriesWithDistance(stories,pivot) {
	if (stories.length==0)
		return stories;
	var pivot_ = pivot
	var stories_ = stories
	var sortedList = [];
	sortedList.push(stories_[0])
	stories_.splice(0, 1);
	stories_.forEach(function(st) {
		//var story = st
		var d_sorting = computeStoryDistance(pivot_,st)
		for (var i in sortedList) {
			sortedSt = sortedList[i]
			d_sorted = computeStoryDistance(pivot_,sortedSt)
			if (d_sorting < d_sorted) {
				sortedList.splice(i,0,st)
				break;
			} else if( i == sortedList.length-1) {
				sortedList.push(st)
			}
		}
	})
	return sortedList;
}
	


function computeStoryDistance(pivotLatLng,story) {
	storyLatLng = new google.maps.LatLng(story.location.latitude, story.location.longitude, true)	
	distance = google.maps.geometry.spherical.computeDistanceBetween(pivotLatLng, storyLatLng);
	return distance
}

//--- drawPublishedStoryMarkersOnMap method ---//
function drawPublishedStoryMarkersOnMap(publishedStories) {
	storyMarkerList  = new Hashtable();
	var story
	for ( var i = 0; i < publishedStories.length; i++) {
		publishedStory = publishedStories[i];
		if (publishedStory.location != null) { 
			var marker = new google.maps.Marker({
				position : new google.maps.LatLng(publishedStory.location.latitude, publishedStory.location.longitude, true),
				icon: markerIcon,
				map : map,
				draggable : false
			});
			// google.maps.event.addListener(marker, 'click', function() {
			// });
			storyMarkerList.put(publishedStory.id,marker);
		}
	//fitStoryOnView(storyMarkerList);
	}
}

//--- Convert latLng in readable address ---//
function getAddressFromLatLng(latlng,element) {
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({'latLng': latlng }, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				lastAddress = results[0].formatted_address
				element.html(" at " + results[0].formatted_address + ".");
				
			}
		} else {
			element.html("");
			lastAddress = "";
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

function getMapCenter() {
	console.log(map.getCenter())
	return map.getCenter();
}



//--- createStory method ---//
function createStory() {
	if (!user)
		return;
	getMapCenter()
	story = newStoryObj(map);
	//set new story title
	story.setTitle("story_" + user.getEmail() + "_" + new Date().getTime());
	story.setLocation(getMapCenter().lat(),getMapCenter().lng())
	story.setLocationName(lastAddress);
	story.setSummary($('#story-text').val());
	if (article) {
		story.setArticle(article.title,
						article.description,
						article.imageUrl,
						webUrl)	
	}
	//setArticle	
	story.createStory(function(st){
		//upload story pics
		var story = st
		storyId = story.getStoryId()
		if (imageFile) {
			uploadStoryImage(storyId,function() {
				story.publishStory(1,function() {publishFinished(storyId);})
			});
		} else {
			//publish
			story.publishStory(1,function() {publishFinished(storyId);})
		}
	});
}

function uploadStoryImage(storyId,onFinished) {
	url = '/story/'+storyId+'/uploadimage';
	var uploadImageForm = new FormData($('#image-upload-form')[0]);
	$.ajax( {
	  url: url,
	  type: 'POST',
	  data:  uploadImageForm,
	  processData: false,
	  contentType: false,
	  success: onFinished
	} );
}

function getUrlFromText(text) {
	var regex = ""
	if (text.indexOf("http://") > -1)
		regex = "http://"
	else if (text.indexOf("https://") > -1)
		regex = "https://"
	else if (text.indexOf("www.") > -1)
		regex = "www."
	else
		return false;
		
	url = text.split(regex)[1].split(" ")[0]
	
	if (regex == "www.")
		regex = "http://www."
	
	return regex + url
		
		
}

function grabWebsiteMetadata(webUrl) {
	stud_fetchHtml(webUrl, function(data) {
		addArticleContainer(data);	
		return true;
	},
	function() {
		console.log("failed to grab metadata")
		return false;
	})
}

function getHostFromUrl(url) {
	return url.split("//")[1].split("/")[0]
}

function publishFinished(storyId) {
	cleanStoryCreationElements();
	clearAllMarkers()
	
	readPublishedStories();
}

function cleanStoryCreationElements() {
	article = null;
	imageFile = null;
	webUrl = null;
	
	$('#story-text').val("");
	$('#story-text').height(75);
	$('#story-create-article').hide()
	$('#story-image-container').hide();
}

function clearAllMarkers() {
	markers = storyMarkerList.values();
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
}

function unpublish(storyId, onFinished){
	$.ajax({
		url: "/story/" + storyId + "/publish/0", 
		type: "POST",
		dataType: "json",
		// contentType:"application/json",
		success: onFinished,
		error: function() {console.log("Couln't unpublish story");}
	});
}

function computeRadarRadius() {
	zoom=map.getZoom()
	radius = 3*Math.pow(2,21-zoom);
	return radius;
}

