
/******************************************************************
	GLOBAL VARIABLES
******************************************************************/

var map;
var searchBox;

var article;
var saveimagefile = null;
var fr;

var defaultLocation = new google.maps.LatLng(37, -20);

var collection;
var collectionStories;
var collectionStoriesMarkerList;
var collectionStoryConnectionsList;
var collectionStoryPathsList;
var collectionCenter = defaultLocation;
var collectionZoom = 2;

var softArrow;
var connectStoryList = [];
var connectStoriesEnabled = false;
var cursor;

var user = null;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"

var markerIcon;

var colors = ['#FF702C','#2C80FF','#9A2CFF','#FF2CC8','#2C9EFF','#60A933'];
var defaultMarkerColor = '#FF2C2C';

var editingMode = false;
var editingstory;
var article;
var locationName;
var storylocation;
var storyLocationMarker;

var isgrabWebsiteMetadataBusy = false;

var animationBusy = false;

var locationSetMode = 'pinpoint';

var contentheight,
contentwidth,
storyContainersWrapperWidth,
storyContainersWrapperHeight,
storiesGridListContainerWidth,
noColumns;

var EMBED_MAX_WIDTH = 570,
EMBED_MAX_HEIGHT = 440

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
    readCollection();
	},
	function (){
		user = null
		$('#login-link, #stories-link').css('display' , 'block' );
    readCollection();
	});
}

function readCollection() {
  var collectionId = document.URL.split("/collection/")[1];
  stud_readCollection(collectionId,function(col) {
    collection = col;
		if (collection.published == 0) {
			if (!collectionBelongsToCurrentUser()) location = "/";
		}
    initiateMap();
    intializeEvents();
    initializeCollectionDetails();
    loadCollectionStories(col.id,function() {
      collectionStoriesMarkerList = drawCollectionMarkersOnMap(collectionStories,markerIcon);
			collectionStoryPathsList = sortCollectionStoryPaths(collectionStories);
			collectionStoryConnectionsList = drawAllConectionLines(collectionStoryPathsList,collectionStories);
			setLayoutDimensions(collectionStories);
			fitCollectionOnView(collectionStoriesMarkerList.values(),map);
			drawLayout(collectionStories);
    });
  }, function() {});
}

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initialize);

function intializeEvents() {
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

	//----------------
	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');

	//Map Sight
	$('#map-viewport').css({
		height: contentheight,
	});

	setLayoutDimensions();

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

  // COVER OPEN AND CLOSE
  $("#content-wrapper").bind("wheel", function(event) {
		if (animationBusy || $("#content-wrapper").hasClass('showing-map')) return;
		if (event.originalEvent.deltaY >= 1) {
			animationBusy = true;
			$('#collection-details-img-container').animate({top: 0 - contentheight}, 300,"easeOutQuart", function() {
				animationBusy = false;
				$('#story-grid-layout').scrollTop(0).animate({top: 0}, 300, "easeOutQuart");
				$("#collection-map-details-container").addClass('sensible');
				$("#content-wrapper").addClass('showing-map');
				$('#search-and-controls-bar').animate({opacity: 1}, 300, "easeOutQuart");
			});
		}
  });

	$("#collection-map-details-container").hover(function() {
		$('#collection-details-img-container').animate({top: 20 - contentheight}, 300, "easeOutBounce", function() {});
	}, function (e) {
		if (!$(e.relatedTarget).is('#collection-details-container'))
			$('#collection-details-img-container').animate({top: 0 - contentheight}, 200, function() {});
	});

	$('#collection-details-img-container, #collection-map-details-container').click(function() {
		$('#collection-details-img-container').animate({top: 0}, 300, "easeOutQuart", function() {
			closeStoryView(true);
			$('#story-grid-layout, #story-large-layout').css('top','100%');
			$("#content-wrapper").removeClass('showing-map');
			$('#search-and-controls-bar').animate({opacity: 0}, 300, "easeOutQuart");
		});
	});

  //--- Google Analytics track event ----//
	$(".ga-event-map-publish").click( function() {
		ga('send','event','map', 'publish') //Google Analytics track event
	});

	// RESIZE
	$(window).resize(function() {
		updateLayoutDimensions();
		$('.lg-container .story-container-body').css('min-height',storyContainersWrapperHeight - 110 + 'px');
	});

  // COLLECTION IMAGE FILE
	$('#collection-edit-picture').change(function(ev) {
		saveimagefile = ev.target.files[0];
		var fileReader = new FileReader();

		fileReader.onload = function(ev2) {
			console.dir(ev2);
      //$('#collection-details-container').css('background-image','url(' + ev2.target.result + ')');
      uploadCollectionImage(collection.id, function(url) {
        $('#collection-details-img-container').css('background-image','url(' + url + ')');
				$('#collection-thumbnail-container').css('background-image','url(' + url + ')').html('');
      });
		};

		fileReader.readAsDataURL(saveimagefile);
		// fr = fileReader;
	});

	// Next/previous story controllers
	$('#story-large-layout-controllers .lg-arrow-left').click(function() {
		var storyId = $('#story-large-layout-container .story-container').attr('storyId'),
		previousstory = getPreviousStoryFromCollectionStoriesList(storyId);
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
		nextstory = getNextStoryFromCollectionStoriesList(storyId);
		if (!nextstory) return;
		var largeStoryContainer = buildStoryLargeContainer(nextstory);
		$('#story-large-layout').animate({left: contentwidth}, 300, "easeOutQuart", function() {
			$('#story-large-layout').hide().css('left', -contentwidth + 'px').show();
			$('#story-large-layout-container').html(largeStoryContainer);
			$('#story-large-layout').animate({left: 0}, 300, "easeOutQuart");
			fitStoryOnView(nextstory,map);
		});
	});

	//--- initializeSoftArrow method ---//
	softArrow = new google.maps.Polyline({
		strokeColor : '#444444',
		strokeOpacity : 0.6,
		strokeWeight : 2
	});
	softArrow.setMap(map);
	//--- cancel transition creation
	// google.maps.event.addListener(softArrow, 'click', function() { finishConnectStories(); });

	// PRESS ESCAPE
	document.onkeydown = function(event) {
		if (event.keyCode == 27) {
			finishConnectStories();
		}
	}

  $('[data-toggle="tooltip"]').tooltip({delay: { "show": 1500, "hide": 100 }})

}

