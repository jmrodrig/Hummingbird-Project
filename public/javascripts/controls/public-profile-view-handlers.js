
//--- initialize global variables ---//

var map;
var markercluster;

var storymap;
var storyLocationMarker;

var editingstory;

var helpOn = true;
var userStories;
var userSavedStories;
var userSavedStoriesMarkerList;
var userStoriesMarkerList

var defaultLocation;
var fitZoom;

var user = null;
var currentuser = null;
var article = null;
var webUrl = null;
var storylocation;
var locationName;
var selectedImageCount;

var iframesize;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"

var markerIcon;

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

	currentuser = newUserObj();
	currentuser.constructor();
	currentuser.readLoggedUser(function (user){
			if (currentuser.getAvatarUrl())
				avatarUrl = currentuser.getAvatarUrl();
			else
				avatarUrl = defaultAvatarPic
			$('#stories-link').css('display' , 'block' );
			$('#user-link').html('<div/><span>' + currentuser.getFullName() + '  <span class="caret"></span></span>')
							.css('display' , 'block' );

			$('#user-link div').css('background-image','url(' + avatarUrl + ')');
      readProfile();
		},
		function (){
      currentuser = null;
			$('#login-link, #stories-link').css('display' , 'block' );
		}
	);
}

function readProfile() {
  user = newUserObj();
  user.constructor();
  stud_readUserDetails(userNumberId,function(user_) {
    user.domainUser = user_;
    initiateMap();
    intializeEvents();
    initializeProfileDetails();
    loadUserStories(function() {
      userStoriesMarkerList = drawPublishedStoryMarkersOnMap(userStories,markerIcon);
      userSavedStoriesMarkerList = drawPublishedStoryMarkersOnMap(userSavedStories,markerIcon);
      drawStoryGridLayout()
    });
  }, function() {alert('user not found')})
}

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

function intializeEvents() {
	//----------------
	$('#content-wrapper').css({ height: $(window).innerHeight() - $('nav.navbar').height() });

	//----------------
	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');

  // Retract Location Banner
  $('#content-wrapper').scroll(function() {
    var currentScrollTop = $('#content-wrapper').scrollTop();
    if (currentScrollTop < 552)
      $('#profile-location-banner').removeClass('animate-transition collapsed-navbar');
    else
      $('#profile-location-banner').addClass('collapsed-navbar animate-transition');
  });

  $('#profile-location-banner').keypress(function(e) {
    if(e.which == 13) {
        $("#content-wrapper").animate({ scrollTop: 0 }, "slow");
    }
  });

  //--- Google Analytics track event ----//
	$(".ga-event-map-publish").click( function() {
		ga('send','event','map', 'publish') //Google Analytics track event
	});

	//----------------
	$(window).resize(function() {
		$('#content-wrapper').css({ height: $(window).innerHeight() - $('nav.navbar').height() });

    //resize of Vine's iframe
    iframesize = $('#open-story-view .article-container').height();
    $('#open-story-view  .vines-iframe').attr("width",iframesize)
                      .attr("height",iframesize);

    //drawStoryGridLayout(userStories.concat(userSavedStories))
	});
}

function  initializeProfileDetails() {
  if (user.getAvatarUrl())
    avatarUrl = user.getAvatarUrl();
  else
    avatarUrl = defaultAvatarPic
  $('#profile-image').attr('src',avatarUrl)

  $('#profile-name').html(user.getFullName());

  //TODO: passar os seguintes dados com o json
  $('#profile-stat-user-created #value').html(user.domainUser.noOfStories);
  $('#profile-stat-user-saved #value').html(user.domainUser.noOfSaved);
  $('#profile-stat-user-followers #value').html('0');
  $('#profile-stat-user-folllowing #value').html('0');

  // STORY COLLECTIONS LIST
  var collectionList = $('#story-collections-list')
  user.domainUser.storyCollections.forEach(function(collection) {
    $('<li><a href="/collection/' + collection.id + '">' + collection.name + '</a></li>').appendTo(collectionList);
  });
}

function drawStoryItemOnMapView(story) {
  var mapViewStoryContainer = $('#profile-map-cover-left');
  mapViewStoryContainer.empty()
  var storyContainer = buildStoryContainer(story);
  storyContainer.appendTo(mapViewStoryContainer);
}

