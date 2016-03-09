
/******************************************************************
	GLOBAL VARIABLES
******************************************************************/

var map;
var herosearchBox;
var hero5searchBox;
var mapsearchBox;

var article;
var saveimagefile = null;
var fr;

var defaultLocation = new google.maps.LatLng(37, -20);

var indexStories;
var indexStoriesMarkerList;
var indexStoryPathsList;
var previousCenter = defaultLocation;
var previousZoom = 2;

var user = null;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"

var markerIcon;

var editingMode = false;
var editingstory;
var article;
var locationName;
var storylocation;
var storyLocationMarker;

var isgrabWebsiteMetadataBusy = false;

var animationBusy = false;
var isStoryViewOpen = false;

var locationSetMode = 'pinpoint';

var contentheight,
contentwidth,
storyContainersWrapperWidth,
storyContainersWrapperHeight,
storiesGridListContainerWidth,
noColumns;

/******************************************************************
	INITIALIZATION
******************************************************************/

function initialize() {

	//$('#blog-link').css('display' , 'block' );

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
		user = null
		$('#login-link, #stories-link').css('display' , 'block' );
	});
	initiateMap();
	intializeEvents();
	loadHighlightedStories();
	setLayoutDimensions();
}

function loadStories(bounds_,onFinished) {
	if (isStoryViewOpen) return;
	if (!bounds_) {
		var bounds_ = getBounds()
	}
	var w = bounds_.west,
	n = bounds_.north,
	e = bounds_.east,
	s = bounds_.south;
  stud_readPublicStoriesWithinBounds(w, n, e, s, 20, function(stories) {
		indexStories = stories;
		// drawLayout(indexStories);
		setLayoutDimensions(indexStories);
		// fitMapBoundsOnLayout(bounds_);
		indexStoriesMarkerList = drawMarkersOnMap(indexStories,markerIcon);
		if (indexStories.length == 0) displayAlertMessage('There are no stories here');
		if (onFinished) onFinished(stories);
  });
}

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

function intializeEvents() {
	contentheight = $(window).innerHeight() - $('nav.navbar').height();
	contentwidth = $('#content-wrapper').innerWidth();
	$('#content-wrapper, .hero-container').css({ height: contentheight });

	//----------------
	storyContainersWrapperHeight = contentheight - $('#story-containers-wrapper').css('margin-top').replace("px", "");
	storyContainersWrapperWidth = contentwidth;

	$('#story-containers-wrapper').css({
		height: storyContainersWrapperHeight,
		width: storyContainersWrapperWidth
	});

	//----------------
	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');

	//Map Sight
	$('#map-viewport').css({
		height: contentheight,
	});

	$('#map-region').resizable({
		resize: function( event, ui ) {
			var width = ui.size.width;
			ui.element.css({
				marginTop: -width/2,
				marginLeft: -width/2,
				width: width,
				height: width
			});
			$('#map-region').removeClass('selected');
		}
  });

  // COVER OPEN AND CLOSE DOMMouseScroll WheelEvent
  $("#content-wrapper").bind("wheel", function(event) {
		if (animationBusy || $("#content-wrapper").hasClass('showing-map')) return;
		if (event.originalEvent.deltaY >= 1) {
			animationBusy = true;
			var top = -$('#heros-container').position().top + contentheight;
			if (top >= 5*contentheight) {
				animationBusy = false;
				return;
			}
			$('#heros-container').animate({top: -top}, 500,"easeOutQuart", function() {
				$('#featured-stories-container').show();
			});
			setTimeout(function () { animationBusy = false }, 1000);
		} else if (event.originalEvent.deltaY <= -1) {
			animationBusy = true;
			var top = -$('#heros-container').position().top - contentheight;
			if (top < 0) {
				animationBusy = false;
				return;
			}
			$('#heros-container').animate({top: -top}, 500,"easeOutQuart");
			setTimeout(function () { animationBusy = false }, 1500);
		}
  });

  //--- Google Analytics track event ----//
	$(".ga-event-map-publish").click( function() {
		ga('send','event','map', 'publish') //Google Analytics track event
	});

	// RESIZE
	$(window).resize(function() {
		updateLayoutDimensions();
    //resize of Vine's iframe
    iframesize = $('.article-container').height();
    $('.vines-iframe').attr("width",iframesize)
                      .attr("height",iframesize);
	});


	// Next/previous story controllers
	$('#story-large-layout-controllers .lg-arrow-left').click(function() {
		var storyId = $('#story-large-layout-container .story-container').attr('storyId'),
		previousstory = getPreviousStoryFromIndexStoriesList(storyId);
		if (!previousstory) return;
		var largeStoryContainer = buildStoryLargeContainer(previousstory);
		$('#story-large-layout').animate({left: -contentwidth}, 300, "easeOutQuart", function() {
			$('#story-large-layout').hide().css('left', contentwidth + 'px').show();
			$('#story-large-layout-container').html(largeStoryContainer);
			$('#story-large-layout').animate({left: 0}, 300, "easeOutQuart");
			fitStoryOnView(previousstory,map);
		});
	});

	$('#story-large-layout-controllers .lg-arrow-right').click(function() {
		var storyId = $('#story-large-layout-container .story-container').attr('storyId'),
		nextstory = getNextStoryFromIndexStoriesList(storyId);
		if (!nextstory) return;
		var largeStoryContainer = buildStoryLargeContainer(nextstory);
		$('#story-large-layout').animate({left: contentwidth}, 300, "easeOutQuart", function() {
			$('#story-large-layout').hide().css('left', -contentwidth + 'px').show();
			$('#story-large-layout-container').html(largeStoryContainer);
			$('#story-large-layout').animate({left: 0}, 300, "easeOutQuart");
			fitStoryOnView(nextstory,map);
		});
	});

	// PRESS ESCAPE
	document.onkeydown = function(event) {
		if (event.keyCode == 27) {

		}
	}

  $('[data-toggle="tooltip"]').tooltip({delay: { "show": 1500, "hide": 100 }})

}

/******************************************************************
	DRAW AND CONTROL LAYOUTS
******************************************************************/

function openStoryLayoutView() {
	$("#content-wrapper").addClass('showing-map');
	$('#index-heros').animate({top: '100%'}, 300,"easeOutQuart")
	if (user) {
		$('#search-and-controls-bar, #create-story').show().animate({opacity: 1}, 300, "easeOutQuart");
	}	else {
		$('#search-and-controls-bar').show().animate({opacity: 1}, 300, "easeOutQuart");
	}
}

function drawLayout(stories,options) {
	if (!options) var options = {keephidden:false}
	if (!$("#content-wrapper").hasClass('showing-map'))
		openStoryLayoutView();
	//timeout for performance reasons
	$('#story-grid-layout').animate({top: '100%'}, 300, "easeOutQuart");
	$('#story-grid-layout').scrollTop(0);
	if (stories.length == 0) return;
	setTimeout(function() {
		drawStoryGridLayout(stories);
		setTimeout(function () {
			if (!options.keephidden) $('#story-grid-layout').animate({top: 0}, 300, "easeOutQuart", function() {
				$('#story-large-layout').removeClass('active')
				$('#story-grid-layout').addClass('active')
			});
		}, 400);
	}, 100);
}