function  initializeCollectionDetails() {
  if (collection.imageUrl) {
		$('#collection-details-img-container').css('background-image','url(' + collection.imageUrl + ')');
		$('#collection-thumbnail-container').css('background-image','url(' + collection.imageUrl + ')').html('');
	}
  $('#collection-details-img-container').css({ height: $(window).innerHeight() - $('nav.navbar').height() });

  // Collection name and description
  $('#collection-name').val(collection.name);
	$('#collection-details-name').text(collection.name);
  setStoryText(collection.description,$('#collection-description'));

  //Authors
  var authorsContainer = $('#collection-authors');
  collection.authors.forEach(function(author) {
    var authorContainer = $('<div class="author-container"></div>');
    var url = (author.avatarUrl) ? author.avatarUrl : defaultAvatarPic;
    $('<div class="story-author-thumbnail"></div>').appendTo(authorContainer)
                                                    .css('background-image','url(' + url + ')');
    $('<a class="story-author-name" href="/profile/' + author.numberId + '">' + author.fullName +  '</a>').appendTo(authorContainer);
    authorContainer.appendTo(authorsContainer);
  })
  $('<button id="add-collection-authors-btn" class="btn btn-default" onclick="openAddUserCollectionView()">Add authors</button>').appendTo(authorsContainer);

  $('#collection-stat-stories #value').html(collection.noStories);
  $('#collection-stat-followers #value').html(collection.noFollowers);

	if (collection.published == 0) {
		$('#private-status-btn').addClass('btn-danger  active');
		$('#public-status-btn').removeClass('btn-danger active');
	} else {
		$('#private-status-btn').removeClass('btn-danger  active');
		$('#public-status-btn').addClass('btn-danger active');
	}

	if (collection.currentUserFollows) {
		$('#follow-collection-btn').addClass('following').text('Following');
	}

  if (collectionBelongsToCurrentUser()) {
    $('#editing-opt-buttons').show();
  } else {
    $('#follow-collection-btn').show();
  }
}

/******************************************************************
	DRAW AND CONTROL LAYOUTS
******************************************************************/

function drawLayout(stories) {
  drawStoryGridLayout(stories);
}

function drawStoryGridLayout(stories) {

  $('.story-container').remove();
	var storiesGridLayoutContainer = $("#story-grid-layout");

	if(!stories || stories.length == 0) {
		$('#no-stories-message').show();
		return;
	} else
		$('#no-stories-message').hide();

	var stories = sortStoriesByDate(stories);

  for ( var i = 1; i <= noColumns; i++) {
    $('<div id="column-' + i + '" class="layout-column"/>').appendTo(storiesGridLayoutContainer)
  }


  var columnCommuter;
  counter = 0;

  // Add remaining Story Containers
  // var storiesinbounds = getStoriesWithinMapBounds(stories);
  // var storiesSortedByDate = sortStoriesByDate(storiesinbounds);

  stories.forEach(function(story) {
    var storyContainer = buildStorySmallContainer(story);
    columnCommuter = (counter++ % noColumns) + 1;
    storyContainer.appendTo($('#column-' + columnCommuter));
  });
	storiesGridLayoutContainer.addClass('infocus')
}

function drawStoryLargeLayout(story,options) {
	var largeStoryContainer = buildStoryLargeContainer(story,options);
	$('#story-large-layout-container').html(largeStoryContainer);
	$('#map-viewport').innerWidth(contentwidth - $('#story-large-layout').outerWidth());
	$('#story-large-layout-controllers').show();
	//Zoom in on the story location
	fitStoryOnView(story,map);

	$('#story-grid-layout').animate({top: '100%'}, 300, "easeOutQuart");
	$('#story-large-layout').animate({top: 0}, 300, "easeOutQuart");
}

function openCreateStoryView() {
	var story = new Object();
	story.author = {fullName:user.getFullName(),avatarUrl:user.getAvatarUrl()}
	var largeStoryContainer = buildStoryLargeContainer(story,{editable:true});
	$('#story-large-layout').animate({top: '100%'}, 150, "easeOutQuart", function() {
		$('#story-large-layout-container').html(largeStoryContainer);
		$('#map-viewport').innerWidth(contentwidth - $('#story-large-layout').outerWidth());
		$('#story-large-layout-controllers').hide();
		$('#story-large-layout').animate({top: 0}, 150, "easeOutQuart");
	});
	$('#story-grid-layout').animate({top: '100%'}, 300, "easeOutQuart");
}

function openEditStoryView(story) {
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
	//Zoom in on the story location
	fitStoryOnView(story,map);
	$('#story-grid-layout').animate({top: '100%'}, 300, "easeOutQuart");
	$('#story-large-layout').animate({top: 0}, 300, "easeOutQuart");
}

function closeStoryView(keephidden) {
	$('#map-viewport').innerWidth(contentwidth - $('#story-grid-layout').outerWidth());
	if (!keephidden) $('#story-grid-layout').animate({top: 0}, 300, "easeOutQuart");
	$('#story-large-layout').animate({top: '100%'}, 300, "easeOutQuart");
	$('#story-large-layout-container').html('');
	$('#map-viewport > *').hide();
	$('#map-region').removeClass('selected');
	$('#story-large-layout-controllers').hide();
	$('.marker-div').removeClass('highlighted');

	map.panTo(collectionCenter);
	map.setZoom(collectionZoom);
	editingstory = null;
	article = null;
	locationName = null;
	storylocation = null;
	if (storyLocationMarker) {
		storyLocationMarker.setMap(null);
		storyLocationMarker = null;
	}
}

