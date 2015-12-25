
//--- initialize global variables ---//
var map;
var helpOn = true;
var story;
var defaultLocation = new google.maps.LatLng(38.711652, -9.131238);
var fitZoom;

var user;

var posts;

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
			$('#create-link, #stories-link').css('display' , 'block' );
			$('#user-link').html('<div/><span>' + user.getFullName() + '  <span class="caret"></span></span>')
							.css('display' , 'block' );
			$('#user-link div').css('background-image','url(' + avatarUrl + ')');
			if (avatarUrl) $('#user-link').addClass('with-avatar');
		},
		function (){
			$('#login-link, #create-link, #stories-link').css('display' , 'block' );
		}
	);


	initiateMap();
	storyId = document.URL.split("/read/")[1];
	
	story = new newStoryObj(map);
	story.constructorId(storyId);
	story.readStory( function(s) {
		s.loadStoryElements(true,true,true, function(s){ 
			posts = story.getOrderedPosts();
			//posts = story.getPosts();
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
	$('#content-wrapper').css({ height: $(window).innerHeight() });
	
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
		if ($('#content-wrapper').hasClass('container-collapsed')) toggleMapContainerState()
	});
	
	$('#btn-show-sharing').click(function() {
		$('a.sharing').toggleClass('collapsed');
	});
	
	// $('#story-menu').hover(function() {
		// if ($('#content-wrapper').hasClass('container-collapsed')) return;
		// $('#content-wrapper').removeClass('map-open');
		// $('#content-wrapper').toggleClass('posts-open');
	// });
	
	//----------------
	$(window).resize(function() {	
		$('#content-wrapper').css({ height: $(window).innerHeight() });
		$('#content-wrapper').removeClass('map-open');
		updateMapContainerSize();
		if ($(window).innerWidth() < 768) 
			$('#content-wrapper').addClass('container-collapsed');
		else 
			$('#content-wrapper').removeClass('container-collapsed');
	});
	
	//----------------
	// $('#story-map').hover(function() {
		// if (!$('#content-wrapper').hasClass('container-collapsed'))
			// toggleOpenMap();
	// });
	
	var lastScrollTop = $('#story-body').scrollTop()
	
	$('#story-body').scroll(function() {
		var currentScrollTop = $('#story-body').scrollTop();
		lastScrollTop = retractNavBar(lastScrollTop,currentScrollTop);
	});	
	
	$('.popup').click(function(event) {
		var width  = 575,
			height = 400,
			left   = ($(window).width()  - width)  / 2,
			top    = ($(window).height() - height) / 2,
			url    = this.href,
			opts   = 'status=1' +
					 ',width='  + width  +
					 ',height=' + height +
					 ',top='    + top    +
					 ',left='   + left;
		
		window.open(url, 'popup', opts);
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
			size = { left: wS-50-50 , top: hS-50-50, width:50 , height:50, borderRadius:25  }
		else
			size = { left:.76*wS , top:0*hS, width:.24*wS , height:1.00*hS, borderRadius:0  }
	}
	$('#story-map').css(size)
	$('#map-canvas').css({width:size.width, height:size.height})
	google.maps.event.trigger(map, 'resize');	
}

function toggleMapContainerState() {
	var wS = $('#content-wrapper').innerWidth();
	var hS = $('#content-wrapper').innerHeight();
	defaultStoryMapCss = { left:.76*wS , top:0*hS, width:.24*wS , height:1.00*hS, borderRadius:0  }
	defaultStoryMapColapseCss = { left: wS-50-50 , top: hS-50-50, width:50 , height:50, borderRadius:25  }
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
	
	//Prologue/Intro Image
	var imageContainer = $('<div class="image-container"/>').attr('id', 'image-post-' + story.getInitPost().getPostId())
							.append('<img atl="image for ' + story.getInitPost().getTitle() + '">');
	
	if (story.getInitPost().getImageUrl() && story.getInitPost().getImageUrl().length > 0)
		imageContainer.find('img').attr('src',story.getInitPost().getImageUrl())
	else {
		imageContainer.addClass('no-image');
	}
		
	storyHeader.append(imageContainer);
	
	//Location
	var locationElement = $('<div class="post-location"/>')
	
	if (story.getLocationName() && story.getLocationName().length > 0)
		locationElement.text(story.getLocationName());
	else
		locationElement.hide();

	storyHeader.append(locationElement);

	
	//Title
	titleElement = $('<div class="post-title"/>')
	
	if (story.getTitle() && story.getTitle().length > 0)
		titleElement.text(story.getTitle());
	else
		titleElement.text('');

	storyHeader.append(titleElement);
	
	//Author
	storyHeader.append("<div class='post-author'><em>by " + story.getAuthor().fullName + "</em></div>");
	
	//Summary/ Intro Text
	var textElement = $('<div class="post-text" />')
	
	if (story.getInitPost().getText() && story.getInitPost().getText().length > 0)
		textElement.html(story.getInitPost().getText().replace( /\r?\n/g, '<br>' ));
	else
		textElement.text('');
	
	storyHeader.append(textElement);
	
	//Post Overlay
	storyHeader.append("<div class='post-overlay'/>");
		
	storyHeader.appendTo(storyBody);
	
	//Posts
	posts.forEach(function(p) {
		if (!p.isInitPost())
			buildPostDomElementsEdit(p).appendTo(storyBody);
	});	
	
	//SHARING
	$('<div class="sharing-container" />')
		.append('<a class="social facebook" onclick="openFacebookSharePopup()"></a>')
		.append('<a class="social twitter popup" onclick="openTwitterSharePopup()"></a>')
		.append('<a class="social mail" onclick="openLinkSharePopup()"></a>')
	.appendTo(storyBody);
	
	//APP SOON BANNER
	$('<div class="banner-container" />')
		.append('<img id="app-soon-banner" atl="banner" src="/assets/images/app_soon.png">')
	.appendTo(storyBody);
	
	// EVENTS
	$('.post-text').elastic()
	
	$('img').load(function() {
		$('#story-body').scrollspy('refresh');
	});
};

//--- Method buildPostDomElementsEdit ---// 
function buildPostDomElementsEdit(post) {
	var postDomElement = $('<div/>').attr('id', 'post-' + post.getPostId())
								.addClass('post-node')
								.addClass('story-post');
	
	//Title
	var title
	if (post.getTitle() && post.getTitle().length > 0)
		title = post.getTitle();
	else
		title = 'New Location';

	$('<div class="post-title" />').html('<span class="glyph flaticon-facebook30"></span> ' + title)
										.appendTo(postDomElement);
	
	//Post Image
	var imageContainer = $('<div class="image-container"/>').attr('id', 'image-post-' + post.getPostId())
							.append('<img atl="image for ' + post.getTitle() + '">');
	
	if (post.getImageUrl() && post.getImageUrl().length > 0)
		imageContainer.find('img').attr('src',post.getImageUrl())
	else {
		imageContainer.addClass('no-image');
	}
	
	postDomElement.append(imageContainer);


	//Text
	var textElement = $('<div class="post-text"/>');
		
	if (post.getText() && post.getText().length > 0)
		textElement.html(post.getText().replace( /\r?\n/g, '<br>' ));
	else
		textElement.html('');
	
	postDomElement.append(textElement);
	
	//Post Overlay
	postDomElement.append("<div class='post-overlay'/>");
	
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
			.append(story.getInitPost().getTitle())
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
			offset: 0						
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
	});
	
	storyMenu.append('<p id="status"/>');
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
			.append('<span class="glyph flaticon-facebook30"></span>')
			.append(title)
	);

	//click event
	postItem.click(function() {});
	
	return postItem
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


//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

//--- Convert latLng in readable address ---//
function codeLatLng(latlng) {
	geocoder.geocode({'latLng': latlng}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[1]) {
				map.setZoom(11);
				marker = new google.maps.Marker({
					position: latlng,
					map: map
				});
				infowindow.setContent(results[1].formatted_address);
				infowindow.open(map, marker);
			}
		} else {
			alert("Geocoder failed due to: " + status);
		}
	});
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

function openLinkSharePopup() {
	$("#link-dialogue").fadeIn(200);
}