function drawStoryGridLayout(stories) {

  $('#story-grid-layout .story-container').remove();
	var storiesGridLayoutContainer = $("#story-grid-layout");

	if(!stories || stories.length == 0) {
		$('#no-stories-message').show();
		return;
	} else
		$('#no-stories-message').hide();

	// var stories = sortStoriesByDate(stories);
	$('.layout-column').remove();
  for ( var i = 1; i <= noColumns; i++) {
    $('<div id="column-' + i + '" class="layout-column"/>').appendTo(storiesGridLayoutContainer)
  }


  var columnCommuter;
  counter = 0;

  // Add remaining Story Containers
  // var storiesinbounds = getStoriesWithinMapBounds(stories);
  // var storiesSortedByDate = sortStoriesByDate(storiesinbounds);

  stories.forEach(function(story) {
    var container = buildStorySmallContainer(story);
    columnCommuter = (counter++ % noColumns) + 1;
    container.appendTo($('#column-' + columnCommuter));
  });
}

function drawStoryLargeLayout(story,options) {
	if (!options) var options = {loadstories:false}
	if (options.loadstories) {
		loadStories(null,function(stories) {
			drawLayout(stories,{keephidden:true})
			drawStoryLargeLayout(story);
		});
		return;
	}
	isStoryViewOpen = true;
	var largeStoryContainer = buildStoryLargeContainer(story,options);

	// update layout
	$('#story-large-layout-container').html(largeStoryContainer);
	$('#map-viewport').innerWidth(contentwidth - $('#story-large-layout').outerWidth());
	$('#story-large-layout-controllers').show();

	//fir story on map
	previousCenter = map.getCenter();
	previousZoom = map.getZoom();
	fitStoryOnView(story,map);

	// Show
	$('#story-grid-layout').animate({top: '100%'}, 300, "easeOutQuart");
	$('#story-large-layout').animate({top: 0}, 300, "easeOutQuart", function() {
		$('#story-large-layout').addClass('active')
		$('#story-grid-layout').removeClass('active')
	});
}

function openCreateStoryView() {
	isStoryViewOpen = true;
	var story = new Object();
	$('.location.editable').val($('#search-input').val());
	story.author = {fullName:user.getFullName(),avatarUrl:user.getAvatarUrl()}
	var largeStoryContainer = buildStoryLargeContainer(story,{editable:true,new:true});
	$('#story-large-layout').animate({top: '100%'}, 150, "easeOutQuart", function() {
		$('#story-large-layout-container').html(largeStoryContainer);
		$('#map-viewport').innerWidth(contentwidth - $('#story-large-layout').outerWidth());
		$('#story-large-layout-controllers').hide();
		$('#story-large-layout').animate({top: 0}, 150, "easeOutQuart", function() {
			$('#story-large-layout').addClass('active')
			$('#story-grid-layout').removeClass('active')
		});
	});
	$('#story-grid-layout').animate({top: '100%'}, 300, "easeOutQuart");
	previousCenter = map.getCenter();
	previousZoom = map.getZoom();
}

function openEditStoryView(story) {
	isStoryViewOpen = true;
	editingstory = story;
	if (story.articleLink)
		article = {
			title: story.articleTitle,
			description: story.articleDescription,
			author: story.articleAuthor,
			imageUrl: story.articleImage,
			source: story.articleSource,
			url: story.articleLink
		}
	locationName = story.locationName
	storylocation = story.location;
	$('.location.editable').val(locationName);
	var largeStoryContainer = buildStoryLargeContainer(story,{editable:true});
	$('#story-large-layout-container').html(largeStoryContainer);
	$('#map-viewport').innerWidth(contentwidth - $('#story-large-layout').outerWidth());
	previousCenter = map.getCenter();
	previousZoom = map.getZoom();
	//Zoom in on the story location
	fitStoryOnView(story,map);
	$('#story-grid-layout').animate({top: '100%'}, 300, "easeOutQuart");
	$('#story-large-layout').animate({top: 0}, 300, "easeOutQuart", function() {
		$('#story-large-layout').addClass('active')
		$('#story-grid-layout').removeClass('active')
	});
}

function closeStoryView(options) {
	if (!options) var options = {keephidden:false,featured:false}
	$('#map-viewport').innerWidth(contentwidth - $('#story-grid-layout').outerWidth());
	$('#story-grid-layout').animate({top: 0}, 300, "easeOutQuart", function() {
		$('#story-large-layout').removeClass('active')
		$('#story-grid-layout').addClass('active')
	});
	$('#story-large-layout').animate({top: '100%'}, 300, "easeOutQuart",function() {
		$('#story-large-layout-container').html('');
	});
	$('#map-region, #map-sight').hide();
	$('#map-viewport').innerWidth(contentwidth - $('#story-grid-layout').outerWidth());
	$('#map-region').removeClass('selected');
	$('#story-large-layout-controllers').hide();
	$('.marker-div').removeClass('highlighted');
	map.panTo(previousCenter);
	map.setZoom(previousZoom);
	isStoryViewOpen = false;
	editingstory = null;
	article = null;
	locationName = null;
	storylocation = null;
	saveimagefile = null
	if (storyLocationMarker) {
		storyLocationMarker.setMap(null);
		storyLocationMarker = null;
	}
}

/******************************************************************
	BUILD SMALL CONTAINER
******************************************************************/