/******************************************************************
	BUILD SMALL CONTAINER
******************************************************************/

function buildStorySmallContainer(story) {
  var storyContainer = $('<div/>').attr('id', 'story-' + story.id).attr('storyId', story.id)
            .addClass('story-container sm-container');

	storyContainer.hover(function() {
		$('#story-' + story.id + '.story-container.sm-container').addClass('highlighted');
		if (story.location && story.location.showpin)
			collectionStoriesMarkerList.get(story.id).addClass('highlighted')
	} , function() {
		$('#story-' + story.id + '.story-container.sm-container').removeClass('highlighted');
		if (story.location && story.location.showpin)
			collectionStoriesMarkerList.get(story.id).removeClass('highlighted')
	});

	if (storypath = getPathOfStory(story)) {
		storyContainer.css('border', '3px solid ' + storypath.color);
		collectionStoriesMarkerList.get(story.id).setColor(storypath.color);
	} else if (story.location.showpin) {
		collectionStoriesMarkerList.get(story.id).setColor(defaultMarkerColor);
	}


  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(storyContainer)
                                                                  .click(function() {
                                                                    if (storyBelongsToCurrentUser(story) && editingMode)
                                                                      drawStoryLargeLayout(story);
                                                                    else
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
                                      if (storyBelongsToCurrentUser(story) && editingMode)
                                        drawStoryLargeLayout(story);
                                      else
                                        drawStoryLargeLayout(story);
                                    });
  var removeFromCollectionBtn = $('<li class="option-remove"><a href="#">Remove Story</a></li>').appendTo(optionsList)
                                            .click(function() {
                                              stud_removeStoryFromStoryCollection(story.id,collection.id, function(coll) {
                                                $('#collection-stat-stories #value').html(coll.noStories);
                                                removeStoryFromCollectionStoriesList(story);
                                              });
                                            });
	if (editingMode) removeFromCollectionBtn.css('display','block');

	var editStoryBtn = $('<li class="option-edit"><a href="#">Edit Story</a></li>').appendTo(optionsList)
                                            .click(function() {
																							openEditStoryView(story);
                                            });
	if (editingMode && storyBelongsToCurrentUser(story)) editStoryBtn.css('display','block');

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

  return storyContainer;
}

/******************************************************************
	BUILD LARGE CONTAINER
******************************************************************/

