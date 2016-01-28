
//--- initialize global variables ---//

var map;
var storymap;
var storyLocationMarker;

var editingstory;

var helpOn = true;
var userStories;
var userSavedStories;
var defaultLocation;
var fitZoom;

var user = null;
var article = null;
var webUrl = null;
var storylocation;
var locationName;
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

			$('#user-link div').css('background-image','url(' + avatarUrl + ')');
      //initiateMap();
      intializeEvents();
      initializeProfileDetails();
      loadUserStories(function() {
        drawStoryListLayout(userStories.concat(userSavedStories))
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

    //drawStoryListLayout(userStories.concat(userSavedStories))
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
			console.dir(ev2);
			$('#story-image').attr('src', ev2.target.result);
		};

		fileReader.readAsDataURL(saveimagefile);
		fr = fileReader;
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

}

function drawStoryListLayout(stories) {
  $('.story-container').remove();
	var storiesList = $("#stories-list");

  // Set layout
  var noColumns = 1,
  columnWidth = 300,
  columnMargin = 10,
  listMinMargin = 100,
  availableWidth = $('#content-wrapper').innerWidth(),
  requestedWidth = noColumns*(columnWidth + 2*columnMargin) + 2*listMinMargin;
  while (requestedWidth <  availableWidth) {
    noColumns++
    requestedWidth = noColumns*(columnWidth + 2*columnMargin) + 2*listMinMargin;
  }

  noColumns = noColumns - 1;
  storiesList.width(noColumns*(columnWidth + 2*columnMargin));
  for ( var i = 1; i <= noColumns; i++) {
    $('<div id="column-' + i + '" class="layout-column"/>').appendTo(storiesList)
  }

  var columnCommuter;
  counter = 0;
  // Add Create Story Container
  var createStoryContainer = $('<div id="create-story-btn-container" class="story-container"/>').addClass('animate-transition');;
  $('<div id="create-story-btn">CREATE STORY</div>').appendTo(createStoryContainer)
                                                    .click(function() {
                                                      openStoryView({new:true});
                                                    });
  columnCommuter = (counter++ % noColumns) + 1;
  createStoryContainer.appendTo($('#column-' + columnCommuter));

  // Add remaining Story Containers
  if(!stories[0]) {
		$('#no-stories-message').show();
		return;
	} else
		$('#no-stories-message').hide();

  stories.forEach(function(story) {
    var storyContainer = buildStoryContainer(story);
    columnCommuter = (counter++ % noColumns) + 1;
    storyContainer.appendTo($('#column-' + columnCommuter));
  })
}

function buildStoryContainer(story) {
  var storyContainer = $('<div/>').attr('id', 'story-' + story.id).attr('storyId', story.id)
            .addClass('story-container')
            .addClass('animate-transition')


  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(storyContainer)
                                                                  .click(function() {
                                                                    if (storyBelongsToCurrentUser(story))
                                                                      openStoryView({edit:true, story:story});
                                                                    else
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
  authorContainer.append("<span class='story-author-name'>" + authorName +  "</span>");

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
                                          openStoryView({edit:true, story:story});
                                        });
    //$('<li><a href="#">Add to \></a></li>').appendTo(optionsList);
    $('<li><a href="#">Delete Story</a></li>').appendTo(optionsList)
                                              .click(function() {
                                                deleteStory(story.id, function(response) {
                                                  $('#profile-stat-user-created #value').html(response.noOfStories);
                                                  removeStoryFromUserStoriesList(story);
                                                  drawStoryListLayout(userStories.concat(userSavedStories));
                                                });
                                              });
  } else {
    $('<li><a href="#" >Open</a></li>').appendTo(optionsList)
                                      .click(function() {
                                        openStoryView({readonly:true, story:story});
                                      });
    //$('<li><a href="#">Add to \></a></li>').appendTo(optionsList);
    $('<li><a href="#">Remove Story</a></li>').appendTo(optionsList)
                                              .click(function() {
                                                saveStory(story.id, function(response) {
                                                  $('#profile-stat-user-saved #value').html(response.noOfSaved);
                                                  removeStoryFromSavedStoriesList(story);
                                                  drawStoryListLayout(userStories.concat(userSavedStories));
                                                });
                                              });
  }

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
  buildArticleContainer(art,$('#create-edit-open-story-view .story-container-body'),"large")
}