function buildStorySmallContainer(story,options) {
	if (!options)
		var options = {featured:false}

  var storyContainer = $('<div/>').attr('id', 'story-' + story.id).attr('storyId', story.id)
            .addClass('story-container sm-container');

	storyContainer.hover(function() {
		$('#story-' + story.id + '.story-container.sm-container').addClass('highlighted');
		if (story.location && story.location.showpin && !options.featured)
			indexStoriesMarkerList.get(story.id).addClass('highlighted')
	} , function() {
		$('#story-' + story.id + '.story-container.sm-container').removeClass('highlighted');
		if (story.location && story.location.showpin && !options.featured)
			indexStoriesMarkerList.get(story.id).removeClass('highlighted')
	});


  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(storyContainer)
                                                                  .click(function() {
																																		if (options.featured) {
																																			openStoryLayoutView();
																																			$('#map-viewport').innerWidth(contentwidth - $('#story-large-layout').outerWidth());
																																			fitStoryOnView(story,map);
																																			drawStoryLargeLayout(story,{loadstories:true});
																																		} else
                                                                    	drawStoryLargeLayout(story);
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

  $('<li class="option-open"><a href="#">Open</a></li>').appendTo(optionsList)
                                    .click(function() {
                                      drawStoryLargeLayout(story);
                                    });


	var editStoryBtn = $('<li class="option-edit"><a href="#">Edit Story</a></li>').appendTo(optionsList)
                                            .click(function() {
																							openEditStoryView(story);
                                            });
	if (storyBelongsToCurrentUser(story)) editStoryBtn.css('display','block');

  $('<li class="divider"></li>').appendTo(optionsList);
  $('<li> <a href="#">Add to</a></li>').appendTo(optionsList)
                                        .click(function() {
																					if (user)
                                          	openChooseCollectionView(story);
																					else
																						displayAlertMessage('You need to login.')
                                        });
	// Highlight story (only for admin)
	if (user && (user.admin || user.domainUser.email == 'jose@lostinreality.net')) {
		$('<li><a href="#">Highlight</a></li>').appendTo(optionsList)
	                                        .click(function() {
																						if (user)
	                                          	stud_highlightItem(story.id,story.type);
	                                        });
	}

	if (options.featured) {
		optionsBtnContainer.hide();
	}

  //--- BODY ---//

  //Story location container
  var locationContainer = $('<div class="location-container"/>').appendTo(storyContainerBody);

  var location = "";
  if (story.locationName && story.locationName.length > 0)
    location = story.locationName;
  $('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-10px flaticon-location"></div>').appendTo(locationContainer);
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

	// Story Collections
	if (story.collections.length > 0 && !options.featured) {
		var storyCollectionsContainer = $('<div class="story-collections-container"/>').appendTo(storyContainerFooter);
		$('<p>Story appears on collection:</p>').appendTo(storyCollectionsContainer);
		story.collections.forEach(function(collection) {
			var collectionItem = $('<div class="collection-item" ></div>').appendTo(storyCollectionsContainer);
			$('<div class="collection-thumbnail"></div>').appendTo(collectionItem).css('background-image','url(' + collection.imageUrl + ')');
			$('<a class="collection-name" href="/collection/' + collection.id + '">' + collection.name + '</a>').appendTo(collectionItem);
		});
	}



  return storyContainer;
}

/******************************************************************
	BUILD SMALL COLLECTION CONTAINER
******************************************************************/

function buildCollectionSmallContainer(collection,options) {
	if (!options)
		var options = {featured:false}

  var storyContainer = $('<div/>').attr('id', 'collection-' + collection.id).attr('collectionId', collection.id)
            .addClass('story-container sm-container collection-container');

	storyContainer.hover(function() {
		$('#collection-' + collection.id + '.collection-container.sm-container').addClass('highlighted');
	} , function() {
		$('#collection-' + collection.id + '.collection-container.sm-container').removeClass('highlighted');
	});

	var storyContainerHeader = $('<div class="collection-container-header"/>').appendTo(storyContainer);
  //Story container body
  var storyContainerBody = $('<div class="collection-container-body"/>').appendTo(storyContainer)
                                                                  .click(function() {
                                                                    location = "/collection/" + collection.id;
                                                                  });
	var storyContainerFooter = $('<div class="collection-container-footer"/>').appendTo(storyContainer);

  //Thumbnail: article image or story image
  var thumbnailLink = "";
  if (collection.thumbnail)
    thumbnailLink = collection.thumbnail;

  if (thumbnailLink && thumbnailLink.length > 0) {
    storyContainer.css('background-image','url(' + thumbnailLink + ')')
  }

	//--- Header ---//

	$('<p>= story collection =</p>').appendTo(storyContainerHeader)

	// Collection name
  $('<p class="collection-name">' + collection.title + '</p>').appendTo(storyContainerBody);

  //--- FOOTER ---//

  // Stats: Likes and Saves
  var collectionStatsContainer = $('<div class="collection-stats-container"/>').appendTo(storyContainerFooter);
  $('<div class="collection-stats-stories">' + collection.noStories + ' stories</div>').appendTo(collectionStatsContainer);
  $('<div class="collection-stats-followers">' + collection.noFollowers + ' followers</div>').appendTo(collectionStatsContainer);

  return storyContainer;
}

/******************************************************************
	BUILD LARGE CONTAINER
******************************************************************/

function buildStoryLargeContainer(story,options) {
	if (!options) var options = {featured:false,editable:false,new:true}
  var storyContainer = $('<div class="story-container lg-container"></div>');

	if (story.id)
		storyContainer.attr('id', 'story-' + story.id).attr('storyId', story.id);
		if (story.location && story.location.showpin)
			storyContainer.hover(function() {
				indexStoriesMarkerList.get(story.id).addClass('highlighted')
			} , function() {
				indexStoriesMarkerList.get(story.id).removeClass('highlighted')
			});

  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
	//Scrollable content
	var scrollableContent = $('<div class="scrollable-content"/>').appendTo(storyContainer).innerHeight(storyContainersWrapperHeight - 110);
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(scrollableContent).css('min-height',storyContainersWrapperHeight - 110 + 'px');
	if (options.editable)
		storyContainerBody.addClass('edit');
  //Story container footer
  var storyContainerFooter = $('<div class="story-container-footer"/>').appendTo(scrollableContent);

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

	//Story Options Container
	var optionsBtnContainer = $('<div class="story-options-container pull-right dropdown"/>').appendTo(storyContainerHeader);
	if (!options.editable) {
		// LIKE BUTTON
	  optionsBtnContainer.append(buildLikeButton(story));
	  // SAVE BUTTON
	  optionsBtnContainer.append(buildSaveStoryButton(story));
		// Close/Gridview
		$('<button type="button" class="close-button btn btn-icon"><span class="glyph-icon icon-no-margins icon-30px flaticon-arrows"></button>').appendTo(optionsBtnContainer)
																																				.click(function() {
																																					closeStoryView();
																																				});
	} else if (options.editable) {
		optionsBtnContainer.addClass('editing-options')
		$('<button id="cancel-publish-button" type="button" onclick="closeStoryView()" class="btn btn-icon"><span class="glyph-icon icon-no-margins icon-30px flaticon-arrows"></button>').appendTo(optionsBtnContainer);
		buildAddPictureBtn().appendTo(optionsBtnContainer)
		$('<button id="story-add-link-button" type="button" class="btn btn-icon" data-toggle="tooltip" data-placement="bottom" title="Add an article from the internet."><span class="glyph-icon icon-no-margins icon-30px flaticon-internet"></button>').appendTo(optionsBtnContainer).tooltip({delay: { "show": 1500, "hide": 100 }})
																																																		.click(function() {
																																																			$('#story-insert-article').show();
																																																		});
		var postBtn = $('<button id="story-publish-button" type="button" class="btn btn-default">post</button>').appendTo(optionsBtnContainer)
		if (story.id)
			postBtn.html('save').click(function() {editStory()})
		else
			postBtn.click(function() {createStory()})
	}

  //Story location container
  var locationContainer = $('<div class="location-container"/>').appendTo(storyContainerHeader)
  var location = "";
	if (story.locationName && story.locationName.length > 0)
    location = story.locationName;
  $('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-15px flaticon-location"></div>').appendTo(locationContainer);
  var locationInput = $('<input readonly class="location" placeholder="Story location..." />').appendTo(locationContainer).val(location);

	if (options.editable) {
		locationInput.removeAttr('readonly').addClass('editable');
		if (story.location && story.location.showpin) {
			locationSetMode='pinpoint';
			$('#map-sight').show();
			$('#map-region').hide();
		} else if (story.location && !story.location.showpin) {
			locationSetMode='region';
			$('#map-sight').hide();
			$('#map-region').show();
			radius = story.location.radius / 1.404595 / Math.exp(-0.693*story.location.zoom);
			$('#map-region').css({width:2*radius, height: 2*radius, marginTop: -radius, marginLeft: -radius});
		} else if (!story.location) {
			locationSetMode='pinpoint';
			$('#map-sight').show();
			$('#map-region').hide();
		}

		$('<button id="switch-story-location-mode" type="button" onclick="swithStoryLocationSelectionMode()" class="btn btn-icon pull-right" data-toggle="tooltip" data-placement="bottom" title="Switch between pinpoint location or region."><span class="glyph-icon icon-no-margins icon-20px flaticon-location-2"></button>').appendTo(locationContainer).tooltip({delay: { "show": 1500, "hide": 100 }});
		$('<button id="set-story-location" type="button" onclick="setStoryLocation()" class="btn btn-default pull-right">set</button>').appendTo(locationContainer);
	}

  // Summary container
  var summaryContainer = $('<div class="summary-container collapsed"/>').appendTo(storyContainerBody);
  var summary = $('<div class="story-summary" placeholder="write your story"></div>').appendTo(summaryContainer);
	setStoryText(story.summary,summary);
  // $('<div class="summary-container-overlay"/>').appendTo(summaryContainer);

	if (options.editable) {
		summary.attr('contenteditable', 'true').addClass('editable');
		loadStoryTextBehaviours(summary);
	}

  //Thumbnail
	var imageContainer = $('<div class="image-container"/>').appendTo(storyContainerBody);
	if (options.editable) {
		$('<button id="remove-story-image" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>')
			.appendTo(imageContainer)
			.click(function() {
				$('.lg-container .image-container').hide();
				$('.lg-container .story-image').attr('src','');
				saveimagefile = null;
			});
	}
  var img = $('<img class="story-image">').appendTo(imageContainer);
	if (story.thumbnail && story.thumbnail.length > 0) {
		img.attr('src',story.thumbnail);
		imageContainer.css('display','block');
  }


	if (options.editable) {
		var insertArticleContainer = $('<div id="story-insert-article">').appendTo(storyContainerBody)
		var insertArticleInput = $('<input id="article-link" placeholder="article link">').appendTo(insertArticleContainer)
																															.keyup(function() {
																																txt = $(this).val();
																																webUrl = getUrlFromText(txt);
																																grabWebsiteMetadata(webUrl)
																															});
		$('<button id="close-article-link" type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>').appendTo(insertArticleContainer)
																															.click(function() {
																														    $('#story-insert-article').hide();
																														    $('#article-link').val('');
																														    article = null;
																														    removeArticleContainer();
																														  });
		if (story.articleLink) insertArticleInput.val(story.articleLink);
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
    },storyContainerBody,{colapsedescription:false});
  }

	// Story Collections
	if (!options.new && story.collections.length > 0 ) {
		var storyCollectionsContainer = $('<div class="story-collections-container"/>').appendTo(storyContainerFooter);
		$('<p>Story appears on collection:</p>').appendTo(storyCollectionsContainer);
		story.collections.forEach(function(collection) {
			var collectionItem = $('<div class="collection-item" ></div>').appendTo(storyCollectionsContainer);
			$('<div class="collection-thumbnail"></div>').appendTo(collectionItem).css('background-image','url(' + collection.imageUrl + ')');
			$('<a class="collection-name" href="/collection/' + collection.id + '">' + collection.name + '</a>').appendTo(collectionItem);
		});
	}

  return storyContainer;
}

