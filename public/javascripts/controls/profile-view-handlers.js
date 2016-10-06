
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
var article = null;
var webUrl = null;
var storylocation;
var locationName;
var selectedImageCount;

var iframesize;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"

var markerIcon;

var libOpenWidth = 0.5;
var mapOpenWidth = 0.9;

var fr = null;
var saveimagefile = null;
var profileimagefile = null;

var lastAddress;

var isgrabWebsiteMetadataBusy;

var SINGLE_STORY = 1,
OPEN_STORY = 0;

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
			$('#user-link').html('<div/><span class="username">' + user.getFullName() + '  <span class="caret"></span></span>')
							.css('display' , 'block' );

			$('#user-link div').css('background-image','url(' + avatarUrl + ')');
      initiateMap();
      intializeEvents();
      initializeProfileDetails();
      loadUserStories(function() {
        userStoriesMarkerList = drawPublishedStoryMarkersOnMap(userStories,markerIcon);
        userSavedStoriesMarkerList = drawPublishedStoryMarkersOnMap(userSavedStories,markerIcon);
        drawStoryGridLayout();
        fitStoryOnView(userStoriesMarkerList.values().concat(userSavedStoriesMarkerList.values()),map);
        $('#stories-container').css('opacity','1');
      });
		},
		function (){
			user = null
			$('#login-link, #stories-link').css('display' , 'block' );
		}
	);
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

  //Sensible scroll map
  $('#profile-map-container').hover(function() {
    setTimeout(function () {
      $('#profile-map-cover').hide();
    }, 800);
  },
    function() {
      $('#profile-map-cover').show();
    });

  //--- Google Analytics track event ----//
	$(".ga-event-map-publish").click( function() {
		ga('send','event','map', 'publish') //Google Analytics track event
	});

	//----------------
	$(window).resize(function() {
		$('#content-wrapper').css({ height: $(window).innerHeight() - $('nav.navbar').height() });

    //resize of Vine's iframe
    iframesize = $('#create-edit-open-story-view .article-container').height();
    $('#create-edit-open-story-view  .vines-iframe').attr("width",iframesize)
                      .attr("height",iframesize);

    //drawStoryGridLayout(userStories.concat(userSavedStories))
	});

  //remove STORY IMAGE
  $('#create-edit-open-story-view #remove-story-image').click(function() {
    $('#create-edit-open-story-view #story-image-container').hide();
    $('#create-edit-open-story-view #story-image').attr('src','');
    saveimagefile = null;
  });

  //add ARTICLE LINK
  $('#create-edit-open-story-view #story-add-link-button').click(function() {
    $('#create-edit-open-story-view #story-insert-article').show();
  });

  //remove ARTICLE LINK
  $('#create-edit-open-story-view #close-article-link').click(function() {
    $('#create-edit-open-story-view #story-insert-article').hide();
    $('#create-edit-open-story-view #article-link').val('');
    article = null;
    removeArticleContainer();
  });

  //STORY TEXT AREA: LOOK FOR URL AND SET ARTICLE
	$('#create-edit-open-story-view #article-link').keyup(function() {
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
			$('#story-image').attr('src', ev2.target.result);
		};

		fileReader.readAsDataURL(saveimagefile);
		fr = fileReader;
	});

  // CHANGE PROFILE IMAGE
	$('#profile-settings-view #f').change(function(ev) {
		profileimagefile = ev.target.files[0];
		var fileReader = new FileReader();

    fileReader.onload = function(ev2) {
			$('#profile-settings-view #profile-image').css('background-image','url(' + ev2.target.result + ')');
		};
		fileReader.readAsDataURL(profileimagefile);
	});
}

function  initializeProfileDetails() {
  if (user.getAvatarUrl())
    avatarUrl = user.getAvatarUrl();
  else
    avatarUrl = defaultAvatarPic
  $('#profile-image').css('background-image','url(' + avatarUrl + ')');
  $('#profile-name').html(user.getFullName());

  $('#profile-stat-user-created #value').html(user.domainUser.noOfStories);
  $('#profile-stat-user-saved #value').html(user.domainUser.noOfSaved);
  $('#profile-stat-user-followers #value').html(user.domainUser.noOfFollowers);
  $('#profile-stat-user-folllowing #value').html(user.domainUser.noOfFollowing);


}

