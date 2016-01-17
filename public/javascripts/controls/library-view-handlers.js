
//--- initialize global variables ---//
var map;
var helpOn = true;
var publishedStories;
var defaultLocation;
var fitZoom;

var user = null;
var article = null;
var webUrl = null;
var storyMarkerList;
var selectedImageCount;

var iframesize;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"

var markerIcon;


var defaultStoryMapCss
var defaultStoryMapColapseCss
var openStoryMapCss
var openStoryMapColapseCss

var libOpenWidth = .5;
var mapOpenWidth = .9;

var fr = null;
var imageFile = null;

var lastAddress;

var isgrabWebsiteMetadataBusy;

//--- initialize method ---//
function initialize() {

	//$('#blog-link').css('display' , 'block' );

  defaultLocation = new google.maps.LatLng(37, -20);

  markerIcon = {
    url: "/assets/images/marker_icon.png",
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(13, 13)
  };

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
	$('#content-wrapper').css({ height: $(window).innerHeight() - $('nav.navbar').height() });

	//----------------
	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');

  //--- Google Analytics track event ----//
	$(".ga-event-map-publish").click( function() {
		ga('send','event','map', 'publish') //Google Analytics track event
	});

	//----------------
	$(window).resize(function() {
		$('#content-wrapper').css({ height: $(window).innerHeight() - $('nav.navbar').height() });

    //resize of Vine's iframe
    iframesize = $('.story-container').width();
    $('.vines-iframe').attr("width",iframesize)
                      .attr("height",iframesize);
    $('.article-embebed-iframe-container').height(iframesize);
	});

	var lastScrollTop = $('#library-body').scrollTop()

	// Retract Location Banner
	$('#content-wrapper').scroll(function() {
		var currentScrollTop = $('#content-wrapper').scrollTop();
		if (currentScrollTop < 300)
			$('#location-banner').css('top', 364 - currentScrollTop + 'px');
		else
			$('#location-banner').css('top', '64px');
	});

	$('#location-banner').keypress(function(e) {
    if(e.which == 13) {
        $("#content-wrapper").animate({ scrollTop: 0 }, "slow");
    }
});

  // RETRACT NAVBAR
	// $('#library-body').scroll(function() {
		// var currentScrollTop = $('#library-body').scrollTop();
		// lastScrollTop = retractNavBar(lastScrollTop,currentScrollTop);
	// });

  //ADD ARTICLE LINK
  $('#story-add-link-button').click(function() {
    $('#story-insert-article').show();
  })

	//STORY TEXT AREA: LOOK FOR URL AND SET ARTICLE
	$('#article-link').keyup(function() {
		txt = $(this).val();
		webUrl = getUrlFromText(txt);
		grabWebsiteMetadata(webUrl)
	});

  // ADD IMAGE FILE
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


  //CHOOSE ARTICLE IMAGE CONTROLS
  $('#article-img-select-prev').click(function() {
    selectedImageCount--;
    if (selectedImageCount < 0)
      selectedImageCount = 0;
    var link = article.imagelinks[selectedImageCount];
    $('#story-article .article-image').attr('src',link)
    article.imageUrl = link;
  });

  $('#article-img-select-next').click(function() {
    selectedImageCount++;
    if (selectedImageCount == article.imagelinks.length)
      selectedImageCount = article.imagelinks.length -1;
    var link = article.imagelinks[selectedImageCount];
    $('#story-article .article-image').attr('src',link)
    article.imageUrl = link;
  });
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
    var address = "";
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


		// ARTICLE CONTAINER
		if (story.articleTitle) {
      var articleContainer = $('<div class="article-container"/>').appendTo(storyContainer);
      if (getHostFromUrl(story.articleLink) == "vine.co") {
        buildVineContainer(story.articleLink).appendTo(articleContainer);
      } else {
        articleContainer.click(function() {window.open(story.articleLink);});
        var articleImageContainer = $('<div class="article-img-container"/>').appendTo(articleContainer)
                                    .append('<img class="article-image" src=' + story.articleImage + '>');

        var articleContentContainer = $('<div class="article-content-container"/>').appendTo(articleContainer)
  						.append('<h4 class="article-title" >' + story.articleTitle + '</h4>')
  						.append('<p class="article-description">' + story.articleDescription + '</p>')
  						.append('<p class="article-host">' + getHostFromUrl(story.articleLink) + '</p>')
      }
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

		// LIKE BUTTON
		var likeButtonText = (story.currentUserLikesStory) ? 'Liked' : 'Like';
		var likeButtonClass = (story.currentUserLikesStory) ? 'btn-primary' : 'btn-success';
		var likeButton = $('<a class="story-like-button btn ' + likeButtonClass + '" >' + likeButtonText + '  <span class="badge">' + story.likes + '</span></a>')
								.appendTo(storyContainer)
								.click(function() {
									var storyId = parseInt($(this).parent().attr('id').split('story-')[1])
									likeStory(storyId, function(result) {
										$('#story-' + storyId + ' .story-like-button span').html(result.noOfLikes);
										if (result.currentUserLikesStory) {
											$('#story-' + storyId + ' .story-like-button').removeClass('btn-success').addClass('btn-primary')
																																		.html('Liked  <span class="badge">' + result.noOfLikes + '</span>');
										} else {
											$('#story-' + storyId + ' .story-like-button').addClass('btn-success').removeClass('btn-primary')
																																		.html('Like  <span class="badge">' + result.noOfLikes + '</span>');
										}
									});
								});

		//add to Library Body
		storyContainer.appendTo(libraryBody);
	});

	$("textarea.story-summary, #story-text").elastic();
};