function buildAddPictureBtn() {
	var addPictureBtn = $('<a id="story-add-picture-button" class="btn btn-icon"><span class="glyph-icon icon-no-margins icon-30px flaticon-art"></a>'),
	form = $('<form enctype="multipart/form-data" id="image-upload-form">').appendTo(addPictureBtn);
	input = $('<input id="f" name="profileImg[]" type="file" /></form>').appendTo(form)
		.change(function(ev) {
			saveimagefile = ev.target.files[0];
			var fileReader = new FileReader();

			if (saveimagefile) {
				$('.image-container').show();
			} else {
				$('.image-container').hide();
			}

			fileReader.onload = function(ev2) {
				console.dir(ev2);
				$('.story-image').attr('src', ev2.target.result);
			};

			fileReader.readAsDataURL(saveimagefile);
			fr = fileReader;
		});
	return addPictureBtn;
}

/******************************************************************
	BUILD OTHER LAYOUT PARTS AND HELPERS
******************************************************************/

function buildLikeButton(story) {
	var icon = '<span class="glyph-icon icon-no-margins icon-30px flaticon-favorite-1">'
  if (!user)
    return $('<button type="button" class="story-like-button btn btn-icon">' + icon + '</button>')
							.click(function() {
								displayAlertMessage('You need to login.', $('#content-wrapper'),1500);
							});
  var id = story.id;
  var likeButtonClass = (story.currentUserLikesStory) ? 'liked' : '';
  var likeButton = $('<button storyId= ' + id + ' class="story-like-button btn btn-icon ' + likeButtonClass + '" >' + icon + '  <span class="badge">' + story.noOfLikes + '</span></button>')
              .click(function() {
                var storyId = $(this).attr('storyId');
                likeStory(storyId, function(result) {
                  $('#story-' + storyId + ' .story-like-button span').html(result.noOfLikes);
									$('#story-' + storyId + ' .story-stats-likes').html(result.noOfLikes + ' likes');
                  if (result.currentUserLikesStory) {
                    $('#story-' + storyId + ' .story-like-button').addClass('liked')
                                                                  .html(icon + '  <span class="badge">' + result.noOfLikes + '</span>');
                  } else {
                    $('#story-' + storyId + ' .story-like-button').removeClass('liked')
                                                                  .html(icon + '  <span class="badge">' + result.noOfLikes + '</span>');
                  }
                });
              });
  return likeButton;
}

function buildSaveStoryButton(story) {
	var icon = '<span class="glyph-icon icon-no-margins icon-30px flaticon-favorite">'
  if (!user)
    return $('<a class="story-save-button btn btn-icon">' + icon + '</a>')
							.click(function() {
								displayAlertMessage('You need to login.', $('#content-wrapper'),1500);
							});
  var id = story.id;
  var saveStoryButtonClass = (story.currentUserSavedStory) ? 'saved' : '';
	var list = buildChooseCollectionDropdownList(story);
  var saveStoryButton = $('<a storyId= ' + id + ' role="button" data-toggle="popover" tabindex="0" class="story-save-button btn btn-icon ' + saveStoryButtonClass + '" >' + icon + '  <span class="badge">' + story.noOfSaves + '</span></a>')
							.popover({
								html: true,
								content: list,
								placement: 'bottom',
								animation: true,
								trigger: 'focus'
							})
              .click(function() {
								var storyId = $(this).attr('storyId');
                saveStory(storyId, function(result) {
                  $('#story-' + storyId + ' .story-save-button span').html(result.noOfSaves);
									var story = getStoryById(result.storyId,indexStories);
									story.noOfSaves = result.noOfSaves;
									$('#story-' + storyId + ' .story-stats-saves').html(story.noOfSaves + ' saves');
                  if (result.currentUserSavedStory) {
                    $('#story-' + storyId + ' .story-save-button').addClass('saved')
                                                                  .html(icon + '  <span class="badge">' + result.noOfSaves + '</span>');
                  } else {
                    $('#story-' + storyId + ' .story-save-button').removeClass('saved')
                                                                  .html(icon + '  <span class="badge">' + result.noOfSaves + '</span>');
                  }
                });
              });
    return saveStoryButton;
}

function addArticleContainer(art) {
  removeArticleContainer();
  buildArticleContainer(art,$('.lg-container .story-container-body'),{size:"large",autoplay:true})
}