function openProfileSettingsView() {
  if (user.getAvatarUrl())
    avatarUrl = user.getAvatarUrl();
  else
    avatarUrl = defaultAvatarPic
  $('#profile-settings-view #profile-image').css('background-image','url(' + avatarUrl + ')');
  $('#profile-settings-view #profile-name').val(user.getFullName());
  $('#profile-settings-view').modal('show');
}

function saveProfileSettings() {
  user.domainUser.fullName = $('#profile-settings-view #profile-name').val();
  stud_updateUser(user.domainUser,function(user_) {
    user.domainUser = user_;
    if (profileimagefile)
      uploadProfileImage(function(data) {
        user.domainUser.avatarUrl = data.imageUrl;
        $('#profile-details-container #profile-image').css('background-image','url(' + data.imageUrl + ')');
        $('#user-link div').css('background-image','url(' + data.imageUrl + ')');
      });
    profileimagefile = null;
    $('#profile-details-container #profile-name, .username').text(user.domainUser.fullName);
    drawStoryGridLayout();
    $('#profile-settings-view').modal('hide');
  }, function() {
    alert('failed to update profile')
  });
}

function closeProfileSettingsView() {
  $('#profile-settings-view').modal('hide');
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
  // Add Create Story Container
  var createStoryContainer = $('<div id="create-story-btn-container" class="story-container"/>').addClass('animate-transition');;
  $('<div id="create-story-btn">CREATE STORY</div>').appendTo(createStoryContainer)
                                                    .click(function() {
                                                      openStoryView(null,{new:true});
                                                    });
  columnCommuter = (counter++ % noColumns) + 1;
  createStoryContainer.appendTo($('#column-' + columnCommuter));

  // Add remaining Story Containers
  // var stories = getStoriesWithinMapBounds(stories);
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
                                                                    if (storyBelongsToCurrentUser(story))
                                                                      openStoryView(story,{edit:true});
                                                                    else
                                                                      openStoryView(story,{readonly:true});
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
  authorContainer.append('<a class="story-author-name" href="/profile/' + story.author.numberId + '">' + authorName +  '</a>')

  //Story Options Button container
  var optionsBtnContainer = $('<div class="story-options-btn-container pull-right dropdown"/>').appendTo(storyContainerHeader);
  var optionsBtn = $('<div class="story-options-btn dropdown-toggle" id="dropdownMenu1" data-toggle="dropdown"/>').appendTo(optionsBtnContainer);
  $('<div/>').appendTo(optionsBtn);
  $('<div/>').appendTo(optionsBtn);
  $('<div/>').appendTo(optionsBtn);

  //Story Options Dropdown container
  var optionsList = $('<ul class="options-list dropdown-menu" aria-labelledby="dropdownMenu1"/>').appendTo(optionsBtnContainer);

  if (storyBelongsToCurrentUser(story)) {
    $('<li><a href="#" >Edit</a></li>').appendTo(optionsList)
                                        .click(function() {
                                          openStoryView(story,{edit:true});
                                        });
    $('<li><a href="#">Delete Story</a></li>').appendTo(optionsList)
                                              .click(function() {
                                                deleteStory(story.id, function(response) {
                                                  $('#profile-stat-user-created #value').html(response.noOfStories);
                                                  removeStoryFromUserStoriesList(story);
                                                  drawStoryGridLayout();
                                                });
                                              });
  } else {
    $('<li><a href="#">Open</a></li>').appendTo(optionsList)
                                      .click(function() {
                                        openStoryView(story,{readonly:true});
                                      });
    $('<li><a href="#">Remove Story</a></li>').appendTo(optionsList)
                                              .click(function() {
                                                saveStory(story.id, function(response) {
                                                  $('#profile-stat-user-saved #value').html(response.noOfSaved);
                                                  removeStoryFromSavedStoriesList(story);
                                                  drawStoryGridLayout();
                                                });
                                              });
  }


  //--- BODY ---//

  //Story location container
  var locationContainer = $('<div class="location-container"/>').appendTo(storyContainerBody);

  if (!story.locationName || story.locationName && story.locationName.length == 0)
    story.locationName = "(a location)"
  $('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-10px flaticon-location"></div>').appendTo(locationContainer);
  $('<p class="location">' + story.locationName + '</p>').appendTo(locationContainer);

  if (story.format == OPEN_STORY) {
    //Thumbnail: article image or story image
    var imageContainer = $('<div class="image-container"/>').attr('id', 'image-story-' + story.id).appendTo(storyContainerBody);

    if (!story.title || story.title && story.summary.title == 0)
      story.title = "(A Story Title)"
    var titleContainer = $('<div class="title-container"/>').appendTo(storyContainerBody);
    var title = $('<p class="story-title"/>').appendTo(titleContainer).text(story.title);

    if (story.thumbnail && story.thumbnail.length > 0) {
      $('<img atl="image for ' + story.title + '">').appendTo(imageContainer)
                                                    .attr('src',PICTURES_SERVER_PATH + story.thumbnail);
    }

    if (!story.summary || story.summary && story.summary.length == 0)
      story.summary = "(a story summary...)"
    var summaryContainer = $('<div class="summary-container"/>').appendTo(storyContainerBody);
    var summary = $('<p class="story-summary"/>').appendTo(summaryContainer);
    setStoryText(story.summary,summary);
    var summaryContainerOverlay = $('<div class="summary-container-overlay"/>').appendTo(summaryContainer);

  } else if (story.format == SINGLE_STORY) {
    if (!story.summary || story.summary && story.summary.length == 0)
	    story.summary = "(a story summary...)"
	  var summaryContainer = $('<div class="summary-container"/>').appendTo(storyContainerBody);
	  var summary = $('<p class="story-summary"/>').appendTo(summaryContainer);
	  setStoryText(story.summary,summary);

		//Thumbnail: article image or story image
	  var imageContainer = $('<div class="image-container"/>').attr('id', 'image-story-' + story.id).appendTo(storyContainerBody);
		if (story.thumbnail && story.thumbnail.length > 0) {
	    $('<img>').appendTo(imageContainer).attr('src',PICTURES_SERVER_PATH + story.thumbnail);
	  }
  }

  //--- FOOTER ---//

  var storyStatsContainer = $('<div class="story-stats-container"/>').appendTo(storyContainerFooter);
  if (story.published != 0) {
    // Stats: Likes and Saves
    $('<div class="story-stats-likes">' + story.noOfLikes + ' likes</div>').appendTo(storyStatsContainer);
    $('<div class="story-stats-saves">' + story.noOfSaves + ' saves</div>').appendTo(storyStatsContainer);
  } else {
    $('<div class="story-status">This story is unpublished.</div>').appendTo(storyStatsContainer);
  }


  return storyContainer;
}