function clearHighlightedStoryFromMapView() {
  $('#profile-map-cover-left').empty();
}

function drawStoryGridLayout() {
  var stories = userStories.concat(userSavedStories);

  $('.story-container').remove();
	var storiesListContainer = $("#stories-list");

  // Set layout
  var noColumns = 1,
  columnWidth = 300,
  columnMargin = 10,
  listMinMargin = 100,
  availableWidth = $('#content-wrapper').innerWidth(),
  requestedWidth = noColumns*(columnWidth + 2*columnMargin) + 2*listMinMargin;
  // while (requestedWidth <  availableWidth) {
  //   noColumns++
  //   requestedWidth = noColumns*(columnWidth + 2*columnMargin) + 2*listMinMargin;
  // }
  //
  // noColumns = noColumns - 1;

  noColumns = 2;
  storiesListContainer.width(noColumns*(columnWidth + 2*columnMargin));
  $('#stories-list-view-left-container').width((availableWidth - noColumns*(columnWidth + 2*columnMargin))/2);
  for ( var i = 1; i <= noColumns; i++) {
    $('<div id="column-' + i + '" class="layout-column"/>').appendTo(storiesListContainer)
  }

  var columnCommuter;
  counter = 0;
  columnCommuter = (counter++ % noColumns) + 1;

  // Add remaining Story Containers
  var stories = getStoriesWithinMapBounds(stories);
  var stories = sortStoriesWithDate(stories);

  if(!stories || stories.length == 0) {
		$('#no-stories-message').show();
		return;
	} else
		$('#no-stories-message').hide();

  stories.forEach(function(story) {
    var storyContainer = buildStoryContainer(story);
    columnCommuter = (counter++ % noColumns) + 1;
    storyContainer.appendTo($('#column-' + columnCommuter));
  });
}

function buildStoryContainer(story) {
  var storyContainer = $('<div/>').attr('id', 'story-' + story.id).attr('storyId', story.id)
            .addClass('story-container');

  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(storyContainer)
                                                                  .click(function() {
                                                                    openStoryView({readonly:true, story:story});
                                                                  });
  //Story container footer
  var storyContainerFooter = $('<div class="story-container-footer"/>').appendTo(storyContainer);

  //--- HEADER ---//

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
  authorContainer.append('<a class="story-author-name" href="/profile/' + story.author.numberId + '">' + authorName +  '</a>');

  //Story Options Button container
  var optionsBtnContainer = $('<div class="story-options-btn-container pull-right dropdown"/>').appendTo(storyContainerHeader);
  var optionsBtn = $('<div class="story-options-btn dropdown-toggle" id="dropdownMenu1" data-toggle="dropdown"/>').appendTo(optionsBtnContainer);
  $('<div/>').appendTo(optionsBtn);
  $('<div/>').appendTo(optionsBtn);
  $('<div/>').appendTo(optionsBtn);

  //Story Options Dropdown container
  var optionsList = $('<ul class="options-list dropdown-menu" aria-labelledby="dropdownMenu1"/>').appendTo(optionsBtnContainer);

  $('<li><a href="#">Open</a></li>').appendTo(optionsList)
                                    .click(function() {
                                      openStoryView({readonly:true, story:story});
                                    });

  $('<li class="divider"></li>').appendTo(optionsList);
  $('<li> <a href="#">Add to</a></li>').appendTo(optionsList)
                                        .click(function() {
                                          openChooseCollectionView(story);
                                        });


  //--- BODY ---//

  //Story location container
  var locationContainer = $('<div class="location-container"/>').appendTo(storyContainerBody);

  var location = "";
  if (story.locationName && story.locationName.length > 0)
    location = story.locationName;
  $('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-10px flaticon-facebook30"></div>').appendTo(locationContainer);
  $('<p class="location">' + location + '</p>').appendTo(locationContainer);

  //Thumbnail: article image or story image
  var imageContainer = $('<div class="image-container"/>').attr('id', 'image-story-' + story.id).appendTo(storyContainerBody);

  var thumbnailLink;
  if (!story.articleLink) {
    thumbnailLink = story.thumbnail;
  } else {
    thumbnailLink = story.articleImage;
  }

  if (thumbnailLink && thumbnailLink.length > 0) {
    $('<img atl="image for ' + story.title + '">').appendTo(imageContainer)
                                                  .attr('src',thumbnailLink);
  }


  if (!story.articleLink) {
    // Summary container
    if (story.summary && story.summary.length > 0) {
      var summaryContainer = $('<div class="summary-container"/>').appendTo(storyContainerBody);
      var summary = $('<p class="story-summary"/>').appendTo(summaryContainer);
      setStoryText(story.summary,summary);
      var summaryContainerOverlay = $('<div class="summary-container-overlay"/>').appendTo(summaryContainer);
    }
  } else {
    var articleDetailsContainer = $('<div class="article-details-container"/>').appendTo(storyContainerBody)
          .append('<p class="article-title" >' + story.articleTitle + '</p>')
          .append('<a class="article-host" href="' + story.articleLink + '">' + getHostFromUrl(story.articleLink) + '</a>');
  }

  //--- FOOTER ---//

  // Stats: Likes and Saves
  var storyStatsContainer = $('<div class="story-stats-container"/>').appendTo(storyContainerFooter);
  $('<div class="story-stats-likes">' + story.noOfLikes + ' likes</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-saves">' + story.noOfSaves + ' saves</div>').appendTo(storyStatsContainer);

  return storyContainer;
}