function removeArticleContainer() {
  $('.article-container').remove();
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

/******************************************************************
	CREATE AND ADD TO COLLECTION DIALOGS
******************************************************************/

// Open collection creation modal
function openCreateCollectionView(story) {
  $('#create-collection-btn').click(function() {
    createStoryCollection(story);
    closeCreateCollectionView();
  });
  $('#create-story-collection-modal').modal('show');
}

function createStoryCollection(story) {
  var title = $('#story-collection-title-input').val();
  stud_createStoryCollection(title,
    function(collection) {
      if (story)
        addStoryToCollection(story.id,collection.id);
    },
    function() {displayAlertMessage('failed during collection creation')
  })
}

function addStoryToCollection(storyId,collectionId,onFinished) {
  stud_addStoryToStoryCollection(storyId,collectionId, function(s) {
		if (onFinished) onFinished(s);
	}, function() {displayAlertMessage('failed: Couldn\'t add story to collection')})
}

// close collection creation modal
function closeCreateCollectionView() {
  $('#create-story-collection-modal').modal('hide');
  $('#create-collection-btn').unbind();
  $('#story-collection-title-input').val('');
}

function openChooseCollectionView(story) {
  $('#choose-story-collection-modal .modal-body').empty();
  var storyCollectionListContainer = $('<div class="list-group"/>').appendTo($('#choose-story-collection-modal .modal-body'));
  user.domainUser.storyCollections.forEach(function(sc) {
    $('<a href="#" class="list-group-item">' + sc.name + '</a>').appendTo(storyCollectionListContainer)
                                                                .click(function() {
                                                                  addStoryToCollection(story.id,sc.id)
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

function buildChooseCollectionDropdownList(story) {
  var storyCollectionListContainer = $('<div class="list-group choose-story-collection-dropdown-list"/>');
	$('<p>Add story to a collection</p>').appendTo(storyCollectionListContainer);
  user.domainUser.storyCollections.forEach(function(sc) {
    $('<a href="#" class="list-group-item">' + sc.name + '</a>').appendTo(storyCollectionListContainer)
                                                                .click(function() {
																																	console.log('clicked');
                                                                  addStoryToCollection(story.id,sc.id)
                                                                  closeChooseCollectionView();
                                                                });
  });
  $('<a href="#" class="list-group-item active">+ new collection</a>').appendTo(storyCollectionListContainer)
                                                .click(function() {
                                                  openCreateCollectionView(story);
                                                  closeChooseCollectionView();
                                                });
	return storyCollectionListContainer;
}

function closeChooseCollectionView() {
  $('#choose-story-collection-modal').modal('hide');
  $('#choose-story-collection-modal .modal-body').empty();
}

function openAddUserCollectionView() {
	$('#user-email-input').val('');
	$('#add-user-collection-modal .label').hide();
	$('#add-user-collection-modal .list-group').empty();
	$('#add-user-collection-modal').modal('show');
}

function closeAddUserCollectionView() {
	$('#add-user-collection-modal').modal('hide');
}

function lookForUser() {
	var email = $('#user-email-input').val();
	stud_findUserByEmail(email, function(usr) {
	  var authorContainer = $('<a class="author-container list-group-item"/>').appendTo($('#add-user-collection-modal .list-group'));
		var avatarUrl = (usr.avatarUrl) ? usr.avatarUrl : defaultAvatarPic;
	  var authorThumbnail = $("<div class='story-author-thumbnail'></div>")
	              .css('background-image','url(' + avatarUrl + ')')
	              .appendTo(authorContainer)
	  authorContainer.append('<a class="story-author-name" href="/profile/' + usr.numberId + '">' + usr.fullName +  '</a>');
		authorContainer.click(function() {
			stud_addUserToCollection(collection.id,usr.numberId,function() {
				authorContainer.unbind();
				authorContainer.removeClass('list-group-item');
				$('#collection-authors #add-collection-authors-btn').before(authorContainer);
				closeAddUserCollectionView();
			},function() {})
		});
	}, function(e) {
		$('#add-user-collection-modal .label').show();
	});
}

/******************************************************************
	MAP
******************************************************************/

//--- initiateMap method ---//
function initiateMap() {

  markerIcon = {
    url: "/assets/images/marker_icon.png",
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(13, 13)
  };

	var mapOptions = {
		zoom : 2,
    scrollwheel: false,
		streetViewControl: false,
		streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
    scaleControl : false,
		zoomControl : false,
		zoomControlOptions : {style: google.maps.ZoomControlStyle.SMALL, position: google.maps.ControlPosition.RIGHT_CENTER},
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		mapTypeControl : false,
		mapTypeControlOptions : {style: google.maps.MapTypeControlStyle.DEFAULT, position: google.maps.ControlPosition.RIGHT_BOTTOM},
		center : defaultLocation
	}

	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);

	//--- Map Event Handlers ---//
	var listener = google.maps.event.addListener(map, 'tilesloaded', function() {
		google.maps.event.addListener(map, 'dragstart', function() {$('#map-region').removeClass('selected') });
		google.maps.event.addListener(map, 'dragend', function() {
			loadStories(null,function(stories) {
				drawLayout(stories);
			});
		});
		google.maps.event.removeListener(listener);
	});


  //-- SearchBox --//

  var input = document.getElementById('hero1-search-input');
  herosearchBox = new google.maps.places.SearchBox(input);
  // map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
  //Bias the SearchBox results towards current map's viewport.
  herosearchBox.setBounds(map.getBounds());
  map.addListener('bounds_changed', function() {
    herosearchBox.setBounds(map.getBounds());
  });
  herosearchBox.addListener('places_changed', function() {
		$('#search-input').val($('#hero-search-input').val());
    searchBoxGetPlaces(this);
		openStoryLayoutView();
  });

	//-- SearchBox hero 5 --//

  var input = document.getElementById('hero5-search-input');
  hero5searchBox = new google.maps.places.SearchBox(input);
  // map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
  //Bias the SearchBox results towards current map's viewport.
  hero5searchBox.setBounds(map.getBounds());
  map.addListener('bounds_changed', function() {
    hero5searchBox.setBounds(map.getBounds());
  });
  hero5searchBox.addListener('places_changed', function() {
		$('#search-input').val($('#hero-search-input').val());
    searchBoxGetPlaces(this);
		openStoryLayoutView();
  });

	//-- Map SearchBox --//

  var input = document.getElementById('search-input');
  mapsearchBox = new google.maps.places.SearchBox(input);
  // map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
  //Bias the SearchBox results towards current map's viewport.
  mapsearchBox.setBounds(map.getBounds());
  map.addListener('bounds_changed', function() {
    mapsearchBox.setBounds(map.getBounds());
  });
  mapsearchBox.addListener('places_changed', function() {
    searchBoxGetPlaces(this);
  });
}

function searchBoxGetPlaces(sb) {
	var places = sb.getPlaces();
	var bounds;
	if (!places || places.length == 0) {
		displayAlertMessage('No places found!')
		return;
	}
	if (places[0].geometry.viewport) {
		bounds = {
			north:places[0].geometry.viewport.R.j,
			east:places[0].geometry.viewport.j.R,
			south:places[0].geometry.viewport.R.R,
			west:places[0].geometry.viewport.j.j
		}
		// fitMapBoundsOnLayout(bounds);
	} else {
		bounds = {
			north:places[0].geometry.location.lat() + 0.2,
			east:places[0].geometry.location.lng() + 0.2,
			south:places[0].geometry.location.lat() - 0.2,
			west:places[0].geometry.location.lng() - 0.2
		}
	}

	loadStories(bounds,function(stories) {
		fitMapBoundsOnLayout(bounds);
		drawLayout(stories);
	});
}

function setStoryLocation() {
  locationName = $('.location.editable').val();

	var bounds = map.getBounds(),
	north = bounds.getNorthEast().lat(),
	east = bounds.getNorthEast().lng(),
	south = bounds.getSouthWest().lat(),
	west = bounds.getSouthWest().lng(),
	zoom = map.getZoom(),
	longitude = east - $('#map-viewport').innerWidth() / 2 * 1.404595 * Math.exp(-0.693*zoom),
	latitude = (north + south)/2;
	storylocation = {
		name: locationName,
    latitude:latitude,
    longitude:longitude,
		zoom: zoom
  }
	if (locationSetMode=='pinpoint') {
		storylocation.showpin = true;
		storylocation.radius = 0;
		var position = new google.maps.LatLng(latitude,longitude);
		if (storyLocationMarker)
	    storyLocationMarker.setPosition(position,position,true);
		else if (editingstory && indexStoriesMarkerList.get(editingstory.id))
			indexStoriesMarkerList.get(editingstory.id).setPosition(position,position,true);
		else
	  	storyLocationMarker = drawMarkerOnMap(position);
	} else if (locationSetMode=='region') {
		storylocation.showpin = false;
		storylocation.radius = $('#map-region').innerWidth() / 2 * 1.404595 * Math.exp(-0.693*zoom);
		if (storyLocationMarker)
	    storyLocationMarker.setMap(null);
		$('#map-region').addClass('selected');
		// storyLocationMarker = drawRegionOnMap(storylocation);
	}
}

function swithStoryLocationSelectionMode() {
	modes = ['pinpoint','region'];
	if(locationSetMode!='pinpoint') {
		locationSetMode='pinpoint';
		$('#switch-story-location-mode span').addClass('flaticon-location-2').removeClass('flaticon-location-1');
		$('#map-sight').show();
		$('#map-region').hide();
	} else {
		locationSetMode='region';
		$('#switch-story-location-mode span').addClass('flaticon-location-1').removeClass('flaticon-location-2');
		$('#map-sight').hide();
		$('#map-region, #map-region *').show();
	}
}

function centerMapOnLayout(position,map) {
	var bounds = map.getBounds(),
	north = bounds.getNorthEast().lat(),
	east = bounds.getNorthEast().lng(),
	south = bounds.getSouthWest().lat(),
	west = bounds.getSouthWest().lng(),
	zoom = map.getZoom();
	longitude = position.lng() - ( (east - west)/2 - $('#map-viewport').innerWidth() / 2 * 1.404595 * Math.exp(-0.693*zoom) ),
	latitude = position.lat(),
	center = new google.maps.LatLng(latitude,longitude);
  map.setCenter(center);
	return center;
}

function fitMapBoundsOnLayout(bounds) {
	var north = bounds.north,
	east = bounds.east,
	south = bounds.south,
	west = bounds.west;
	var width_coord = 1.3*(east - west),
	height_coord = 1.3*(north - south),
	width_pix = $('#map-viewport').innerWidth(),
	height_pix = $('#map-viewport').innerHeight();
	if (height_pix/width_pix < height_coord/width_coord)
		zoom = Math.floor(-1/0.693*Math.log(height_coord/(1.404595*height_pix)));
	else
		zoom = Math.floor(-1/0.693*Math.log(width_coord/(1.404595*width_pix)));
	zoom = (zoom >= 2) ? zoom : 2;
	var delta_coord = $('#map-canvas').innerWidth() * 1.404595 * Math.exp(-0.693*zoom);
	center = new google.maps.LatLng(0.5*(north+south), 0.5*(west+east) - (1 - (width_pix)/$('#map-canvas').innerWidth())*0.5*delta_coord, true);
	// var marker = new google.maps.Marker({
	// 	position : new google.maps.LatLng(0.5*(north+south), 0.5*(west+east)),
	// 	map : map,
	// 	draggable : false
	// });
	map.setZoom(zoom);
	map.panTo(center);
}


function getMapCenterOnLayout(map) {
	var bounds = map.getBounds(),
	north = bounds.getNorthEast().lat(),
	east = bounds.getNorthEast().lng(),
	south = bounds.getSouthWest().lat(),
	west = bounds.getSouthWest().lng(),
	zoom = map.getZoom();
	longitude = east - $('#map-viewport').innerWidth() / 2 * 1.404595 * Math.exp(-0.693*zoom),
	latitude = (north + south)/2,
	center = new google.maps.LatLng(latitude,longitude);
  map.setCenter(center);
	return center;
}

function zoomInMap() {
	var center = getMapCenterOnLayout(map),
	zoom = map.getZoom()
	if (zoom <= 20)
		map.setZoom(zoom+1)
	centerMapOnLayout(center,map);
	loadStories(null,function(stories) { drawLayout(stories);});
}

function zoomOutMap() {
	var center = getMapCenterOnLayout(map),
	zoom = map.getZoom()
	if (zoom > 3)
		map.setZoom(zoom-1)
	centerMapOnLayout(center,map);
	loadStories(null,function(stories) { drawLayout(stories);});
}

//--- fitMarkersOnView ---//
function fitMarkersOnView(markers,map) {
	//if (!story) return;
	var bounds = new google.maps.LatLngBounds();
	if (markers.length == 0) {
		return;
	}
	else if (markers.length == 1) {
		if (map)
			var sets = fitStoryOnView(markers[0].story,map)
		indexZoom = sets.zoom;
		indexCenter = sets.center;
	} else {
		for (var i = 0; i < markers.length; i++) {
			if (markers[i].story.location != null)
				bounds.extend( markers[i].getPosition() );
		}
		var north = bounds.getNorthEast().lat(),
		east = bounds.getNorthEast().lng(),
		south = bounds.getSouthWest().lat(),
		west = bounds.getSouthWest().lng();
		var width_coord = 1.3*(east - west),
		height_coord = 1.3*(north - south),
		width_pix = $('#map-viewport').innerWidth(),
		height_pix = $('#map-canvas').innerHeight();
		if (height_pix/width_pix < height_coord/width_coord)
			zoom = Math.floor(-1/0.693*Math.log(height_coord/(1.404595*height_pix)));
		else
			zoom = Math.floor(-1/0.693*Math.log(width_coord/(1.404595*width_pix)));
		indexZoom = (zoom >= 2) ? zoom : 2;
		var delta_coord = $('#map-canvas').innerWidth() * 1.404595 * Math.exp(-0.693*zoom);
		indexCenter = new google.maps.LatLng(0.5*(north+south), 0.5*(west+east) - (1 - ($('#map-canvas').innerWidth()-storiesGridListContainerWidth)/$('#map-canvas').innerWidth())*0.5*delta_coord, true);
		// var marker = new google.maps.Marker({
		// 	position : new google.maps.LatLng(0.5*(north+south), 0.5*(west+east)),
		// 	map : map,
		// 	draggable : false
		// });
		map.setZoom(indexZoom);
		map.panTo(indexCenter);
	}
}

//--- fitStoriesOnView ---//
function fitStoriesOnView(stories,map) {
	//if (!story) return;
	var bounds = new google.maps.LatLngBounds();
	if (stories.length == 0) {
		return;
	}
	else if (stories.length == 1) {
		if (map)
			var sets = fitStoryOnView(stories[0],map)
		indexZoom = sets.zoom;
		indexCenter = sets.center;
	} else {
		for (var i = 0; i < stories.length; i++) {
			if (stories[i].location != null) {
				var lat = stories[i].location.latitude,
				lng = stories[i].location.longitude;
				bounds.extend( new google.maps.LatLng(lat,lng) );
			}
		}
		var north = bounds.getNorthEast().lat(),
		east = bounds.getNorthEast().lng(),
		south = bounds.getSouthWest().lat(),
		west = bounds.getSouthWest().lng();
		var width_coord = 1.3*(east - west),
		height_coord = 1.3*(north - south),
		width_pix = $('#map-viewport').innerWidth(),
		height_pix = $('#map-canvas').innerHeight();
		if (height_pix/width_pix < height_coord/width_coord)
			zoom = Math.floor(-1/0.693*Math.log(height_coord/(1.404595*height_pix)));
		else
			zoom = Math.floor(-1/0.693*Math.log(width_coord/(1.404595*width_pix)));
		indexZoom = (zoom >= 2) ? zoom : 2;
		var delta_coord = $('#map-canvas').innerWidth() * 1.404595 * Math.exp(-0.693*zoom);
		indexCenter = new google.maps.LatLng(0.5*(north+south), 0.5*(west+east) - (1 - width_pix/$('#map-canvas').innerWidth())*0.5*delta_coord, true);
		// var marker = new google.maps.Marker({
		// 	position : new google.maps.LatLng(0.5*(north+south), 0.5*(west+east)),
		// 	map : map,
		// 	draggable : false
		// });
		map.setZoom(indexZoom);
		map.panTo(indexCenter);
	}
}

//--- fitStoryOnView ---//
function fitStoryOnView(story,map) {
	if (story.location != null) {
		var zoom = story.location.zoom,
		width_pix = $('#map-viewport').innerWidth(),
		delta_coord = $('#map-canvas').innerWidth() * 1.404595 * Math.exp(-0.693*zoom),
		center = new google.maps.LatLng(story.location.latitude, story.location.longitude - (1 - width_pix/$('#map-canvas').innerWidth())*0.5*delta_coord, true);
		map.setZoom(zoom);
		map.panTo(center);
		return {zoom:zoom, center:center}
	}
}

//--- drawPublishedStoryMarkersOnMap method ---//
function drawMarkersOnMap(stories,icon) {
	clearAllMarkersFromMap();
	if (stories.length == 0) return;
  markerList  = new Hashtable();

  var st_;
	for ( var i = 0; i < stories.length; i++) {
		st_ = stories[i];
		if (st_.location.showpin) {
			//custom marker
			var markerDiv = $('<div class="marker-div animated-marker"></div>'),
			position = new google.maps.LatLng(st_.location.latitude, st_.location.longitude, true),
			offset = new Object({x:0, y:0 }),
			marker = new SimpleMapOverlay(position,position,offset,markerDiv[0],map,false);
			marker.story = st_;
			marker.addListener('click', function() {
				drawStoryLargeLayout(this.story);
      });
			marker.addListener('mouseenter',function() {
				$('#story-' + this.story.id + '.story-container.sm-container').addClass('highlighted');
			});
			marker.addListener('mouseleave',function() {
				$('#story-' + this.story.id + '.story-container.sm-container').removeClass('highlighted');
			});
			markerList.put(st_.id,marker);
		}
	//fitStoryOnView(storyMarkerList);
	}
  return markerList;
}

function drawMarkerOnMap(position,story) {
	var markerDiv = $('<div class="marker-div animated-marker"></div>'),
	offset = new Object({x:0, y:0 }),
	marker = new SimpleMapOverlay(position,position,offset,markerDiv[0],map,false);
	marker.story = story;
	marker.addListener('click', function() {
    drawStoryLargeLayout(this.story);
  });
	marker.addListener('mouseenter',function() {
		$('#story-' + this.story.id + '.story-container.sm-container').addClass('highlighted');
	});
	marker.addListener('mouseleave',function() {
		$('#story-' + this.story.id + '.story-container.sm-container').removeClass('highlighted');
	});
  return marker;
}

function getBounds() {


	var bounds = {
		north: map.getBounds().getNorthEast().lat(),
		east: map.getBounds().getNorthEast().lng(),
		south: map.getBounds().getSouthWest().lat(),
	}
	var zoom = map.getZoom();
	bounds.west = bounds.east - $('#map-viewport').innerWidth() * 1.404595 * Math.exp(-0.693*zoom);

	return bounds;
}

function clearAllMarkersFromMap() {
	if (!indexStoriesMarkerList) return;
	var markerList = indexStoriesMarkerList.values();
	for (var i in markerList) {
		markerList[i].setMap(null);
	}
	indexStoriesMarkerList.clear()
}

/******************************************************************
	CREATE AND EDIT STORY
******************************************************************/

//--- createStory method ---//
function createStory() {

	if (!user) {
    displayAlertMessage('Failed to post. User not logged in.')
    return;
  }
  if (storylocation == null) {
    displayAlertMessage('Failed to post. You must select a location.')
    return;
  }

  $('#story-publish-button').text('Posting...').attr('disabled','disabled');

	story = newStoryObj(map);
	//set new story title
	story.setTitle("story_" + user.domainUser.numberId + "_" + new Date().getTime());
	//set location
	story.setLocation(storylocation);
	story.setLocationName(storylocation.name);
	//set summary
	story.setSummary(getStoryText($('.lg-container .story-summary')));
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

	story.setPublished(true);
  //save story on server
	stud_createStory(story.domainStory,function(st){
		//upload story pics
		if (saveimagefile) {
			uploadStoryImage(st.id,function(thumbnail) {
				st.thumbnail = thumbnail;
        postingFinished(st);
			},
      function() {
        postingError();
			});
		} else {
			//publish
      postingFinished(st);
		}
	},
  function() {
    postingError();
  });
}

function editStory() {

	if (!user) {
    displayAlertMessage('Failed to post. User not logged in.')
    return;
  }
  if (storylocation == null) {
    displayAlertMessage('Failed to post. You must select a location.')
    return;
  }

  $('#story-publish-button').text('Posting...').attr('disabled','disabled');

  var story_ = newStoryObj(map);
	//set new story title
	story_.setTitle(editingstory.title);
	//set location
	story_.setLocation(storylocation);
  story_.setLocationName(storylocation.name);
	//set summary
	story_.setSummary(getStoryText($('.lg-container .story-summary')));
  //setArticle
  if (article) {
		story_.setArticle(article.title,
						article.description,
						article.imageUrl,
						article.url,
            article.date,
            article.source,
            article.author)
	} else if (!article && editingstory.articleLink ) {
    story_.setArticle("","","","","","","");
  }

	story_.setPublished(true);

  //save story on server
	stud_createStory(story_.domainStory,function(st){
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

function editFinished(story) {
  $('#story-publish-button').text('Post').removeAttr('disabled');
  updateStoryFromIndexList(story);
  //if position changes the marker must be updated
	if (story.location.showpin) {
		indexStoriesMarkerList.get(story.id).story = story;
	} else {
		if (indexStoriesMarkerList.get(story.id)) {
			indexStoriesMarkerList.get(story.id).setMap(null);
			indexStoriesMarkerList.remove(story.id);
		}
	}
  drawLayout(indexStories);
	closeStoryView();
}

function postingFinished(story) {
  $('#story-publish-button').text('Post').removeAttr('disabled');
	indexStories.push(story);
	if (story.location.showpin) {
		var position = new google.maps.LatLng(story.location.latitude, story.location.longitude, true),
		marker = drawMarkerOnMap(position,story)
		indexStoriesMarkerList.put(story.id,marker)
	}
  drawLayout(indexStories);
	closeStoryView();
}

function postingError() {
  $('#story-publish-button').text('Post').removeAttr('disabled');
  displayAlertMessage('Posting Failed. Error while posting the story.')
}

/******************************************************************
 	DISPLAY HIGHLIGHTED STORIES
******************************************************************/

function loadHighlightedStories() {
	$('#featured-stories-container .story-container').remove();
	stud_getHighlightedItems(function(items) {
		items.forEach(function(item) {
			if (item.type == 0)
				var container = buildStorySmallContainer(item,{featured:true});
			else if (item.type == 1)
				var container = buildCollectionSmallContainer(item,{featured:true});
			$('#featured-stories-container').append(container)
																			.innerWidth(4* (200 + 14));
		});
	});
}

/******************************************************************
	SETTERS, GETTERS AND UPDATES
******************************************************************/

function updateStoryFromIndexList(story) {
  for (var i in indexStories) {
    if (indexStories[i].id == story.id) {
      indexStories[i] = story;
    }
  }
}

function updateMarkerPosition(story) {
	if (story.location == null) return;
	var position = new google.maps.LatLng(story.location.latitude, story.location.longitude, true),
	marker = indexStoriesMarkerList.get(story.id).setPosition(position,position,true)
  indexStoriesMarkerList.get(story.id).story = story;
}

function setLayoutDimensions(stories) {
	var storiesListContainer = $("#story-grid-layout");

  // Set layout
  var columnWidth = 200,
	paddingleft = 25,
	paddingright = 14,
  columnMargin = 14,
  availableWidth = $('#map-canvas').innerWidth(),
  requestedWidth = columnWidth + columnMargin;
	if (!stories || stories.length==0) {
		noColumns = 0;
		storiesListContainer.outerWidth(0);
		$('#map-viewport').innerWidth(contentwidth);
		return;
	}
	// noColumns = Math.floor(0.65*availableWidth/requestedWidth);

	if (stories.length < 5)
		noColumns = 1
	else if (stories.length < 10)
		noColumns = 2
	else if (stories.length < 20)
		noColumns = 3
	else if (stories.length >= 20)
		noColumns = 4


	storiesGridListContainerWidth = noColumns*(columnWidth + columnMargin) + paddingright + paddingleft;
	storiesListContainer.outerWidth(storiesGridListContainerWidth);
	if (isStoryViewOpen)
		$('#map-viewport').innerWidth(contentwidth-$("#story-large-layout").outerWidth());
	else
		$('#map-viewport').innerWidth(contentwidth-storiesGridListContainerWidth);

}

function updateLayoutDimensions() {
	contentheight = $(window).innerHeight() - $('nav.navbar').height();
	contentwidth = $('#content-wrapper').innerWidth();
	$('#content-wrapper').css({ height: contentheight });

	//----------------
	storyContainersWrapperHeight = contentheight - $('#story-containers-wrapper').css('margin-top').replace("px", "");
	storyContainersWrapperWidth = contentwidth - $('#story-containers-wrapper').css('margin-left').replace("px", "");

	$('#story-containers-wrapper').css({
		height: storyContainersWrapperHeight,
		width: storyContainersWrapperWidth
	});
	//Map Sight
	$('#map-viewport').css({height: contentheight});

	setLayoutDimensions(indexStories);
}

function sortStoriesByDate(stories) {
  if (!stories || stories.length==0)
		return;
	var storyIdList = [],
	sortedList = [],
	storypathsList = [];
	for (var i in stories) {
		storyIdList.push(stories[i].id);
	}

	// Descending order
	storyIdList.sort(function(id1,id2){return id2-id1});

	for (var i in storyIdList) {
		sortedList.push(getStoryById(storyIdList[i],stories));
	}

	indexStories = sortedList;
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

function getStoryById(storyId,list) {
	for (var i in list) {
    if (list[i].id == storyId)
      return list[i];
  }
}

function getNextStoryFromIndexStoriesList(id) {
	var story = getStoryById(id,indexStories),
  index = indexStories.indexOf(story);
  if (index > -1 && index < indexStories.length)
		return indexStories[index+1]
	else
		return false;
}

function getPreviousStoryFromIndexStoriesList(id) {
	var story = getStoryById(id,indexStories),
  index = indexStories.indexOf(story);
  if (index > 0)
		return indexStories[index-1]
	else
		return false;
}

function storyBelongsToCurrentUser(story) {
  if (user && user.domainUser.numberId == story.author.numberId)
    return true;
  else
    return false;
}

function removeMarkerFromStoryInList(story,list) {
  var marker = list.get(story.id);
  marker.setMap(null);
	delete marker;
  list.remove(story.id);
}

/******************************************************************
	HELPERS
******************************************************************/

function getHostFromUrl(url) {
	return url.split("//")[1].split("/")[0];
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

function loadStoryTextBehaviours(element) {
  var storyTextElem = element;
  element.attr('contenteditable', 'true')

  // elastic behaviour
  storyTextElem.elastic();

  //placeholder
  var placeholder = storyTextElem.attr('placeholder');

  if (element.hasClass('empty') || storyTextElem.html() == '' || storyTextElem.html()== '<br>') {
    storyTextElem.html('<span class="placeholder">' + placeholder + '</span>')
                  .addClass('empty')
  }

  //event listeners
  storyTextElem.focusin(function() {
                  if (element.hasClass('empty'))
                    element.html("").removeClass('empty');
                })
                .focusout(function() {
                  if (storyTextElem.html() == '' || storyTextElem.html()== '<br>')
                    storyTextElem.html('<span class="placeholder">' + placeholder + '</span>').addClass('empty');
                  });
}

function unloadStoryTextBehaviours(element) {
  element.unbind('focusin').unbind('focusout');
  element.attr('contenteditable', 'false')
  if (element.hasClass('empty')) {
    element[0].innerText = '';
    element.removeClass('empty');
  }
}

function setStoryText(text,element) {
  element.removeClass('empty');
  if (!text)
    return;
  if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    element[0].innerHTML = text.replace(/\n/g,'<br>');
  } else {
    element[0].innerText = text;
  }
}

function getStoryText(element) {
  if (element.hasClass('empty'))
    return "";
  //element.find('.placeholder')[0].remove();
  if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    return element[0].innerHTML.replace(/<br>/g,'\n')
                                    .replace(/&nbsp;/g,' ')
                                    // .replace(/[^\x00-\x7F]/g, "")
                                    // .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
  }
  return element[0].innerText
										// .replace(/[^\x00-\x7F]/g, "")
                    // .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
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

function getHostFromUrl(url) {
	return url.split("//")[1].split("/")[0];
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

function hasImageToDelete(st) {
  var imagesrc = $('.lg-container .story-image').attr('src');
  if (imagesrc == "" && (st.thumbnail != "" && st.thumbnail))
    return true;
  return false;
}

function displayAlertMessage(msg,container,delay) {
	$('.alert-message').remove();
	if (!container) {
		var container = $('#content-wrapper');
	}
	if (!delay) {
		var delay = 2000;
	}

	if (!container.css('position'))
		container.css('position','relative')

	var alertMessageContainer = $('<div class="alert-message"><p>' + msg + '</p></div>').appendTo(container);
	$('.alert-message').animate({opacity: 1}, 500,"easeOutQuart", function() {
		setTimeout(function () {
			$('.alert-message').animate({opacity: 0}, 500,"easeOutQuart");
		}, delay);
	});
}

/******************************************************************
	SERVER LINKS STUDS
******************************************************************/

function uploadStoryImage(storyId,onFinished) {
	url = '/story/'+storyId+'/uploadimage';
	var uploadImageForm = new FormData($('.lg-container #image-upload-form')[0]);
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

function deleteStory(storyId, success, error){
	$.ajax({
		url: "/story/" + storyId,
		type: "DELETE",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_readUserStories(success, error){
	$.ajax({
		url: "/listuserstories",
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readUserSavedStories(success, error){
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

function stud_findUserByEmail(email,success, error){
	$.ajax({
		url: "/user/search/" + email,
		type: "GET",
		dataType: "json",
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

function stud_followUser(numberId,unfollow,success) {
	$.ajax( {
		url: "/follow/user/" + numberId + "," + unfollow,
		type: 'PUT',
		dataType: "json",
		success: success
	});
}

function stud_readPublicStoriesWithinBounds(w, n, e, s, limit, success, error){
	$.ajax({
		url: "/storiesin/" + w + ", " + n + ", " + e + ", " + s,
		type: "GET",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_readLocationInfoNominatimOSM(locationName, success, error){
	$.ajax({
		url: "http://nominatim.openstreetmap.org/?format=json&q=" + encodeURIComponent(locationName) + "&limit=1",
		type: "GET",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_createStory(story, success, error){
	$.ajax({
		url: "/story",
		type: "POST",
		dataType: "json",
		data: JSON.stringify(story),
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_highlightItem(itemId,itemType,success) {
	$.ajax( {
		url: "/highlight/" + itemId + "," + itemType,
		type: 'GET',
		success: success
	});
}

function stud_getHighlightedItems(success) {
	$.ajax( {
		url: "/highlighted",
		type: 'GET',
		dataType: "json",
		contentType:"application/json",
		success: success
	});
}
