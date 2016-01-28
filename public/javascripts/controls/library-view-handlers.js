
//--- initialize global variables ---//
var map;
var markercluster;
var helpOn = true;
var publishedStories;
var defaultLocation;
var fitZoom;

var storymap;
var storyLocationMarker;
var storylocation;
var locationName;

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
var saveimagefile = null;

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

			$('#user-link div,#create-story-view-container #user-thumbnail').css('background-image','url(' + avatarUrl + ')');
			$('#story-username').html(user.getFullName())
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
    // iframesize = $('.article-container').width();
    // $('.vines-iframe').attr("width",iframesize)
    //                   .attr("height",iframesize);
    // $('.article-embebed-iframe-container').height(iframesize)
    //                                       .width(iframesize);
	});

	var lastScrollTop = $('#library-body').scrollTop()

	// Retract Location Banner
	$('#content-wrapper').scroll(function() {
		var currentScrollTop = $('#content-wrapper').scrollTop();
		if (currentScrollTop < 350)
      $('#location-banner').removeClass('animate-transition collapsed-navbar');
    else
			$('#location-banner').addClass('collapsed-navbar animate-transition');

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

  //remove STORY IMAGE
  $('#remove-story-image').click(function() {
    $('#story-image-container').hide();
    $('#story-image').attr('src','');
    saveimagefile = null;
  });

  //add ARTICLE LINK
  $('#story-add-link-button').click(function() {
    $('#story-insert-article').show();
  });

  //remove ARTICLE LINK
  $('#close-article-link').click(function() {
    $('#story-insert-article').hide();
    $('#article-link').val('');
    article = null;
    removeArticleContainer();
  });

	//STORY TEXT AREA: LOOK FOR URL AND SET ARTICLE
	$('#article-link').keyup(function() {
		txt = $(this).val();
		webUrl = getUrlFromText(txt);
		grabWebsiteMetadata(webUrl)
	});

  // ADD IMAGE FILE
	$('#f').change(function(ev) {
		saveimagefile = ev.target.files[0];
		var fileReader = new FileReader();

		if (saveimagefile) {
			$('#story-image-container').show();
		} else {
			$('#story-image-container').hide();
		}

		fileReader.onload = function(ev2) {
			console.dir(ev2);
			$('#story-image').attr('src', ev2.target.result);
		};
		fileReader.readAsDataURL(saveimagefile);
		fr = fileReader;
	});

}

function buildLibraryBody(stories) {

	$('.story-container').remove();
	var libraryBody = $("#library-body");

	if(!stories || !stories[0]) {
		$('#no-stories-message').show();
		return;
	} else
		$('#no-stories-message').hide();

	stories.forEach(function(story) {
		var storyContainer = $('<div/>').attr('id', 'story-' + story.id)
							.addClass('story-container')

		//Story container header
		var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
		//Story container body
		var storyContainerBody = $('<div class="story-container-body"/>').appendTo(storyContainer)
                                                                      .click(function() {
                                                                        openStoryView({readonly:true, story:story});
                                                                      });
		//Story container footer
		var storyContainerFooter = $('<div class="story-container-footer"/>').appendTo(storyContainer);

		//Story author container
		var authorContainer = $('<div class="author-container pull-left"/>').appendTo(storyContainerHeader);

		//Story author thumbnail
		if (story.author.avatarUrl)
			avatarUrl = story.author.avatarUrl;
		else
			avatarUrl = defaultAvatarPic
		var authorThumbnail = $("<div class='story-author-thumbnail'></div>")
								.css('background-image','url(' + avatarUrl + ')')
								.appendTo(authorContainer)

		//Story author name
		var authorName = story.author.fullName;
		authorContainer.append("<span class='story-author-name'>" + authorName +  "</span>");


		//Story location container
		var locationContainer = $('<div class="location-container pull-right"/>').appendTo(storyContainerHeader)


		var location = "";
    if (story.locationName && story.locationName.length > 0)
			location = story.locationName;
		$('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-15px flaticon-facebook30"></div>').appendTo(locationContainer);
		$('<p class="location">' + location + '</p>').appendTo(locationContainer);


		// Summary container
		if (story.summary && story.summary.length > 0) {
			var summaryContainer = $('<div class="summary-container collapsed"/>').appendTo(storyContainerBody);
			var summary = $('<p class="story-summary"></p>').appendTo(summaryContainer);
      summary[0].innerText = story.summary;
      $('<div class="summary-container-overlay"/>').appendTo(summaryContainer);
		}

		//Thumbnail
		if (story.thumbnail && story.thumbnail.length > 0) {
			var imageContainer = $('<div class="image-container"/>').attr('id', 'image-story-' + story.id)
								.append('<img atl="image for ' + story.title + '">');
			imageContainer.find('img').attr('src',story.thumbnail)
			imageContainer.appendTo(storyContainerBody);
		}


		// ARTICLE CONTAINER
		if (story.articleLink) {
      buildArticleContainer({
        title: story.articleTitle,
        description: story.articleDescription,
        author: story.articleAuthor,
        imageUrl: story.articleImage,
        source: story.articleSource,
        url: story.articleLink
      },storyContainerBody,{colapsedescription:true});
		}


		// //UNPUBLISH BUTTON
		// var id = story.id;
		// if (story.author.email == user.getEmail() || user.getEmail().indexOf("@lostinreality.net") > -1) {
		// 	var unpublishButton = $('<a class="story-unpublish-button btn btn-warning" storyId= ' + id + ' >Unpublish</a>')
		// 							.appendTo(storyContainerFooter)
		// 							.click(function() {
		// 								var storyId = $(this).attr('storyId');
		// 								unpublish(storyId, function() {
		// 									clearAllMarkers();
		// 									readPublishedStories();
		// 								});
		// 							});
    //
		// }

		// LIKE BUTTON
    storyContainerFooter.append(buildLikeButton(story));

    // SAVE BUTTON
    storyContainerFooter.append(buildSaveStoryButton(story));

		//add to Library Body
		storyContainer.appendTo(libraryBody);
	});

	loadStoryTextBehaviours();

};

function addArticleContainer(art) {
  removeArticleContainer();
  buildArticleContainer(art,$('#create-story-view-container .story-container-body'),{colapsedescription:false})
}

function removeArticleContainer() {
  $('#create-story-view-container .article-container').remove();
}

function buildArticleContainer(art,addToContainer,options) {
  var articleContainer = $('<div class="article-container"/>').appendTo(addToContainer);

  if (getHostFromUrl(art.url) == "vine.co") {
    buildVineContainer(art.url,articleContainer,options);
  } else if (getHostFromUrl(art.url) == "www.youtube.com") {
    buildYouTubeContainer(art.url,articleContainer,options);
  } else if (getHostFromUrl(art.url) == "vimeo.com") {
    buildVimeoContainer(art.url,articleContainer,options);
  } else {
    articleContainer.click(function() {window.open(art.url);});

    if (art.imageUrl != "") {
      var articleImageContainer = $('<div class="article-img-container"/>').appendTo(articleContainer)
                                  .append('<img class="article-image" src=' + art.imageUrl + '>');
    }

    var articleContentContainer = $('<div class="article-content-container"/>').appendTo(articleContainer)
    var articleTitle = $('<h4 class="article-title" >' + art.title + '</h4>').appendTo(articleContentContainer);
    var articleDescriptionContainer = $('<div class="article-description-container collapsed">').appendTo(articleContentContainer);
    var articleDescription = $('<p class="article-description">' + art.description + '</p>').appendTo(articleDescriptionContainer);
    if (!options.colapsedescription)
      articleDescriptionContainer.removeClass('collapsed');
    else
      $('<div class="article-description-overlay"/>').appendTo(articleDescriptionContainer);

    if (art.author) {
      $('<p class="article-host-author">' + art.author + ' | ' + formatArticleSource(art) + '</p>').appendTo(articleContentContainer);
    } else {
      $('<p class="article-host-author">' + formatArticleSource(art) + '</p>').appendTo(articleContentContainer);
    }
  }
  return articleContainer;
}

function buildVineContainer(link,addToContainer,options) {
  var iframeContainer = $('<div class="article-embebed-iframe-container"/>').appendTo(addToContainer);
  var iframe = $('<iframe class="vines-iframe" frameborder="0"></iframe>').appendTo(iframeContainer)
                                          .load(function() {
                                            if (options.size == "large") {
                                              addToContainer.addClass('large-view');
                                              iframesize = 540;
                                              addToContainer.width(iframesize);
                                              addToContainer.height(iframesize);
                                            } else {
                                              iframesize = addToContainer.width();
                                              addToContainer.height(iframesize);
                                            }
                                            iframe.attr("width",iframesize)
                                                  .attr("height",iframesize);
                                            iframeContainer.innerWidth(iframesize)
                                                           .innerHeight(iframesize)
                                                           .show();
                                          })
                                          .attr('src',link + "/embed/simple");
  return iframeContainer;
}

function buildYouTubeContainer(link,addToContainer,options) {
  var VIDEO_RATIO = 16/9;
  var videoId = link.split('https://www.youtube.com/watch?v=')[1];
  var src = "https://www.youtube.com/embed/" + videoId + "?rel=0&amp;controls=0&amp;showinfo=0"
  var iframeContainer = $('<div class="article-embebed-iframe-container"/>').appendTo(addToContainer);
  var iframe = $('<iframe class="youtube-iframe" frameborder="0" allowfullscreen></iframe>').appendTo(iframeContainer)
                                          .load(function() {
                                            if (options.size == "large") addToContainer.addClass('large-view');
                                            var iframeWidth= addToContainer.width();
                                            var iframeHeight= iframeWidth / VIDEO_RATIO;
                                            iframeHeight = (iframeHeight>540) ? 540 : iframeHeight;
                                            iframeWidth = (iframeHeight>540) ? 540 * VIDEO_RATIO : iframeWidth;
                                            iframe.attr("width",iframeWidth)
                                                  .attr("height",iframeHeight);
                                            iframeContainer.innerWidth(iframeWidth)
                                                           .innerHeight(iframeHeight)
                                                           .show();
                                          })
                                          .attr('src',src);
  return iframeContainer;
}

function buildVimeoContainer(link,addToContainer,options) {
  var VIDEO_RATIO = 16/9;
  var videoId = link.split('https://vimeo.com/')[1];
  var src = "https://player.vimeo.com/video/" + videoId + "?color=ff0179&title=0&byline=0&portrait=0"
  var iframeContainer = $('<div class="article-embebed-iframe-container"/>').appendTo(addToContainer);
  var iframe = $('<iframe class="vimeo-iframe" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>').appendTo(iframeContainer)
                                          .load(function() {
                                            if (options.size == "large") addToContainer.addClass('large-view');
                                            var iframeWidth= addToContainer.width();
                                            var iframeHeight= iframeWidth / VIDEO_RATIO;
                                            iframeHeight = (iframeHeight>540) ? 540 : iframeHeight;
                                            iframeWidth = (iframeHeight>540) ? 540 * VIDEO_RATIO : iframeWidth;
                                            iframe.attr("width",iframeWidth)
                                                  .attr("height",iframeHeight);
                                            iframeContainer.innerWidth(iframeWidth)
                                                           .innerHeight(iframeHeight)
                                                           .show();
                                          })
                                          .attr('src',src);
  return iframeContainer;
}

function buildLikeButton(story) {
  var id = story.id;
  var likeButtonText = (story.currentUserLikesStory) ? 'Liked' : 'Like';
  var likeButtonClass = (story.currentUserLikesStory) ? 'btn-primary' : 'btn-success';
  var likeButton = $('<a storyId= ' + id + ' class="story-like-button btn ' + likeButtonClass + '" >' + likeButtonText + '  <span class="badge">' + story.noOfLikes + '</span></a>')
              .click(function() {
                var storyId = $(this).attr('storyId');
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
  return likeButton;
}

function buildSaveStoryButton(story) {
  var id = story.id;
  var saveStoryButtonText = (story.currentUserSavedStory) ? 'Saved' : 'Save';
  var saveStoryButtonClass = (story.currentUserSavedStory) ? 'btn-primary' : 'btn-success';
  var saveStoryButton = $('<a storyId= ' + id + ' class="story-save-button btn ' + saveStoryButtonClass + '" >' + saveStoryButtonText + '  <span class="badge">' + story.noOfSaves + '</span></a>')
              .click(function() {
                var storyId = $(this).attr('storyId');
                saveStory(storyId, function(result) {
                  $('#story-' + storyId + ' .story-save-button span').html(result.noOfSaves);
                  if (result.currentUserSavedStory) {
                    $('#story-' + storyId + ' .story-save-button').removeClass('btn-success').addClass('btn-primary')
                                                                  .html('Saved  <span class="badge">' + result.noOfSaves + '</span>');
                  } else {
                    $('#story-' + storyId + ' .story-save-button').addClass('btn-success').removeClass('btn-primary')
                                                                  .html('Save  <span class="badge">' + result.noOfSaves + '</span>');
                  }
                });
              });
    return saveStoryButton;
}


function openStoryView(option) {
  resetStoryView();
  var s = option.story;
  // Author Details
  $('#open-story-view .story-author-name').text(s.author.fullName)
  //Story author thumbnail
  var avatarUrl = (s.author.avatarUrl) ? s.author.avatarUrl : defaultAvatarPic;
  $('#open-story-view .story-author-thumbnail').css('background-image','url(' + avatarUrl + ')');


  // Load Story details
  $('#open-story-view #story-text')[0].innerText = s.summary;
  if (s.thumbnail) {
    $('#open-story-view #story-image').attr('src',s.thumbnail);
    $('#open-story-view #story-image-container').show();
  }
  $('#open-story-view .location').text(s.locationName);
  $('#open-story-view #story-map-location-input').val(s.locationName);
  var loc = new google.maps.LatLng(s.location.latitude, s.location.longitude, true);
  if (storyLocationMarker)
    storyLocationMarker.setPosition(loc);
  else {
    storyLocationMarker = new google.maps.Marker({
      position : loc,
      draggable : false
    });
  }
  if (s.articleLink) {
    buildArticleContainer({
      title: s.articleTitle,
      description: s.articleDescription,
      author: s.articleAuthor,
      imageUrl: s.articleImage,
      source: s.articleSource,
      url: s.articleLink
    },$('#open-story-view .story-container-body'),{size:"large"});
  }


  // LIKE BUTTON
  //$('#open-story-view .story-container-footer').append(buildLikeButton(s));
  // SAVE BUTTON
  //$('#open-story-view .story-container-footer').append(buildSaveStoryButton(s));

  //open view
  $('#open-story-view').modal('show');
  $('#open-story-view').on('hidden.bs.modal',function() {
    resetStoryView();
    $('#open-story-view').unbind('hidden.bs.modal');
  });
}

function resetStoryView() {
  $('#open-story-view #story-image-container').hide();
  $('#open-story-view #story-image').attr('src','');
  $('#open-story-view #story-text').text('');
  $('#open-story-view .article-container').remove();
  storyLocationMarker = null;
  hideEmbedStoryMap();
}

function closeStoryView() {
  $('#open-story-view').modal('hide');
  resetStoryView()
}

//--- initiateMap method ---//
function initiateStoryMap() {
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

	storymap = new google.maps.Map(document.getElementById('story-map-canvas'),mapOptions);

  if (storyLocationMarker) {
    storyLocationMarker.setMap(storymap);
    storymap.setCenter(storyLocationMarker.getPosition());
  }

	//--- Map Event Handlers ---//
	var listener = google.maps.event.addListener(storymap, 'tilesloaded', function() {
		google.maps.event.removeListener(listener);
	});

	//updateFocusedLocationName();

  //-- SearchBox --//
  var input = document.getElementById('story-map-location-input');
  var searchBox = new google.maps.places.SearchBox(input);
  //storymap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  //Bias the SearchBox results towards current map's viewport.
  searchBox.setBounds(storymap.getBounds());
  storymap.addListener('bounds_changed', function() {
    searchBox.setBounds(storymap.getBounds());
  });
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();
    if (places.length == 0)
      return;
    storymap.setCenter(places[0].geometry.location);
    storymap.setZoom(8);
  });
}

function selectStoryLocation() {
  locationName = $('#create-story-view-container #story-map-location-input').val();
  storylocation = new Object();
  location.lat = storymap.getCenter().lat();
  location.lng = storymap.getCenter().lng();
  if (storyLocationMarker)
    storyLocationMarker.setMap(null);
  storyLocationMarker = new google.maps.Marker({
    position : storymap.getCenter(),
    map : storymap,
    draggable : false
  });
  $('#create-story-view-container .location').text(locationName);
}

function showStoryMap() {
  $('#create-story-view-container .story-container-body').hide();
  $('#create-story-view-container .story-set-location-view-container').show();
  initiateStoryMap();
}

function hideStoryMap() {
  $('#create-story-view-container .story-set-location-view-container').hide();
  $('#create-story-view-container .story-container-body').show();
}

function showEmbedStoryMap() {
  $('#open-story-view .story-container-body').hide();
  $('#open-story-view .story-set-location-view-container').show();
  initiateStoryEmbedMap();
}

function hideEmbedStoryMap() {
  $('#open-story-view .story-set-location-view-container').hide();
  $('#open-story-view .story-container-body').show();
}

//--- initiateMap method ---//
function initiateStoryEmbedMap() {
	var mapOptions = {
		zoom : 6,
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

	storyembedmap = new google.maps.Map(document.getElementById('story-embed-map-canvas'),mapOptions);

  if (storyLocationMarker) {
    storyLocationMarker.setMap(storyembedmap);
    storyembedmap.setCenter(storyLocationMarker.getPosition());
  }
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

  //--- Marker Cluster ---//
  var styles = [{
        url: '',
        height: 36,
        width: 36,
        anchor: [0, 0],
        textColor: '#fff',
        textSize: 11
      }, {
        url: '',
        height: 36,
        width: 36,
        anchor: [0, 0],
        textColor: '#fff',
        textSize: 13
      }, {
        url: '',
        height: 65,
        width: 65,
        anchor: [0, 0],
        textColor: '#fff',
        textSize: 16
      }];
  var mcOptions = {gridSize: 30, maxZoom: 19, styles: styles};
  markercluster = new MarkerClusterer(map, [], mcOptions);

	//--- Map Event Handlers ---//
	var listener = google.maps.event.addListener(map, 'tilesloaded', function() {
    buildStoryContainersForStoriesWithinBounds();
		// google.maps.event.addListener(map, 'bounds_changed', buildStoryContainersForStoriesWithinBounds);
    google.maps.event.addListener(map, 'dragend', buildStoryContainersForStoriesWithinBounds);
    google.maps.event.addListener(map, 'zoom_changed', buildStoryContainersForStoriesWithinBounds);
		google.maps.event.removeListener(listener);
	});

	//updateFocusedLocationName();

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
    map.setZoom(8);
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

function getStoriesWithinMapBounds() {
  var storyList = [];
  if (!map.getBounds()) return;
  var bounds = new google.maps.LatLngBounds(map.getBounds().getSouthWest(),map.getBounds().getNorthEast());
  var st_location;
  publishedStories.forEach(function(st) {
    st_location = new google.maps.LatLng(st.location.latitude, st.location.longitude);
    if (bounds.contains(st_location)) {
      storyList.push(st);
    }
  })
  return storyList;
}

function sortStoriesWithDate(stories) {
  if (!stories || stories.length==0)
		return stories;
  var stories_ = stories;
  var sortedList = [];
	sortedList.push(stories_[0])
	stories_.splice(0, 1);
  stories_.forEach(function(st) {
    date_st = parseInt(st.id,10);
    for (var i in sortedList) {
      date_sorted = parseInt(sortedList[i].id,10);
      if (date_st > date_sorted) {
        sortedList.splice(i,0,st)
        break;
			} else if( i == sortedList.length-1) {
				sortedList.push(st)
      }
    }
  });
  return sortedList;
}

function buildStoryContainersForStoriesWithinBounds() {
  var storiesinbounds = getStoriesWithinMapBounds(publishedStories);
  var storiesSortedByDate = sortStoriesWithDate(storiesinbounds);
  buildLibraryBody(storiesSortedByDate);
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
		//selectedStories = selectPublishStoriesWithinRadiusAndPivot(publishedStories,map.getCenter(),computeRadarRadius());
		//sortedStories = sortStoriesWithDistance(selectedStories,map.getCenter())
    // var storiesinbounds = getStoriesWithinMapBounds(publishedStories)
		// buildLibraryBody(storiesinbounds);
    buildStoryContainersForStoriesWithinBounds();
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
	for ( var i = 0; i < publishedStories.length; i++) {
		publishedStory = publishedStories[i];
		if (publishedStory.location != null) {
			var marker = new google.maps.Marker({
				position : new google.maps.LatLng(publishedStory.location.latitude, publishedStory.location.longitude, true),
				icon: markerIcon,
				map : map,
				draggable : false
			});
      //add to marker cluster
      markercluster.addMarker(marker);
			// google.maps.event.addListener(marker, 'click', function() {
			// });
			storyMarkerList.put(publishedStory.id,marker);
		}
	//fitStoryOnView(storyMarkerList);
	}
}

function drawPublishedStoryMarkerOnMap(story) {
  if (story.location != null) {
    var marker = new google.maps.Marker({
      position : new google.maps.LatLng(story.location.latitude, story.location.longitude, true),
      icon: markerIcon,
      map : map,
      draggable : false
    });
    //add to marker cluster
    markercluster.addMarker(marker);
    // google.maps.event.addListener(marker, 'click', function() {
    // });
    storyMarkerList.put(story.id,marker);
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
  hideStoryMap();

	if (!user) {
    alert('Failed to post. User not logged in.')
    return;
  }
  if ($('#create-story-view-container #story-map-location-input').val() == "" || storylocation == null) {
    alert('Failed to post. You must select a location.')
    return;
  }

	story = newStoryObj(map);
	//set new story title
	story.setTitle("story_" + user.getEmail() + "_" + new Date().getTime());
	story.setLocation(location.lat,location.lng);
	story.setSummary(getStoryText());
  //setArticle
  if (article) {
		story.setArticle(article.title,
						article.description,
						article.imageUrl,
						webUrl,
            article.date,
            article.source,
            article.author)
	}
  //set location name
  story.setLocationName(locationName);

  //save story on server
	story.createStory(function(st){
		//upload story pics
		var story = st
		storyId = story.getStoryId()
		if (saveimagefile) {
			uploadStoryImage(storyId,function() {
				story.publishStory(1,function(pubsStory) {
          publishFinished(pubsStory);
        })
			});
		} else {
			//publish
			story.publishStory(1,function(pubsStory) {
        publishFinished(pubsStory);
      })
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

function publishFinished(story) {
  cleanStoryCreationElements();
  publishedStories.push(story.domainStory);
  drawPublishedStoryMarkerOnMap(story.domainStory);
  buildStoryContainersForStoriesWithinBounds();
}

function cleanStoryCreationElements() {
	article = null;
	saveimagefile = null;
	webUrl = null;

	$('#story-text').val("");
	$('#story-image-container').hide();
  $('#story-image').attr('src','');

  $('#article-link').val("");
  $('#story-insert-article').hide();

  $('#create-story-view-container .location').text('Select location');
  $('#story-map-location-input').val('');

  removeArticleContainer();
  article = null;
  storylocation = null;
  storyLocationMarker = null;
  hideStoryMap();
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

function saveStory(storyId, onFinished){
	$.ajax({
		url: "/story/" + storyId + "/save",
		type: "POST",
		dataType: "json",
		success: onFinished,
		error: function() {console.log("Couln't save story");}
	});
}

function computeRadarRadius() {
	zoom=map.getZoom()
	radius = 3*Math.pow(2,21-zoom);
	return radius;
}

function formatArticleSource(art) {
  var s = art.source;
  if (!s)
    s = getHostFromUrl(art.url);
  if (s.split('.')[0] == 'www')
    return s.replace('www.','')
  else
    return s;
}

function loadStoryTextBehaviours() {
  // elestic behaviour
  var storyTextElem = $('#story-text');

  storyTextElem.elastic();

  //placeholder
  var placeholder = storyTextElem.attr('placeholder');

  //event listeners
  storyTextElem.html('<span class="placeholder">' + placeholder + '</span>')
                .addClass('empty')
                .focusin(function() {
                  $('#story-text.empty').html('').removeClass('empty');
                })
                .focusout(function() {
                  if (storyTextElem.html() == '' || storyTextElem.html()== '<br>' )
                    storyTextElem.html('<span class="placeholder">' + placeholder + '</span>').addClass('empty');
                })
                .keypress(function() {
                  // var text = storyTextElem[0].innerText;
                  // //text = storyTextElem.html();
                  // console.log(text);
                  // element = document.getElementById('story-text')
                  // console.log(getCaretCharacterOffsetWithin(element));
                });
}

function getStoryText(jqTextElement) {
  if (jqTextElement.find('.placeholder')[0])
    jqTextElement.find('.placeholder')[0].remove();
  if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    return jqTextElement[0].innerHTML.replace(/<br>/g,'\n')
                                    .replace(/&nbsp;/g,' ')
                                    .replace(/[^\x00-\x7F]/g, "")
                                    .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
  }
  return jqTextElement[0].innerText.replace(/[^\x00-\x7F]/g, "")
                                  .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
}

function highlightTagsInText(text) {
  return text + '&';



  // while (origText.split('#',2).length > 1) {
  //   tag = origText.split('#',2)[1].split(' ',2)[0];
  //   result = result + origText.split('#',2)[0] + tag ;
  //   origText = origText.split('#',2)[1].split(' ',2)[1];
  //   console.log(origText);
  // }
  // return result;

}

function getCaretCharacterOffsetWithin(element) {
  var caretOffset = 0;
  var doc = element.ownerDocument || element.document;
  var win = doc.defaultView || doc.parentWindow;
  var sel;
  if (typeof win.getSelection != "undefined") {
      sel = win.getSelection();
      if (sel.rangeCount > 0) {
          var range = win.getSelection().getRangeAt(0);
          var preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(element);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          caretOffset = preCaretRange.toString().length;
      }
  } else if ( (sel = doc.selection) && sel.type != "Control") {
      var textRange = sel.createRange();
      var preCaretTextRange = doc.body.createTextRange();
      preCaretTextRange.moveToElementText(element);
      preCaretTextRange.setEndPoint("EndToEnd", textRange);
      caretOffset = preCaretTextRange.text.length;
  }
  return caretOffset;
}

function setCaretCharacterOffsetWithin(element,offset) {
  var el = document.getElementById("story-text");
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart(el.childNodes[2], 5);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}