function addArticleContainer(art) {
  removeArticleContainer();
  buildArticleContainer(art,$('#create-edit-open-story-view .story-container-body'),{size:"large",autoplay:true})
}

function removeArticleContainer() {
  $('#create-edit-open-story-view .article-container').remove();
}

function buildArticleContainer(art,addToContainer,options) {
  var articleContainer = $('<div class="article-container"/>').appendTo(addToContainer);

  if (getHostFromUrl(art.url) == "vine.co") {
    buildVineContainer(art.url,articleContainer,options);
  } else if (getHostFromUrl(art.url) == "www.youtube.com" || getHostFromUrl(art.url) == "youtu.be") {
    buildYouTubeContainer(art.url,articleContainer,options);
  } else if (getHostFromUrl(art.url) == "vimeo.com") {
    buildVimeoContainer(art.url,articleContainer,options);
  } else if (getHostFromUrl(art.url) == "www.instagram.com") {
		buildInstagramContainer(art.url,articleContainer,options);
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
  if (getHostFromUrl(link) == "www.youtube.com")
		var videoId = link.split('https://www.youtube.com/watch?v=')[1];
	else if (getHostFromUrl(link) == "youtu.be")
  	var videoId = link.split('https://youtu.be/')[1];
  var autoplay = (options.autoplay) ? 1 : 0;
  var src = "https://www.youtube.com/embed/" + videoId + "?rel=0&amp;showinfo=0&amp;autoplay=" + autoplay;
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
	if (options.autoplay) {
		var autoplay = 1;
	} else {
		videoId = videoId.split('#',1)[0];
		var autoplay = 0;
	}
  var src = "https://player.vimeo.com/video/" + videoId + "?autoplay=" + autoplay + "&color=ff0179&title=0&byline=0&portrait=0"
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

function buildInstagramContainer(link,addToContainer,options) {
	var iframeContainer = $('<div class="article-embebed-iframe-container"/>').appendTo(addToContainer);
	fetchInstagramEmbedIframe(link, function(data) {
		var iframe = $(data.html).appendTo(iframeContainer);
		if (options.size == "large") {
			addToContainer.addClass('large-view-instagram');
			var iframeWidth = 540;
			addToContainer.width(iframeWidth);
		} else {
			var iframeWidth = addToContainer.width();
		}
		iframe.attr("width",iframeWidth);
		iframeContainer.innerWidth(iframeWidth)
									 .show();
		instgrm.Embeds.process();
		return iframeContainer;
	});
}

function openStoryView(story,option) {
  if (option.edit || option.readonly && story.published == 0)
    window.location.href = LIR_SERVER_URL + '/story/edit/' + story.id;
  else if (option.new)
    window.location.href = LIR_SERVER_URL + '/story/create'
  else if (option.readonly)
    window.location.href = LIR_SERVER_URL + '/story/read/' + story.id;
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
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		mapTypeControl : true,
		mapTypeControlOptions : {style: google.maps.MapTypeControlStyle.DEFAULT, position: google.maps.ControlPosition.LEFT_BOTTOM},
		center : defaultLocation
	}

	storymap = new google.maps.Map(document.getElementById('story-map-canvas'),mapOptions);

  if (storyLocationMarker) {
    storyLocationMarker.setMap(storymap);
    fitStoryOnView([storyLocationMarker],storymap);
    // storymap.setCenter(storyLocationMarker.getPosition());
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
		mapTypeId : google.maps.MapTypeId.ROADMAP,
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
  locationName = $('#create-edit-open-story-view #story-map-location-input').val();
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
  $('#create-edit-open-story-view .location').text(locationName);
}

function showStoryMap() {
  $('#create-edit-open-story-view .story-container-body').hide();
  $('#create-edit-open-story-view .story-set-location-view-container').show();
  initiateStoryMap();
}

function hideStoryMap() {
  $('#create-edit-open-story-view .story-set-location-view-container').hide();
  $('#create-edit-open-story-view .story-container-body').show();
}

//--- fitStoryOnView ---//
function fitStoryOnView(markers,map) {
	//if (!story) return;
	var bound = new google.maps.LatLngBounds();
	if (markers.length == 0) {
		return;
	}
	else if (markers.length == 1) {
		if (map)
			map.setOptions({
				center: markers[0].getPosition(),
				zoom : 16
			});
	} else {
		for (var i = 0; i < markers.length; i++) {
				bound.extend( markers[i].getPosition() );
		}
		if (map) map.fitBounds(bound);
	}
}

//--- loadUserStories method ---//
function loadUserStories(onFinished) {
  stud_readCurrentUserStories(function(strs) {
    userStories = [];
    userSavedStories = [];
    var count = 0;
    while (count < strs.length && !strs[count].isDummy ) {
      userStories.push(strs[count]);
      count++;
    }
    count++;
    while (count < strs.length && !strs[count].isDummy ) {
      userSavedStories.push(strs[count]);
      count++;
    }
    userStories = sortStoriesWithDate(userStories);
    userSavedStories = sortStoriesWithDate(userSavedStories);
    if (onFinished)
      onFinished();
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

function postingFinished(story) {
  $('#story-publish-button').text('Post').removeAttr('disabled');
  closeStoryView();
  $('#profile-stat-user-created #value').html(parseInt($('#profile-stat-user-created #value').html()) + 1);

  userStories.push(story);
  addMarkerForStoryInList(story,userStoriesMarkerList,markerIcon);
  drawStoryGridLayout()
  // loadUserStories(function() {
  //   drawStoryGridLayout(userStories.concat(userSavedStories))
  // });
}

function editFinished(story) {
  $('#story-publish-button').text('Post').removeAttr('disabled');
  closeStoryView();
  updateStoryFromUserStoriesList(story);
  //if position changes the marker must be repositioned
  updateMarkerPosition(story);
  drawStoryGridLayout()
  // loadUserStories(function() {
  //   drawStoryGridLayout(userStories.concat(userSavedStories))
  // });
}

function postingError() {
  $('#story-publish-button').text('Post').removeAttr('disabled');
  alert('Posting Failed. Error while posting the story.')
}

function storyBelongsToCurrentUser(story) {
  if (story.userCanEdit)
    return true;
  else
    return false;
}

function removeStoryFromUserStoriesList(story) {
  index = userStories.indexOf(story);
  if (index > -1) {
    userStories.splice(index,1);
  }
  //remove marker
  removeMarkerForStoryInList(story,userStoriesMarkerList);
}

function removeStoryFromSavedStoriesList(story) {
  index = userSavedStories.indexOf(story);
  if (index > -1) {
    userSavedStories.splice(index,1);
  }
  //remove marker
  removeMarkerForStoryInList(story,userSavedStoriesMarkerList);
}

function updateStoryFromUserStoriesList(story) {
  for (var i in userStories) {
    if (userStories[i].id == story.id) {
      userStories[i] = story;
    }
  }
}

function updateMarkerPosition(story) {
  var marker = userStoriesMarkerList.get(story.id);
  marker.setPosition(new google.maps.LatLng(story.location.latitude, story.location.longitude, true));
  marker.story = story;
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

function addMarkerForStoryInList(story,list,icon) {
  var marker = new google.maps.Marker({
    position : new google.maps.LatLng(story.location.latitude, story.location.longitude, true),
    icon: icon,
    map : map,
    draggable : false,
    story: story
  });
  markercluster.addMarker(marker);
  marker.addListener('click', function() {
    // map.setZoom(14);
    map.setCenter(new google.maps.LatLng(this.story.location.latitude, this.story.location.longitude, true) )
    drawStoryItemOnMapView(this.story);
  });
  list.put(story.id,marker);
}

function removeMarkerForStoryInList(story,list) {
  var marker = list.get(story.id);
  if (marker == null) return;
  markercluster.removeMarker(marker);
  marker.setMap(null);
  list.remove(story.id);
}

//--- createStory method ---//
function createStory() {
  hideStoryMap();

	if (!user) {
    alert('Failed to post. User not logged in.')
    return;
  }
  if ($('#create-edit-open-story-view #story-map-location-input').val() == "" || storylocation == null) {
    alert('Failed to post. You must select a location.')
    return;
  }

  $('#story-publish-button').text('Posting...').attr('disabled','disabled');

  if (editingstory) {
    editStory();
    return;
  }

	var story = newStoryObj(map);
	//set new story title
	story.setTitle("story_" + user.domainUser.numberId + "_" + new Date().getTime());
  story.setLocation(storylocation.latitude,storylocation.longitude);
  //set location name
  story.setLocationName(locationName);
	story.setSummary(getStoryText($('#create-edit-open-story-view #story-text')));
  story.setPublished(1);
  //setArticle
  if (article) {
		story.setArticle(article.title,
						article.description,
						article.imageUrl,
						article.url,
            article.date,
            article.source,
            article.author)
	}

  //save story on server
  stud_createStory(story.domainStory,function(st){
		//upload story pics
		if (saveimagefile) {
			uploadStoryImage(st.id,function() {
        postingFinished(pubsStory);
      },
      function() {
        postingError();
			});
		} else {
      postingFinished(pubsStory);
		}
	},
  function() {
    postingError();
  });
}

function editStory() {
  var story = newStoryObj(map);
	//set new story title
	story.setTitle(editingstory.title);
	story.setLocation(storylocation.latitude,storylocation.longitude);
  //set location name
  story.setLocationName(locationName);
	story.setSummary(getStoryText($('#create-edit-open-story-view #story-text')));
  //setArticle
  if (article) {
		story.setArticle(article.title,
						article.description,
						article.imageUrl,
						article.url,
            article.date,
            article.source,
            article.author)
	} else if (!article && editingstory.articleLink ) {
    story.setArticle("","","","","","","");
  }

  //save story on server
	stud_createStory(story.domainStory,function(st){
		//upload story pics
		var storyId = st.id;
		if (saveimagefile) {
			uploadStoryImage(storyId,function(thumbnail) {
        st.thumbnail = thumbnail;
        editFinished(st);
			});
		} else if (hasImageToDelete(st)) {
      deleteStoryImage(storyId, function(thumbnail) {
        st.thumbnail = thumbnail;
        editFinished(st);
      })
		} else {
      editFinished(st);
    }
	},
  function() {
    postingError();
  });
}

function createStoryCollection(story) {
  var title = $('#story-collection-title-input').val();
  stud_createStoryCollection(title,function(collection_) {
      if (story)
        addStoryToCollection(story.id,collection_.id);
      user.domainUser.storyCollections.push(collection_);
      $('<li><a href="/collection/' + collection_.id + '">' + collection_.name + '</a></li>').appendTo($('#story-collections-list'));
    },
    function() {alert('failed during collection creation')
  })
}

function addStoryToCollection(storyId,collectionId) {
  stud_addStoryToStoryCollection(storyId,collectionId, function() {}, function() {alert('failed: Couldn\'t add story to collection')})
}

function hasImageToDelete(st) {
  var imagesrc = $('#create-edit-open-story-view #story-image').attr('src');
  if (imagesrc == "" && (st.thumbnail != "" && st.thumbnail))
    return true;
  return false;
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
    article.url = webUrl;
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
	return url.split("//")[1].split("/")[0];
}

function loadStoryTextBehaviours() {
  // elastic behaviour
  var storyTextElem = $('#story-text');

  storyTextElem.elastic();

  //placeholder
  var placeholder = storyTextElem.attr('placeholder');

  //event listeners
  storyTextElem.html('<span class="placeholder">' + placeholder + '</span>')
                .addClass('empty')
                .focusin(function() {
                  $('#story-text.empty').html("").removeClass('empty');
                })
                .focusout(function() {
                  if (storyTextElem.html() == '' || storyTextElem.html()== '<br>' )
                    storyTextElem.html('<span class="placeholder">' + placeholder + '</span>').addClass('empty');
                  });
}

function setStoryText(text,jqTextElement) {
  jqTextElement.removeClass('empty');
  if (!text) {
    var placeholder = jqTextElement.attr('placeholder');
    jqTextElement.html('<span class="placeholder">' + placeholder + '</span>').addClass('empty');
    return;
  }
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
                                    // .replace(/[^\x00-\x7F]/g, "")
                                    // .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
  }
  return jqTextElement[0].innerText
                          // .replace(/[^\x00-\x7F]/g, "")
                          // .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
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
    dataType: "json",
	  success: onFinished
	} );
}

function uploadProfileImage(onFinished) {
	url = '/user/uploadavatar';
	var uploadImageForm = new FormData($('#profile-settings-view #image-upload-form')[0]);
	$.ajax( {
	  url: url,
	  type: 'POST',
	  data:  uploadImageForm,
	  processData: false,
	  contentType: false,
    dataType: "json",
	  success: onFinished
	} );
}

function deleteStoryImage(storyId,success,error) {
  $.ajax({
		url: '/story/'+storyId+'/deleteimage',
		type: "DELETE",
    dataType: "json",
		success: success,
		error: error
	});
}

function unpublish(storyId, onFinished){
	$.ajax({
		url: "/story/publish/" + storyId + "/0",
		type: "POST",
		dataType: "json",
		// contentType:"application/json",
		success: onFinished,
		error: function() {console.log("Couln't unpublish story");}
	});
}

function likeStory(storyId, onFinished){
	$.ajax({
		url: "/story/like/" + storyId,
		type: "PUT",
		dataType: "json",
		success: onFinished,
		error: function() {console.log("Couln't like story");}
	});
}

function saveStory(storyId, onFinished){
	$.ajax({
		url: "/story/save/" + storyId,
		type: "PUT",
		dataType: "json",
		success: onFinished,
		error: function() {console.log("Couln't save story");}
	});
}

function deleteStory(storyId, success, error){
	$.ajax({
		url: "/story/" + storyId,
		type: "DELETE",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_readCurrentUserStories(success, error){
	$.ajax({
		url: "/listuserstories",
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readCurrentUserSavedStories(success, error){
	$.ajax({
		url: "/listusersavedstories",
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

function stud_updateUser(domainUser, success, error){
	$.ajax({
		url: "/user/update",
		type: "PUT",
    dataType: "json",
		data: JSON.stringify(domainUser),
		contentType:"application/json",
		success: success,
		error: error
	});
}

function fetchInstagramEmbedIframe(link,onFinished) {
	$.ajax( {
	  url: '/fetchinstagram/' + encodeURIComponent(link),
	  type: 'GET',
	  dataType: "json",
	  success: onFinished
	} );
}