function addArticleContainer(art) {
  removeArticleContainer();
  buildArticleContainer(art,$('#open-story-view .story-container-body'),"large")
}

function removeArticleContainer() {
  $('#open-story-view .article-container').remove();
}

function buildArticleContainer(art,addToContainer,sizeOptions) {
  var articleContainer = $('<div class="article-container"/>').appendTo(addToContainer);

  if (getHostFromUrl(art.url) == "vine.co") {
    buildVineContainer(art.url,articleContainer,sizeOptions);
  } else if (getHostFromUrl(art.url) == "www.youtube.com") {
    buildYouTubeContainer(art.url,articleContainer,sizeOptions);
  } else if (getHostFromUrl(art.url) == "vimeo.com") {
    buildVimeoContainer(art.url,articleContainer,sizeOptions);
  } else {
    articleContainer.click(function() {window.open(art.url);});

    if (art.imageUrl != "") {
      var articleImageContainer = $('<div class="article-img-container"/>').appendTo(articleContainer)
                                  .append('<img class="article-image" src=' + art.imageUrl + '>');
    }

    var articleContentContainer = $('<div class="article-content-container"/>').appendTo(articleContainer)
          .append('<h4 class="article-title" >' + art.title + '</h4>')
          .append('<p class="article-description">' + art.description + '</p>');

    if (art.author) {
      $('<p class="article-host-author">' + art.author + ' | ' + formatArticleSource(art) + '</p>').appendTo(articleContentContainer);
    } else {
      $('<p class="article-host-author">' + formatArticleSource(art) + '</p>').appendTo(articleContentContainer);
    }
  }
  return articleContainer;
}