function removeArticleContainer() {
  $('#create-edit-open-story-view .article-container').remove();
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
    $('#create-edit-open-story-view .story-author-name').text(user.getFullName())
    $('#create-edit-open-story-view .story-author-thumbnail').css('background-image','url(' + avatarUrl + ')');
    loadStoryTextBehaviours();
  } else if (option.readonly == true) {
    $('#create-edit-open-story-view .story-author-name').text(s.author.fullName)
    //Story author thumbnail
    var avatarUrl = (s.author.avatarUrl) ? s.author.avatarUrl : defaultAvatarPic;
    $('#create-edit-open-story-view .story-author-thumbnail').css('background-image','url(' + avatarUrl + ')');
  }

  // Load Story details
  if (option.edit == true || option.readonly == true) {
    setStoryText(s.summary,$('#create-edit-open-story-view #story-text'));
    if (s.thumbnail) {
      $('#create-edit-open-story-view #story-image').attr('src',s.thumbnail);
      $('#create-edit-open-story-view #story-image-container').show();
    }
    var locationElement = $('#create-edit-open-story-view .location').text(s.locationName);
    if (locationElement.innerHeight() > 22)
      locationElement.addClass('wrapped-text');
    $('#create-edit-open-story-view #story-map-location-input').val(s.locationName);
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
    $('#create-edit-open-story-view #story-insert-article').show();
    $('#create-edit-open-story-view #article-link').val(s.articleLink);
  }

  if (option.readonly == true) {
    $('#create-edit-open-story-view #remove-story-image').hide();
    $('#create-edit-open-story-view #set-location-btn').hide();
    $('#create-edit-open-story-view #story-map-location-input').hide()
    $('#create-edit-open-story-view #story-map-sight').hide();
    $('#create-edit-open-story-view #story-text').attr('contenteditable', 'false')
                                                 .removeClass('editable');
    $('#create-edit-open-story-view #story-add-picture-button').hide();
    $('#create-edit-open-story-view #story-add-link-button').hide();
    $('#create-edit-open-story-view #story-publish-button').hide();
    $('#create-edit-open-story-view #story-cancel-create-button').hide();
    $('#create-edit-open-story-view #close-story-view').show();
  }

  if (option.edit == true)
    editingstory = s;

  //open view
  $('#create-edit-open-story-view').modal('show');
}

function resetStoryView() {
  $('#create-edit-open-story-view #story-image-container').hide();
  $('#create-edit-open-story-view #story-image').attr('src','');
  $('#create-edit-open-story-view #story-text').text('');
  $('#create-edit-open-story-view #article-link').val('');
  $('#create-edit-open-story-view #story-insert-article').hide();
  $('#create-edit-open-story-view .location').text('Select location');
  $('#create-edit-open-story-view #story-map-location-input').val('');
  $('#create-edit-open-story-view #set-location-btn').show();
  $('#create-edit-open-story-view #remove-story-image').show();
  $('#create-edit-open-story-view #story-text').attr('contenteditable', 'true')
                                               .addClass('editable');
  $('#create-edit-open-story-view #story-map-location-input').show();
  $('#create-edit-open-story-view #story-map-sight').show();
  $('#create-edit-open-story-view #story-add-picture-button').show();
  $('#create-edit-open-story-view #story-add-link-button').show();
  $('#create-edit-open-story-view #story-publish-button').show();
  $('#create-edit-open-story-view #story-cancel-create-button').show();
  $('#create-edit-open-story-view #close-story-view').hide();
  $('#create-edit-open-story-view #story-article').unbind();
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
  $('#create-edit-open-story-view').modal('hide');
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
		//google.maps.event.addListener(storymap, 'center_changed', mapCenterChanged);
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

//--- loadUserStories method ---//
function loadUserStories(onFinished) {
  stud_readUserStories(function(s) {
    userStories = sortStoriesWithDate(s);
    stud_readUserSavedStories(function(ss) {
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

function removeStoryFromUserStoriesList(story) {
  index = userStories.indexOf(story);
  if (index > -1) {
    userStories.splice(index,1);
  }
}

function removeStoryFromSavedStoriesList(story) {
  index = userSavedStories.indexOf(story);
  if (index > -1) {
    userSavedStories.splice(index,1);
  }
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

  if (editingstory) {
    editStory();
    return;
  }

	var story = newStoryObj(map);
	//set new story title
	story.setTitle("story_" + user.getEmail() + "_" + new Date().getTime());
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
	}

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
	story.createStory(function(st){
		//upload story pics
    var story = st
		storyId = story.getStoryId()
		if (saveimagefile) {
			uploadStoryImage(storyId,function(st_) {
        editFinished(st_);
			});
		} else if (hasImageToDelete(st)) {
      deleteStoryImage(storyId, function(st_) {
        editFinished(st_);
      })
		} else {
      editFinished(st);
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

function deleteStoryImage(storyId,success,error) {
  $.ajax({
		url: '/story/'+storyId+'/deleteimage',
		type: "DELETE",
    dataType: "json",
		success: success,
		error: error
	});
}

function hasImageToDelete(st) {
  var imagesrc = $('#create-edit-open-story-view #story-image').attr('src');
  if (imagesrc == "" && (st.getThumbnail() != "" && st.getThumbnail()))
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

function publishFinished(response) {
  closeStoryView();
  $('#profile-stat-user-created #value').html(parseInt($('#profile-stat-user-created #value').html()) + 1);
  loadUserStories(function() {
    drawStoryListLayout(userStories.concat(userSavedStories))
  });
}

function editFinished(response) {
  closeStoryView();
  loadUserStories(function() {
    drawStoryListLayout(userStories.concat(userSavedStories))
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