function addArticleContainer(data) {
	$('#story-article, #story-article *').show();
	$('#story-article .article-title').text(article.title);
	$('#story-article .article-description').text(article.description);
	$('#story-article .article-host').text(article.source);
  if (!article.imageUrl =="" && article.imagelinks.length == 0)
    $('#story-article .article-image').attr('src',article.imageUrl);
  else if (article.imageUrl=="" && article.imagelinks.length == 0)
    $('#story-article .article-img-container').hide();
  else {
    selectedImageCount = 0;
    article.imagelinks.splice(0,0,article.imageUrl);
    $('#story-article .article-image').attr('src',article.imagelinks[0]);
    $('.article-img-select-controls').show()
  }
}

function removeArticleContainer() {
	$('#story-article').hide();
	$('#story-article .article-image').attr('src',"");
	$('#story-article .article-title').text("");
	$('#story-article .article-description').text("");
	$('#story-article .article-host').text("");
  $('.article-img-select-controls').hide();
  $('#story-article .article-embebed-iframe-container').remove();
}

function addEmbedVineArticle(webUrl) {
  $('#story-article *').hide();
  buildVineContainer(webUrl).appendTo($('#story-article'));
  $('#story-article').show();
}

function buildVineContainer(link) {
  var iframeContainer = $('<div class="article-embebed-iframe-container"/>');
  var iframe = $('<iframe class="vines-iframe" frameborder="0"></iframe>').appendTo(iframeContainer)
                                          .load(function() {
                                            iframesize = $('.story-container').width();
                                            iframe.attr("width",iframesize)
                                                  .attr("height",iframesize);
                                            iframeContainer.height(iframesize)
                                                           .show();
                                          })
                                          .attr('src',link + "/embed/simple");
  return iframeContainer;
}

//--- initiateMap method ---//
function initiateMap() {
	var mapOptions = {
		zoom : 2,
		streetViewControl: true,
		streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
    scaleControl : true,
		zoomControl : true,
		zoomControlOptions : {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
		mapTypeId : google.maps.MapTypeId.HYBRID,
		mapTypeControl : true,
		mapTypeControlOptions : {style: google.maps.MapTypeControlStyle.DEFAULT, position: google.maps.ControlPosition.LEFT_BOTTOM},
		center : defaultLocation
	}

	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);

	//--- Map Event Handlers ---//
	var listener = google.maps.event.addListener(map, 'tilesloaded', function() {
		//google.maps.event.addListener(map, 'center_changed', mapCenterChanged);
		//google.maps.event.addListener(map, 'zoom_changed', mapCenterChanged);
		google.maps.event.removeListener(listener);
	});

	//updateFocusedAddress();

  //-- SearchBox --//
  var input = document.getElementById('location-input');
  var searchBox = new google.maps.places.SearchBox(input);
  //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  //Bias the SearchBox results towards current map's viewport.
  searchBox.setBounds(map.getBounds());
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();
    if (places.length == 0)
      return;
    map.setCenter(places[0].geometry.location);
  });
}

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

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
	//updateFocusedAddress();
}

function updateFocusedAddress() {
	var addr = getAddressFromLatLng(map.getCenter());
  $('#story-user .address').html(" at " + addr + ".");
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
		selectedStories = selectPublishStoriesWithinRadiusAndPivot(publishedStories,map.getCenter(),computeRadarRadius());
		//sortedStories = sortStoriesWithDistance(selectedStories,map.getCenter())
		buildLibraryBody(selectedStories);
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
function getAddressFromLatLng(latlng, callback) {
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({'latLng': latlng }, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results[0]) {
				callback(results[0].formatted_address);
			}
		} else {
      callback("");
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
	story.setSummary($('#story-text').val());
  //setArticle
  if (article) {
		story.setArticle(article.title,
						article.description,
						article.imageUrl,
						webUrl,
          "","","")
	}
  //set location name
  story.setLocationName("");

  //save story on server
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
  if (isgrabWebsiteMetadataBusy)
    return;

  isgrabWebsiteMetadataBusy = true;

  if (!webUrl) {
    article = null;
    removeArticleContainer();
    grabWebsiteMetadataReady();
    return false;
  }

  stud_fetchHtml(webUrl, function(data) {
    article = data;
    if (article.source == "vine.co")
      addEmbedVineArticle(article.url);
    else
		  addArticleContainer(data);
    grabWebsiteMetadataReady();
		return true;
	},
	function() {
		console.log("failed to grab metadata")
    article = null;
    removeArticleContainer();
    grabWebsiteMetadataReady();
		return false;
	})
}

function grabWebsiteMetadataReady() {
  isgrabWebsiteMetadataBusy = false;
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
	$('#story-image-container').hide();

  removeArticleContainer();
  $('#article-link').val("");
  $('#story-insert-article').hide();
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

function likeStory(storyId, onFinished){
	$.ajax({
		url: "/story/" + storyId + "/like",
		type: "POST",
		dataType: "json",
		success: onFinished,
		error: function() {console.log("Couln't like story");}
	});
}

function computeRadarRadius() {
	zoom=map.getZoom()
	radius = 3*Math.pow(2,21-zoom);
	return radius;
}