function buildVineContainer(link,addToContainer,sizeOptions) {
  var iframeContainer = $('<div class="article-embebed-iframe-container"/>').appendTo(addToContainer);
  var iframe = $('<iframe class="vines-iframe" frameborder="0"></iframe>').appendTo(iframeContainer)
                                          .load(function() {
                                            if (sizeOptions == "large") {
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

function buildYouTubeContainer(link,addToContainer,sizeOptions) {
  var VIDEO_RATIO = 16/9;
  var videoId = link.split('https://www.youtube.com/watch?v=')[1];
  var src = "https://www.youtube.com/embed/" + videoId + "?rel=0&amp;controls=0&amp;showinfo=0"
  var iframeContainer = $('<div class="article-embebed-iframe-container"/>').appendTo(addToContainer);
  var iframe = $('<iframe class="youtube-iframe" frameborder="0" allowfullscreen></iframe>').appendTo(iframeContainer)
                                          .load(function() {
                                            if (sizeOptions == "large") addToContainer.addClass('large-view');
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

function buildVimeoContainer(link,addToContainer,sizeOptions) {
  var VIDEO_RATIO = 16/9;
  var videoId = link.split('https://vimeo.com/')[1];
  var src = "https://player.vimeo.com/video/" + videoId + "?color=ff0179&title=0&byline=0&portrait=0"
  var iframeContainer = $('<div class="article-embebed-iframe-container"/>').appendTo(addToContainer);
  var iframe = $('<iframe class="vimeo-iframe" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>').appendTo(iframeContainer)
                                          .load(function() {
                                            if (sizeOptions == "large") addToContainer.addClass('large-view');
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

function openStoryView(option) {
  resetStoryView();
  s = option.story;
  // Author Details
  if (option.edit == true | option.new == true) {
    var avatarUrl = (user.getAvatarUrl()) ? user.getAvatarUrl() : defaultAvatarPic;
    $('#open-story-view .story-author-name').text(user.getFullName())
    $('#open-story-view .story-author-thumbnail').css('background-image','url(' + avatarUrl + ')');
    loadStoryTextBehaviours();
  } else if (option.readonly == true) {
    $('#open-story-view .story-author-name').text(s.author.fullName)
                                            .attr("href","/profile/" + s.author.numberId);
    //Story author thumbnail
    var avatarUrl = (s.author.avatarUrl) ? s.author.avatarUrl : defaultAvatarPic;
    $('#open-story-view .story-author-thumbnail').css('background-image','url(' + avatarUrl + ')');
  }

  // Load Story details
  if (option.edit == true || option.readonly == true) {
    setStoryText(s.summary,$('#open-story-view #story-text'));
    if (s.thumbnail) {
      $('#open-story-view #story-image').attr('src',s.thumbnail);
      $('#open-story-view #story-image-container').show();
    }
    var locationElement = $('#open-story-view .location').text(s.locationName);
    if (locationElement.innerHeight() > 22)
      locationElement.addClass('wrapped-text');
    $('#open-story-view #story-map-location-input').val(s.locationName);
    storylocation = s.location;
    locationName = s.locationName;
    var loc = new google.maps.LatLng(s.location.latitude, s.location.longitude, true);
    if (storyLocationMarker)
      storyLocationMarker.setPosition(loc);
    else {
      storyLocationMarker = new google.maps.Marker({
        position : loc,
        draggable : false
      });
    }
    // ARTICLE CONTAINER
		if (s.articleLink) {
      article = {
        title: s.articleTitle,
        description: s.articleDescription,
        author: s.articleAuthor,
        imageUrl: s.articleImage,
        source: s.articleSource,
        url: s.articleLink
      };
      addArticleContainer(article);
		}
  }

  // Buttons and Controls Edits
  if (option.edit == true && s.articleLink) {
    $('#open-story-view #story-insert-article').show();
    $('#open-story-view #article-link').val(s.articleLink);
  }

  if (option.readonly == true) {
    $('#open-story-view #remove-story-image').hide();
    $('#open-story-view #set-location-btn').hide();
    $('#open-story-view #story-map-location-input').hide()
    $('#open-story-view #story-map-sight').hide();
    $('#open-story-view #story-text').attr('contenteditable', 'false')
                                                 .removeClass('editable');
    $('#open-story-view #story-add-picture-button').hide();
    $('#open-story-view #story-add-link-button').hide();
    $('#open-story-view #story-publish-button').hide();
    $('#open-story-view #story-cancel-create-button').hide();
    $('#open-story-view #close-story-view').show();
  }

  if (option.edit == true)
    editingstory = s;

  //open view
  $('#open-story-view').modal('show');
}

function resetStoryView() {
  $('#open-story-view #story-image-container').hide();
  $('#open-story-view #story-image').attr('src','');
  $('#open-story-view #story-text').text('');
  $('#open-story-view #article-link').val('');
  $('#open-story-view #story-insert-article').hide();
  $('#open-story-view .location').text('Select location');
  $('#open-story-view #story-map-location-input').val('');
  $('#open-story-view #set-location-btn').show();
  $('#open-story-view #remove-story-image').show();
  $('#open-story-view #story-text').attr('contenteditable', 'true')
                                               .addClass('editable');
  $('#open-story-view #story-map-location-input').show();
  $('#open-story-view #story-map-sight').show();
  $('#open-story-view #story-add-picture-button').show();
  $('#open-story-view #story-add-link-button').show();
  $('#open-story-view #story-publish-button').show();
  $('#open-story-view #story-cancel-create-button').show();
  $('#open-story-view #close-story-view').hide();
  $('#open-story-view #story-article').unbind();
  removeArticleContainer();
  article = null;
  storylocation = null;
  locationName = null;
  storyLocationMarker = null;
  editingstory = null;
  saveimagefile = null;
  hideStoryMap();
}

function closeStoryView() {
  $('#open-story-view').modal('hide');
  resetStoryView()
}

// Open collection creation modal
function openCreateCollectionView(story) {
  $('#create-collection-btn').click(function() {
    createStoryCollection(story);
    closeCreateCollectionView();
  });
  $('#create-story-collection-modal').modal('show');
}

// close collection creation modal
function closeCreateCollectionView() {
  $('#create-story-collection-modal').modal('hide');
  $('#create-collection-btn').unbind();
  $('#story-collection-title-input').val();
}

function openChooseCollectionView(story) {
  $('#choose-story-collection-modal .modal-body').empty();
  var storyCollectionListContainer = $('<div class="list-group"/>').appendTo($('#choose-story-collection-modal .modal-body'));
  user.domainUser.storyCollections.forEach(function(sc) {
    $('<a href="#" class="list-group-item">' + sc.name + '</a>').appendTo(storyCollectionListContainer)
                                                                .click(function() {
                                                                  addStoryToCollection(story.id,sc.id);
                                                                  closeChooseCollectionView();
                                                                });
  });
  $('<a href="#" class="list-group-item active">+ new collection</a>').appendTo(storyCollectionListContainer)
                                                .click(function() {
                                                  openCreateCollectionView(story);
                                                  closeChooseCollectionView();
                                                });
  $('#choose-story-collection-modal').modal('show');
}

function closeChooseCollectionView() {
  $('#choose-story-collection-modal').modal('hide');
  $('#choose-story-collection-modal .modal-body').empty();
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
		//google.maps.event.addListener(storymap, 'dragend', mapCenterChanged);
		//google.maps.event.addListener(storymap, 'zoom_changed', mapCenterChanged);
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

//--- initiateMap method ---//
function initiateMap() {
	var mapOptions = {
		zoom : 2,
    scrollwheel: false,
		streetViewControl: true,
		streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
    scaleControl : true,
		zoomControl : true,
		zoomControlOptions : {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
		mapTypeId : google.maps.MapTypeId.HYBRID,
		mapTypeControl : true,
		mapTypeControlOptions : {style: google.maps.MapTypeControlStyle.DEFAULT, position: google.maps.ControlPosition.RIGHT_BOTTOM},
		center : defaultLocation
	}

	map = new google.maps.Map(document.getElementById('profile-map-canvas'),mapOptions);

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
		google.maps.event.addListener(map, 'dragend', drawStoryGridLayout);
		google.maps.event.addListener(map, 'zoom_changed', drawStoryGridLayout);
    google.maps.event.addListener(map, 'click', clearHighlightedStoryFromMapView);
		google.maps.event.removeListener(listener);
	});

	//updateFocusedLocationName();

  //-- SearchBox --//
  var input = document.getElementById('profile-location-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
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

function redrawMarkerClusterer() {
  var markers = userStoriesMarkerList.values()
  markers = markers.concat(userSavedStoriesMarkerList.values());
  markercluster.clearMarkers();
  markercluster.addMarkers(markers);
  markercluster.redraw();
}

function selectStoryLocation() {
  locationName = $('#open-story-view #story-map-location-input').val();
  storylocation = {
    latitude:storymap.getCenter().lat(),
    longitude:storymap.getCenter().lng()
  }
  if (storyLocationMarker)
    storyLocationMarker.setMap(null);
  storyLocationMarker = new google.maps.Marker({
    position : storymap.getCenter(),
    map : storymap,
    draggable : false
  });
  $('#open-story-view .location').text(locationName);
}

function showStoryMap() {
  $('#open-story-view .story-container-body').hide();
  $('#open-story-view .story-set-location-view-container').show();
  initiateStoryMap();
}

function hideStoryMap() {
  $('#open-story-view .story-set-location-view-container').hide();
  $('#open-story-view .story-container-body').show();
}

//--- loadUserStories method ---//
function loadUserStories(onFinished) {
  stud_readUserStories(userNumberId,function(s) {
    userStories = sortStoriesWithDate(s);
    stud_readUserSavedStories(userNumberId,function(ss) {
      userSavedStories = sortStoriesWithDate(ss);
      if (onFinished)
        onFinished();
    });
  });
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

function getStoriesWithinMapBounds(stories) {
  var storyList = [];
  if (!map.getBounds()) return;
  var bounds = new google.maps.LatLngBounds(map.getBounds().getSouthWest(),map.getBounds().getNorthEast());
  var st_location;
  stories.forEach(function(st) {
    st_location = new google.maps.LatLng(st.location.latitude, st.location.longitude);
    if (bounds.contains(st_location)) {
      storyList.push(st);
    }
  })
  return storyList;
}

function getPublishedStoryById(storyId) {
	publishedStories.forEach(function(st) {
		if (st.id==storyId)
			return st;
	})
	return null;
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

function formatArticleSource(art) {
  var s = art.source;
  if (!s)
    s = getHostFromUrl(art.url);
  if (s.split('.')[0] == 'www')
    return s.replace('www.','')
  else
    return s;
}


function computeStoryDistance(pivotLatLng,story) {
	storyLatLng = new google.maps.LatLng(story.location.latitude, story.location.longitude, true)
	distance = google.maps.geometry.spherical.computeDistanceBetween(pivotLatLng, storyLatLng);
	return distance
}

function storyBelongsToCurrentUser(story) {
  if (user.domainUser.id == story.author.id)
    return true;
  else
    return false;
}

//--- drawPublishedStoryMarkersOnMap method ---//
function drawPublishedStoryMarkersOnMap(stories,icon) {
  markerList  = new Hashtable();

  var st_
	for ( var i = 0; i < stories.length; i++) {
		st_ = stories[i];
		if (st_.location != null) {
			var marker = new google.maps.Marker({
				position : new google.maps.LatLng(st_.location.latitude, st_.location.longitude, true),
				icon: icon,
				map : map,
				draggable : false,
        story: st_
			});
      //add to marker cluster
      markercluster.addMarker(marker);
			marker.addListener('click', function() {
        // map.setZoom(14);
        map.setCenter(new google.maps.LatLng(this.story.location.latitude, this.story.location.longitude, true) )
        drawStoryItemOnMapView(this.story);
      });
			markerList.put(st_.id,marker);
		}
	//fitStoryOnView(storyMarkerList);
	}
  return markerList;
}

function createStoryCollection(story) {
  var title = $('#story-collection-title-input').val();
  stud_createStoryCollection(title,
    function(collection) {
      if (story)
        addStoryToCollection(story.id,collection.id);
    },
    function() {alert('failed during collection creation')
  })
}

function addStoryToCollection(storyId,collectionId) {
  stud_addStoryToStoryCollection(storyId,collectionId, function() {}, function() {alert('failed: Couldn\'t add story to collection')})
}

function getHostFromUrl(url) {
	return url.split("//")[1].split("/")[0];
}

function setStoryText(text,jqTextElement) {
  jqTextElement.removeClass('empty');
  if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    jqTextElement[0].innerHTML = text.replace(/\n/g,'<br>');
  } else {
    jqTextElement[0].innerText = text;
  }
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

function stud_readUserStories(numberId, success, error){
	$.ajax({
		url: "/listuserstories/" + numberId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readUserSavedStories(numberId, success, error){
	$.ajax({
		url: "/listusersavedstories/" + numberId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_createStoryCollection(name, success, error){
	$.ajax({
		url: "/collection/" + name,
		type: "POST",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_addStoryToStoryCollection(storyId,collectionId, success, error){
	$.ajax({
		url: "/collection/" + collectionId + "/story/" + storyId,
		type: "POST",
    dataType: "json",
		success: success,
		error: error
	});
}