function buildStoryLargeContainer(story,options) {
  var storyContainer = $('<div class="story-container lg-container"></div>');

	if (story.id)
		storyContainer.attr('id', 'story-' + story.id).attr('storyId', story.id);
		if (story.location && story.location.showpin)
			storyContainer.hover(function() {
				collectionStoriesMarkerList.get(story.id).addClass('highlighted')
			} , function() {
				collectionStoriesMarkerList.get(story.id).removeClass('highlighted')
			});

  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(storyContainer).innerHeight(storyContainersWrapperHeight - 110)
	if (options && options.editable)
		storyContainerBody.addClass('edit');
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
  authorContainer.append('<a class="story-author-name" href="/profile/' + story.author.numberId + '">' + authorName +  '</a>');

	//Story Options Container
	var optionsBtnContainer = $('<div class="story-options-container pull-right dropdown"/>').appendTo(storyContainerHeader);
	if (!options || !options.editable) {
		// LIKE BUTTON
	  optionsBtnContainer.append(buildLikeButton(story));
	  // SAVE BUTTON
	  optionsBtnContainer.append(buildSaveStoryButton(story));
		// Close/Gridview
		$('<button type="button" class="close-button btn btn-icon"><span class="glyph-icon icon-no-margins icon-30px flaticon-arrows"></button>').appendTo(optionsBtnContainer)
																																				.click(function() {
																																					closeStoryView();
																																				});
	} else if (options && options.editable) {
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

	if (options && options.editable) {
		locationInput.removeAttr('readonly').addClass('editable');
		locationSetMode='pinpoint';
		$('#map-sight').show();
		$('#map-region').hide();
		$('<button id="switch-story-location-mode" type="button" onclick="swithStoryLocationSelectionMode()" class="btn btn-icon pull-right" data-toggle="tooltip" data-placement="bottom" title="Switch between pinpoint location or region."><span class="glyph-icon icon-no-margins icon-20px flaticon-location-2"></button>').appendTo(locationContainer).tooltip({delay: { "show": 1500, "hide": 100 }});
		$('<button id="set-story-location" type="button" onclick="setStoryLocation()" class="btn btn-default pull-right">set</button>').appendTo(locationContainer);
	}

  // Summary container
  var summaryContainer = $('<div class="summary-container collapsed"/>').appendTo(storyContainerBody);
  var summary = $('<div class="story-summary" placeholder="write your story"></div>').appendTo(summaryContainer);
	setStoryText(story.summary,summary);
  // $('<div class="summary-container-overlay"/>').appendTo(summaryContainer);

	if (options &&options.editable) {
		summary.attr('contenteditable', 'true').addClass('editable');
		loadStoryTextBehaviours(summary);
	}

  //Thumbnail
	var imageContainer = $('<div class="image-container"/>').appendTo(storyContainerBody);
	if (options && options.editable) {
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


	if (options && options.editable) {
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
									var story = getStoryById(result.storyId,collectionStories);
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
	} else if (getHostFromUrl(art.url) == "www.facebook.com") {
		buildFacebookVideoContainer(art.url,articleContainer,options);
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
                                              iframesize = EMBED_MAX_HEIGHT;
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
                                            iframeHeight = (iframeHeight>EMBED_MAX_HEIGHT) ? EMBED_MAX_HEIGHT : iframeHeight;
                                            iframeWidth = (iframeHeight>EMBED_MAX_HEIGHT) ? EMBED_MAX_HEIGHT * VIDEO_RATIO : iframeWidth;
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
                                            iframeHeight = (iframeHeight>EMBED_MAX_HEIGHT) ? EMBED_MAX_HEIGHT : iframeHeight;
                                            iframeWidth = (iframeHeight>EMBED_MAX_HEIGHT) ? EMBED_MAX_HEIGHT * VIDEO_RATIO : iframeWidth;
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
			var iframeWidth = EMBED_MAX_WIDTH;
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

function buildFacebookVideoContainer(link,addToContainer,options) {
	var VIDEO_RATIO = 16/9;
	if (options.size == "large") addToContainer.addClass('large-view');
	var width = EMBED_MAX_WIDTH;
	var height= width / VIDEO_RATIO;
	height = (height>EMBED_MAX_HEIGHT) ? EMBED_MAX_HEIGHT : height;
	width = (height>EMBED_MAX_HEIGHT) ? EMBED_MAX_HEIGHT * VIDEO_RATIO : width;
	fbvideoContainer = $('<div class="fb-video" data-width="'+ width +'" data-allowfullscreen="true"></div>')
												.appendTo(addToContainer)
												.innerWidth(width)
								 				.innerHeight(height)
												.attr('data-href', link )
								 				.show();
	window.fbAsyncInit();
}

/******************************************************************
	DRAW AND CONTROL CONNECTION LINES
******************************************************************/

function startConnectingStories() {
	connectStoriesEnabled = true;
	connectStoryList = [];
}

function clickedOnStory(story) {
	connectStoryList.push(story);
	if (connectStoryList.length == 2) {
		if (connectStoryList[0].nextStoryId > 0 || connectStoryList[1].previousStoryId > 0) {
			finishConnectStories();
			displayAlertMessage('You are trying to connect to a ending story the a path. Try inverting the direction of the connection.', $('#content-wrapper'));
			return;
		}
		connectStories(connectStoryList[0],connectStoryList[1],function() {
			updateCollectionPaths();
			drawLayout(collectionStories);
			finishConnectStories();
		});
	}
}

function drawConnectingline(story1,story2,connectionlist,color) {
	var position1 = new google.maps.LatLng(story1.location.latitude,story1.location.longitude),
	position2 = new google.maps.LatLng(story2.location.latitude,story2.location.longitude),
	connection = new google.maps.Polyline({
		strokeColor : color,
		strokeOpacity : 0.8,
		strokeWeight : 2,
		geodesic:true,
		path: [position1,position2],
	});
	connection.story1 = story1;
	connection.story2 = story2;
	connection.color = color;
	var deleteConnectionBtnDiv = $('<div class="delete-connection-btn glyph-icon icon-no-margins icon-8px flaticon-delete"></div>')[0];
	offset = new Object({x:0, y:0 })
	connection.deleteConnectionBtnDiv = new SimpleMapOverlay(null,null,offset,deleteConnectionBtnDiv,map,false);
	connection.deleteConnectionBtnDiv.addListener('mouseleave', function() {
		this.hide();
	});
	connection.deleteConnectionBtnDiv.addListener('click', function() {
		deleteStoryConnection(connection);
	});
	connection.addListener('mouseover', function() {
		this.setOptions({strokeOpacity : 1,strokeWeight : 4});
		collectionStoriesMarkerList.get(connection.story1.id).addClass('highlighted');
		collectionStoriesMarkerList.get(connection.story2.id).addClass('highlighted');
	});
	connection.addListener('mouseout', function() {
		this.setOptions({strokeOpacity : 0.8,strokeWeight : 2});
		collectionStoriesMarkerList.get(connection.story1.id).removeClass('highlighted');
		collectionStoriesMarkerList.get(connection.story2.id).removeClass('highlighted');
	});
	connection.addListener('click', function(cursor) {
		if (editingMode) this.deleteConnectionBtnDiv.setPosition(cursor.latLng,cursor.latLng,true)
	});
	connection.setMap(map);
	connectionlist.put(story1.id,connection);
	return connection;
}

function deleteStoryConnection(connection) {
	disconnectStories(connection.story1,connection.story2,function() {
		updateCollectionPaths();
		drawLayout(collectionStories);
		finishConnectStories();
	});
}

function connectStories(st1,st2,onFinished) {
	stud_connectStories(collection.id,st1.id,st2.id,function() {
		if (onFinished) {
			st1.nextStoryId = st2.id;
			st2.previousStoryId = st1.id;
			onFinished();
		}
	})
}

function disconnectStories(st1,st2,onFinished) {
	stud_disconnectStories(collection.id,st1.id,st2.id,function() {
		if (onFinished) {
			st1.nextStoryId = -1;
			st2.previousStoryId = -1;
			onFinished();
		}
	})
}

function finishConnectStories() {
	connectStoriesEnabled = false;
	connectStoryList = [];
	softArrow.setPath([]);
}

//--- updateSoftArrow method ---//
function updateSoftArrow(cursor) {
	if (connectStoriesEnabled && connectStoryList.length > 0) {
		var storyPath = new google.maps.MVCArray();
		connectStoryList.forEach(function(story) { storyPath.push(new google.maps.LatLng(story.location.latitude,story.location.longitude)) });
		storyPath.push(cursor.latLng)
		softArrow.setPath( storyPath );
	}
}

/******************************************************************
	COLLECTION CONTROLS
******************************************************************/

function publishCollection() {
	if (collection.published == 1) return;
  collection.published = 1;
  $('#private-status-btn').removeClass('btn-danger active');
  $('#public-status-btn').addClass('btn-danger active');
	stud_publishCollection(collection.id,1,function() {
		displayAlertMessage('Story was published successfully!');
	}, function(error) {
		console.log(error);;
	});
}

function unPublishCollection() {
	if (collection.published == 0) return;
  collection.published = false;
  $('#private-status-btn').addClass('btn-danger active');
  $('#public-status-btn').removeClass('btn-danger active');
	stud_publishCollection(collection.id,0,function() {
		displayAlertMessage('Story was unpublished successfully!');
	});
}

function enableEditingMode() {
  editingMode = true;

  $('#editing-mode-off-btn').removeClass('btn-danger active');
  $('#editing-mode-on-btn').addClass('btn-danger active');
  $('#add-collection-authors-btn').show();
  $('#collection-name').removeAttr('readonly');
  $('#collection-description').attr('contenteditable', 'true');
	$('#collection-edit-picture-btn').addClass('enabled');
	$('#create-story, #connect-stories').show();
	loadStoryTextBehaviours($('#collection-description'));

  $('.story-container .option-remove').show();
	enableStoryEditingMode();

  //Update events
  // COLLECTION NAME and DESCRIPTION UPDDATE
  $('#collection-name, #collection-description').focusout(function() {
    if (editingMode && collectionBelongsToCurrentUser()) {
      var name = $('#collection-name').val();
			$('#collection-details-name').text(name);
      var description = getStoryText($('#collection-description'));
      if (name != collection.name || description != collection.description) {
        collection.name = name;
        collection.description = description;
        stud_updateStoryCollection(collection,function() {},function() {displayAlertMessage('failed collection update')});
      }
    }
  });
}

function enableStoryEditingMode() {
	collectionStories.forEach(function(st) {
		if (storyBelongsToCurrentUser(st))
			$('.story-container[storyId=' + st.id + '] .option-edit').show();
	})
}

function disableEditingMode() {
  editingMode = false;
  $('#editing-mode-on-btn').removeClass('btn-danger active');
  $('#editing-mode-off-btn').addClass('btn-danger active');
	$('.story-container .option-remove').hide();
	$('.story-container .option-edit').hide();
  $('#collection-name').attr('readonly','readonly');
  unloadStoryTextBehaviours($('#collection-description'));
  $('#collection-name, #collection-description').unbind();
  $('#add-collection-authors-btn').hide();
	$('#collection-edit-picture-btn').removeClass('enabled');
	$('#create-story, #connect-stories').hide();
}

//--- loadUserStories method ---//
function loadCollectionStories(collectionId,onFinished) {
  if (!user) {
    stud_readPublicCollectionStories(collectionId,function(s) {
      collectionStories = s;
      if (onFinished)
        onFinished();
    });
  } else {
    stud_readCollectionStories(collectionId,function(s) {
      collectionStories = s;
      if (onFinished)
        onFinished();
    });
  }
}

function followCollection() {
	if (!user)
		displayAlertMessage('You need to login',$('#content-wrapper'),1500);
	if (collection.currentUserFollows)
		stud_followCollection(collection.id,true,function() {
			collection.currentUserFollows = false;
			$('#collection-stat-followers #value').html(--collection.noFollowers)
			$('#follow-collection-btn').text('Follow').removeClass('following')
		});
	else
		stud_followCollection(collection.id,false,function() {
			collection.currentUserFollows = true;
			$('#collection-stat-followers #value').html(++collection.noFollowers);
			$('#follow-collection-btn').text('Following').addClass('following');
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
  var storyCollectionListContainer = $('<div class="list-group ga-event-index-addcollection"/>').appendTo($('#choose-story-collection-modal .modal-body'));
  user.domainUser.storyCollections.forEach(function(sc) {
    $('<a href="#" class="list-group-item">' + sc.name + '</a>').appendTo(storyCollectionListContainer)
                                                                .click(function() {
                                                                  addStoryToCollection(story.id,sc.id)
                                                                  closeChooseCollectionView();
                                                                });
  });
  $('<a href="#" class="list-group-item active ga-event-collection-addcollection">+ new collection</a>').appendTo(storyCollectionListContainer)
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
		$('#add-user-collection-modal .label').hide();
		$('#add-user-collection-modal .list-group').empty();
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
		// google.maps.event.addListener(map, 'zoom_changed', drawLayout);
		google.maps.event.addListener(map, 'mousemove', function(cursor) {updateSoftArrow(cursor)});
		google.maps.event.removeListener(listener);
	});


  //-- SearchBox --//
  var input = document.getElementById('search-input');
  searchBox = new google.maps.places.SearchBox(input);
  // map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
  //Bias the SearchBox results towards current map's viewport.
  searchBox.setBounds(map.getBounds());
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });
  searchBox.addListener('places_changed', function() {
    searchBoxGetPlaces();
  });
}

function searchBoxGetPlaces() {
	var places = searchBox.getPlaces();
	if (!places || places.length == 0) {
		displayAlertMessage('No places found!')
		return;
	}
	if (places[0].geometry.viewport.R) {
		var bounds = {
			north:places[0].geometry.viewport.R.R,
			east:places[0].geometry.viewport.j.R,
			south:places[0].geometry.viewport.R.j,
			west:places[0].geometry.viewport.j.j
		}
		fitMapBoundsOnLayout(bounds);
	} else {
		map.setZoom(8);
		centerMapOnLayout(places[0].geometry.location,map);
	}
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
		else if (editingstory && collectionStoriesMarkerList.get(editingstory.id))
			collectionStoriesMarkerList.get(editingstory.id).setPosition(position,position,true);
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
}

function zoomOutMap() {
	var center = getMapCenterOnLayout(map),
	zoom = map.getZoom()
	if (zoom > 3)
		map.setZoom(zoom-1)
	centerMapOnLayout(center,map);
}

//--- fitCollectionOnView ---//
function fitCollectionOnView(markers,map) {
	//if (!story) return;
	var bounds = new google.maps.LatLngBounds();
	if (markers.length == 0) {
		return;
	}
	else if (markers.length == 1) {
		if (map)
			var sets = fitStoryOnView(markers[0].story,map)
		collectionZoom = sets.zoom;
		collectionCenter = sets.center;
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
		collectionZoom = (zoom >= 2) ? zoom : 2;
		var delta_coord = $('#map-canvas').innerWidth() * 1.404595 * Math.exp(-0.693*zoom);
		collectionCenter = new google.maps.LatLng(0.5*(north+south), 0.5*(west+east) - (1 - ($('#map-canvas').innerWidth()-storiesGridListContainerWidth)/$('#map-canvas').innerWidth())*0.5*delta_coord, true);
		// var marker = new google.maps.Marker({
		// 	position : new google.maps.LatLng(0.5*(north+south), 0.5*(west+east)),
		// 	map : map,
		// 	draggable : false
		// });
		map.setZoom(collectionZoom);
		map.panTo(collectionCenter);
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
function drawCollectionMarkersOnMap(stories,icon) {
	markerList  = new Hashtable();
	if (stories.length == 0) return markerList;

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
        if (connectStoriesEnabled) {
					clickedOnStory(this.story);
				} else {
					drawStoryLargeLayout(this.story);
				}
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
    if (connectStoriesEnabled) {
			clickedOnStory(this.story);
		} else {
			drawStoryLargeLayout(this.story);
		}
  });
	marker.addListener('mouseenter',function() {
		$('#story-' + this.story.id + '.story-container.sm-container').addClass('highlighted');
	});
	marker.addListener('mouseleave',function() {
		$('#story-' + this.story.id + '.story-container.sm-container').removeClass('highlighted');
	});
  return marker;
}

function drawAllConectionLines(storypathsList,stories) {
	var lineList  = new Hashtable();
	for (var i in storypathsList) {
		var storiesinpath = storypathsList[i].path,
		color = colors[i % colors.length];
		storypathsList[i].color = color;
		for (var j = 0; j < storiesinpath.length - 1; j++) {
			var connection = drawConnectingline(getStoryById(storiesinpath[j],stories),getStoryById(storiesinpath[j+1],stories),lineList,color);
		}
	}
	return lineList;
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
	//set labels
	story.setLabels(getStoryTextLabels($('.lg-container .story-summary')[0]));
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
	if (collection.published == 0)
		story.setPublished(false);
	else
		story.setPublished(true);
  //save story on server
	stud_createStoryOnCollection(collection.id,story.domainStory,function(st){
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
	//set labels
	story_.setLabels(getStoryTextLabels($('.lg-container .story-summary')[0]));
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

  //save story on server
	stud_createStoryOnCollection(collection.id,story_.domainStory,function(st){
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
  updateStoryFromCollectionList(story);
	updateCollectionPaths();
  //if position changes the marker must be repositioned
  // updateMarkerPosition(story);
  drawLayout(collectionStories);
	closeStoryView();
}

function postingFinished(story) {
  $('#story-publish-button').text('Post').removeAttr('disabled');
	$('#collection-stat-stories #value').html(++collection.noStories);
	collectionStories.push(story);
	if (story.location.showpin) {
		var position = new google.maps.LatLng(story.location.latitude, story.location.longitude, true),
		marker = drawMarkerOnMap(position,story)
		collectionStoriesMarkerList.put(story.id,marker)
	}
	updateCollectionPaths();
  drawLayout(collectionStories);
	closeStoryView();
}

function postingError() {
  $('#story-publish-button').text('Post').removeAttr('disabled');
  displayAlertMessage('Posting Failed. Error while posting the story.')
}

/******************************************************************
	SETTERS, GETTERS AND UPDATES
******************************************************************/

function updateStoryFromCollectionList(story) {
  for (var i in collectionStories) {
    if (collectionStories[i].id == story.id) {
      collectionStories[i] = story;
    }
  }
}

function updateCollectionPaths() {
	collectionStoryConnectionsList.values().forEach(function(connection) {
		connection.setMap(null);
	});
	collectionStoryConnectionsList.clear();
	collectionStoryPathsList = sortCollectionStoryPaths(collectionStories);
	collectionStoryConnectionsList = drawAllConectionLines(collectionStoryPathsList,collectionStories);
}

function updateMarkerPosition(story) {
	if (story.location == null) return;
	var position = new google.maps.LatLng(story.location.latitude, story.location.longitude, true),
	marker = collectionStoriesMarkerList.get(story.id).setPosition(position,position,true)
  collectionStoriesMarkerList.get(story.id).story = story;
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

	setLayoutDimensions(collectionStories);
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

	for (var i in stories) {
		if (stories[i].previousStoryId <= 0 && stories[i].nextStoryId > 0) {
			var storypath = [stories[i].id],
			nextStoryId = stories[i].nextStoryId;
			while (nextStoryId > 0) {
				storypath.push(nextStoryId);
				storyIdList.splice(storyIdList.indexOf(nextStoryId),1);
				nextStoryId = getStoryById(nextStoryId,stories).nextStoryId;
			}
			storypathsList.push(storypath);
		}
	}

	// Descending order
	storyIdList.sort(function(id1,id2){return id2-id1});

	for (var i in storypathsList) {
		var initialstoryId = storypathsList[i][0],
		index = storyIdList.indexOf(initialstoryId);
		for ( var j = 1; j < storypathsList[i].length; j++) {
			storyIdList.splice(++index,0,storypathsList[i][j]);
		}
	}

	for (var i in storyIdList) {
		sortedList.push(getStoryById(storyIdList[i],stories));
	}

	collectionStories = sortedList;
	return sortedList;
}

function sortCollectionStoryPaths(stories) {
	if (!stories || stories.length==0)
		return [];
	var storypathsList = [];
	for (var i in stories) {
		if (stories[i].previousStoryId <= 0 && stories[i].nextStoryId > 0) {
			var path = [stories[i].id],
			nextStoryId = stories[i].nextStoryId;
			while (nextStoryId > 0) {
				path.push(nextStoryId);
				nextStoryId = getStoryById(nextStoryId,stories).nextStoryId;
			}
			var storypath = new Object();
			storypath.path = path;
			storypathsList.push(storypath);
		}
	}
	return storypathsList;
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

function getPathOfStory(story) {
	for (var i in collectionStoryPathsList) {
		if (collectionStoryPathsList[i].path.indexOf(story.id) > -1)
			return collectionStoryPathsList[i];
	}
	return false;
}

function getNextStoryFromCollectionStoriesList(id) {
	var story = getStoryById(id,collectionStories),
  index = collectionStories.indexOf(story);
  if (index > -1 && index < collectionStories.length)
		return collectionStories[index+1]
	else
		return false;
}

function getPreviousStoryFromCollectionStoriesList(id) {
	var story = getStoryById(id,collectionStories),
  index = collectionStories.indexOf(story);
  if (index > 0)
		return collectionStories[index-1]
	else
		return false;
}

function storyBelongsToCurrentUser(story) {
  if (user && user.domainUser.numberId == story.author.numberId)
    return true;
  else
    return false;
}

function collectionBelongsToCurrentUser() {
  if (!user)
    return false;
  for (var i in collection.authors) {
    if (collection.authors[i].numberId == user.domainUser.numberId)
      return true;
  }
	return false;
}

function removeMarkerFromStoryInList(story,list) {
  var marker = list.get(story.id);
  marker.setMap(null);
	delete marker;
  list.remove(story.id);
}

function removeConnectionsFromStoryInList(story,list) {
  var connection = list.get(story.id) || list.get(story.previousStoryId);
	if (!connection) return;
	if (story.nextStoryId > 0) {
		getStoryById(story.nextStoryId,collectionStories).previousStoryId = -1;
	}
	if (story.previousStoryId > 0) {
		getStoryById(story.previousStoryId,collectionStories).nextStoryId = -1;
	}
	connection.setMap(null);
	delete connection;
	list.remove(story.id);
}

function removeStoryFromCollectionStoriesList(story) {
  index = collectionStories.indexOf(story);
  if (index > -1) {
    collectionStories.splice(index,1);
  }
  //remove marker
  removeMarkerFromStoryInList(story,collectionStoriesMarkerList);
	removeConnectionsFromStoryInList(story,collectionStoryConnectionsList)
	updateCollectionPaths();
	drawLayout(collectionStories);
	delete story;
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
  var storyTextElem = element,
	caretPos;
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
                })
								.keyup(function(e) {
									var _this = $(this)[0];
									caretPos = getCaretPosition(_this);
									console.log(caretPos.nodeIndex + ',' + caretPos.offset);
									var innerHTML = '';
									for (var i in _this.childNodes) {
										if (_this.childNodes[i].nodeName == "#text") {
											var textnode = _this.childNodes[i].data.replace(/(^|\s)([#][a-z\d-]+)/ig, "$1<span class='hash-tag'>$2</span>")
											innerHTML = innerHTML + textnode;
											if (textnode != _this.childNodes[i].data) {
												caretPos.nodeIndex = caretPos.nodeIndex + 2;
												caretPos.offset = 0;
											}
										} else if (_this.childNodes[i].nodeName == "SPAN") {
											var textnode = _this.childNodes[i].innerHTML
											if (textnode.indexOf('&nbsp;') > -1) {
												innerHTML = innerHTML + "<span class='hash-tag'>" + textnode.replace('&nbsp;','') + "</span>&nbsp;";
												caretPos.nodeIndex=caretPos.nodeIndex+2;
												caretPos.offset = 0;
											} else if (textnode.indexOf(' ') > -1) {
												innerHTML = innerHTML + "<span class='hash-tag'>" + textnode.split(' ',2)[0] + "</span> " + textnode.split(' ',2)[1] ;
												caretPos.nodeIndex++;
												caretPos.offset = 0;
											} else if (textnode.indexOf('#') != 0) {
												innerHTML = innerHTML + textnode;
												caretPos.nodeIndex++;
												caretPos.offset = 0;
											} else {
												innerHTML = innerHTML + "<span class='hash-tag'>" + textnode + "</span>";
											}
										} else if (_this.childNodes[i].nodeName == "BR") {
											innerHTML = innerHTML + '<br>';
										} else if (_this.childNodes[i].nodeName == "DIV") {
											var textnode = _this.childNodes[i].innerHTML.replace(/<font color="#\w+"><br><\/font>/ig,'<br>')
																																	.replace('<span class="hash-tag">'," ").replace('</span>'," ")
																																	.replace(/(^|\s)([#][a-z\d-]+)/ig, "$1<span class='hash-tag'>$2</span>");
											if (_this.childNodes[i].previousSibling && _this.childNodes[i].previousSibling.nodeName != "BR" && _this.childNodes[i].previousSibling.nodeName != "DIV")
												innerHTML = innerHTML + '<br>' + textnode;
											else
												innerHTML = innerHTML + textnode;
										}
									}
									_this.innerHTML = innerHTML;
									var currentRange = setCaretToPos(caretPos,_this)
									_this.focus();

									if (currentRange.startContainer.parentNode.nodeName == "SPAN") {
										var tagname = currentRange.startContainer.parentNode.innerText.replace('#','');
										stud_findTagsStaringWith(tagname, function(result) {
											$('.tag-list').remove();
											if (result.length == 0) return;
											var bounding = currentRange.startContainer.parentNode.getBoundingClientRect();
											var taglist = $('<ul class="tag-list"/>').appendTo($('.lg-container .story-container-body'))
																								.css({
																									top:bounding.top + bounding.height - $(window).innerHeight() + storyContainersWrapperHeight,
																									left:bounding.left + 8
																								});
											for (var r in result) {
												$('<li class="tag-item" value="' + result[r] + '" >' + result[r] + '</li>').appendTo(taglist)
													.click(function() {
														currentRange.startContainer.parentNode.innerText = '#' + $(this).attr("value");
														$('.tag-list').remove();
													});
											}
										});
									} else {
										$('.tag-list').remove();
									}
                });
}

function getCaretPosition(element) {
  var caretOffset = 0,
	nodeIndex = 0;

  if (window.getSelection) {
    var selection = window.getSelection(),
    range = selection.getRangeAt(0),
		caretNode = selection.anchorNode;
    caretOffset = range.endOffset;
		if (caretNode.parentNode.nodeName == "DIV" && caretNode.parentNode != element && caretNode != element) {
			var child = caretNode.parentNode;
			nodeIndex++;
		} else if (caretNode.nodeName == "DIV" && caretNode != element) {
			var child = caretNode;
			nodeIndex++;
		} else if (caretNode == element) {
			return {offset:0,nodeIndex:selection.anchorOffset}
		} else if (caretNode.parentNode.nodeName == "SPAN" && caretNode.parentNode.parentNode != element) {
			var child = caretNode.parentNode.parentNode;
			nodeIndex++;
			caretOffset = 0;
		} else if (caretNode.parentNode.nodeName == "SPAN") {
			var child = caretNode.parentNode;
			// if (caretOffset == caretNode.length) {
			// 	nodeIndex++;
			// 	caretOffset = 0;
			// }
		} else {
			var child = caretNode;
		}
		while( (child = child.previousSibling) != null )
		  nodeIndex++;
	}

  return {offset:caretOffset,nodeIndex:nodeIndex}
}

function setCaretToPos(pos,element) {
	if (window.getSelection) {
    var selection = window.getSelection()
    range = document.createRange();
		if (element.childNodes.length == 0)
    	range.setStart(element,0);
		else if (pos.nodeIndex >= element.childNodes.length)
    	range.setStartAfter(element.childNodes[element.childNodes.length-1]);
		else if (element.childNodes[pos.nodeIndex].nodeName == "SPAN")
			range.setStart(element.childNodes[pos.nodeIndex].firstChild,pos.offset);
		else
			range.setStart(element.childNodes[pos.nodeIndex],pos.offset);
		range.collapse(true);
		selection.removeAllRanges();
		selection.addRange(range);
		return range;
	}
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
    element[0].innerHTML = text.replace(/\n/g,'<br>').replace(/(^|\s)([#][a-z\d-]+)/ig, "$1<span class='hash-tag'>$2</span>");;
  } else {
    element[0].innerHTML = text.replace(/(^|\s)([#][a-z\d-]+)/ig, "$1<span class='hash-tag'>$2</span>");;
  }
}

function getStoryText(element) {
  if (element.hasClass('empty'))
    return "";
  //element.find('.placeholder')[0].remove();
  if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    return element[0].innerHTML.replace('<span class="hash-tag">'," ").replace('</span>'," ")
															 .replace(/<br>/g,'\n')
                               .replace(/&nbsp;/g,' ')

  }
  return element[0].innerText.replace('<span class="hash-tag">'," ").replace('</span>'," ")
}

function getStoryTextLabels(element) {
	var labels = [];
	for (var i in element.childNodes) {
		if (element.childNodes[i].className == "hash-tag" )
			labels.push(element.childNodes[i].innerText.replace('#',""));
	}
	return labels;
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

function uploadCollectionImage(collectionId,onFinished) {
	url = '/collection/'+collectionId+'/uploadimage';
	var uploadImageForm = new FormData($('#collection-details-container #image-upload-form')[0]);
	$.ajax( {
	  url: url,
	  type: 'POST',
	  data:  uploadImageForm,
	  processData: false,
	  contentType: false,
	  success: onFinished
	} );
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

function stud_publishCollection(collectionId, publish, success, error){
	$.ajax({
		url: "/collection/" + collectionId + "/publish/" + publish,
		type: "PUT",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_updateStoryCollection(collection, success, error){
	$.ajax({
		url: "/collection/" + collection.id,
		type: "PUT",
		dataType: "json",
		data: JSON.stringify(collection),
		contentType:"application/json",
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

function stud_removeStoryFromStoryCollection(storyId,collectionId, success, error){
	$.ajax({
		url: "/collection/" + collectionId + "/story/" + storyId,
		type: "PUT",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_readCollection(collectionId,success, error){
	$.ajax({
		url: "/collection/details/" + collectionId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readCollectionStories(collectionId,success, error){
	$.ajax({
		url: "/collection/stories/" + collectionId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_readPublicCollectionStories(collectionId,success, error){
	$.ajax({
		url: "/public/collection/stories/" + collectionId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
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

function stud_addUserToCollection(collectionId,numberId,success, error){
	$.ajax({
		url: "/collection/" + collectionId + "/adduser/" + numberId,
		type: "PUT",
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

function stud_connectStories(collectionId,st1Id,st2Id,success) {
	$.ajax( {
		url: "/collection/" + collectionId + "/connect/" + st1Id + "," + st2Id,
		type: 'PUT',
		success: success
	});
}

function stud_disconnectStories(collectionId,st1Id,st2Id,success) {
	$.ajax( {
		url: "/collection/" + collectionId + "/disconnect/" + st1Id + "," + st2Id,
		type: 'PUT',
		success: success
	});
}

function stud_createStoryOnCollection(collectionId, story, success, error){
	$.ajax({
		url: "/collection/" + collectionId + "/create",
		type: "POST",
		dataType: "json",
		data: JSON.stringify(story),
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_followCollection(collectionId,unfollow,success) {
	$.ajax( {
		url: "/follow/collection/" + collectionId + "," + unfollow,
		type: 'PUT',
		success: success
	});
}

function stud_followUser(numberId,unfollow,success) {
	$.ajax( {
		url: "/follow/user/" + numberId + "," + unfollow,
		type: 'PUT',
		dataType: "json",
		success: success
	});
}

function stud_findTagsStaringWith(value,success) {
	$.ajax( {
		url: "/tagsstartingwith=" + value,
		type: 'GET',
		dataType: "json",
		contentType:"application/json",
		success: success
	});
}
