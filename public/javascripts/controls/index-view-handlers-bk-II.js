
/******************************************************************
	GLOBAL VARIABLES
******************************************************************/

var map;
var mapbox;
var herosearchBox;
var hero5searchBox;
var mapsearchBox;
var story_;

var article;
var saveimagefile = null;
var uploadimagedata;

var defaultLocation = new google.maps.LatLng(37, -20);

var indexStories;
var indexStoriesMarkerList = new Hashtable();
var storySectionsMarkerList = new Hashtable();
var indexStoryPathsList;
var previousCenter = defaultLocation;
var previousZoom = 2;

var user = null;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"
var defaultCollectionThumbnail = "/assets/images/collection-thumbnail.jpg"

var markerIcon;

var isgrabWebsiteMetadataBusy = false;

var animationBusy = false;
var isStoryViewOpen = false;
var openingtarget = null;
var poppingWindowState = false;

var locationSetMode = 'pinpoint';

var contentheight,
contentwidth,
storyContainersWrapperWidth,
storyContainersWrapperHeight,
storiesGridListContainerWidth,
noColumns;

var wheelzoom;

var ctrlDown = false,
        ctrlKey = 17,
        cmdKey = 91,
        vKey = 86,
        cKey = 67,
        returnKey = 13,
        deleteKey = 46,
        backspaceKey = 8,
        arrowUpKey = 38,
        arrowDownKey = 40,
        arrowLeftKey = 37,
        arrowRightKey = 39;

var COLUMN_WIDTH = 400,
COLUMN_PADDING_LEFT = 25,
COLUMN_PADDING_RIGHT = 14,
COLUMN_MARGIN = 14,
MAX_NO_COLUMNS = 1,
GRID_LAYOUT_MARGIN_LEFT = 75; //also change on index.css: .story-grid-layout

var EMBED_MAX_WIDTH = 570,
EMBED_MAX_HEIGHT = 440,
DEFAULT_VIEWPORT_SIZE = 0.001

var SECTION = 0,
LOCATION_SECTION = 1,
HEADER_SECTION = 2,
STORY_TEXT = 10,
PICTURE_CONTAINER = 11,
STORY_SUBTITLE = 12,
STORY_ARTICLE = 13,
DEFAULT_ZOOM = 3,
NO_VIEWPORT_ZOOM = 14,
DEFAULT_LATITUDE = 39.432031,
DEFAULT_LONGITUDE = -8.084700,
ARTICLE_STORY = 2,
SINGLE_STORY = 1,
OPEN_STORY = 0,
DRAFT = 0,
PUBLISH_WITH_EVERYONE = 1,
PUBLISH_WITH_FOLLOWERS = 2,
PUBLISH_PRIVATELY = 3;

var SECTION_MARKER_COLOR = '#e808d7',
STORY_MARKER_COLOR = '#ff2c2c'

var MAX_ZOOM = 20;
var MIN_ZOOM = 2;


var COOKIE_HISTORY_TAG = "lir-15452345=";
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
	intializeEvents();
}

function loadStories(,onFinished) {
  stud_readPublicStories(20, function(stories) {
		indexStories = stories;
		if (onFinished) onFinished(stories);
  });
}

function intializeEvents() {
	contentheight = $(window).innerHeight() - $('nav.navbar').height();
	contentwidth = $('#content-wrapper').innerWidth();

	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');

  //--- Google Analytics track event ----//
	$(".ga-event-map-publish").click( function() {
		ga('send','event','map', 'publish') //Google Analytics track event
	});

	// PRESS ESCAPE
	document.onkeydown = function(event) {
		if (event.keyCode == 27) {

		}
	}

  // HANDLE PAGE NAVIGATION
	window.onpopstate = function(e){
    poppingWindowState = true;
    if(e.state){
      //se tem estado gravado

    } else {
			//não tem estado gravado
		}
	};

	$('#create-story-btn, #create-link').click(function() {
		if (user)
			openCreateStoryPromptModal();
		else
      openNeedLoginWarningModal();
	});

  // PASTE TEXT
	$(".story-text, .location-name").bind('paste', function(e) {
	  var pastedText = undefined;
	  if (e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) { // IE
	    pastedText = e.originalEvent.clipboardData.getData('Text');
	  } else if (e.clipboardData && e.clipboardData.getData) {
	    pastedText = e.clipboardData.getData('text/plain');
	  }
		$(this).html(pastedText);
	  return false; // Prevent the default handler from running.
	});

  // HANDLE ALERT MESSAGE ON LOGIN/SIGNUP MODAL
  $(".login-modal input, signup-modal input").on("keypress",function() {
    $(".login-modal .login-alert-message, .signup-modal .signup-alert-message").hide();
  });

  // HANDLE INITIALIZATION OF CREATE ARTICLE MODAL
  $('#create-article-story-modal').on('shown.bs.modal', function() {
    initiateMapBox();
    initiateSearchBox('story-location-input');
    stud_loadLabels(function(results) {
      console.log(results);
      $("#create-article-story-modal #story-keywords-input").autocomplete({
        source:results
      })
    })
  })

  // HANDLE ARTICLE IMAGE UPDATE ON CREATE ARTICLE MODAL
  $("#create-article-story-modal #story-image-url-input").change(function() {
    updateImageUrlFromArticle();
  });
}

/******************************************************************
	DRAW AND CONTROL LAYOUTS
******************************************************************/

function openCreateStoryPromptModal() {
	$('#create-story-prompt-modal').modal('show');
}

function openCreateStoryView() {
	window.location.href = LIR_SERVER_URL + '/story/create';
}

function openCreateArticleStoryView() {
	$('#create-story-prompt-modal').modal('hide');
  $('#create-article-story-modal').modal('show');
}

function openCreateSingleStoryView() {
	$('#create-story-prompt-modal').modal('hide');
	if (!$("#content-wrapper").hasClass('showing-map')) {
		openStoryLayoutView();
		fitPositionOnView(DEFAULT_LATITUDE,DEFAULT_LONGITUDE,DEFAULT_ZOOM,map)
	}
	story = new Object()
	story.format = SINGLE_STORY;
  stud_createStory(story,function(st) {
		story = st;
		openStoryView(story,{editable:true})
	})
}

function openEditStoryView(story) {
	if (story.format == OPEN_STORY)
		window.location.href = LIR_SERVER_URL + '/story/edit/' + story.id;
	else if (story.format == SINGLE_STORY)
		openStoryView(story,{editable:true})
}

/******************************************************************
	ARTICLE STORY CREATION HANDLERS
******************************************************************/

function fetchMetadataFromUrl() {
  var url = $("#create-article-story-modal #story-url-prompt").val();
  stud_fetchHtml(url,function(data) {
    $("#create-article-story-modal #story-image-container").css('background-image','url(' + data.imageUrl + ')')
    $("#create-article-story-modal #story-image-url-input").val(data.imageUrl)
    $("#create-article-story-modal #story-title-input").val(data.title)
    $("#create-article-story-modal #story-description-input").val(data.description)
    $("#create-article-story-modal #story-author-input").val(data.author)
    $("#create-article-story-modal #story-date-input").val(data.date)
    $("#create-article-story-modal #story-source-icon").attr('src',data.icon)
    $("#create-article-story-modal #story-source-input").val(data.source)
    $("#create-article-story-modal #story-url-input").val(data.url)
  })
}

function addKeywordToArticle() {
  var kw = $("#create-article-story-modal #story-keywords").text(),
  newkw = $("#create-article-story-modal #story-keywords-input").val();
  if (newkw.length > 0) {
    if (kw.length > 0)
      $("#create-article-story-modal #story-keywords").text(kw + ", " + newkw);
    else
      $("#create-article-story-modal #story-keywords").text(newkw);
  }
  $("#create-article-story-modal #story-keywords-input").val("");
}

function updateMetadataFromUrl() {
  fetchMetadataFromUrl();
}

function updateImageUrlFromArticle() {
  var imageurl = $("#create-article-story-modal #story-image-url-input").val();
  $("#create-article-story-modal #story-image-container").css('background-image','url(' + imageurl + ')')
}

function saveArticleStory(storyid) {
  var storyData = new Object();
  var articleItem = new Object();

  articleItem.author = $("#create-article-story-modal #story-author-input").val()
  articleItem.date = $("#create-article-story-modal #story-date-input").val()
  articleItem.source = $("#create-article-story-modal #story-source-input").val()
  articleItem.url = $("#create-article-story-modal #story-url-input").val()
  articleItem.title = $("#create-article-story-modal #story-title-input").val();
  articleItem.description = $("#create-article-story-modal #story-description-input").val();
  articleItem.imageUrl = $("#create-article-story-modal #story-image-url-input").val();
  articleItem.icon = $("#create-article-story-modal #story-source-icon").attr('src');
  if (storyid) storyData.id = storyid;
	storyData.summary = articleItem.description;
  storyData.location = {
		name: $("#create-article-story-modal #story-location-input").val(),
    latitude:mapbox.getCenter().lat,
    longitude:mapbox.getCenter().lng,
		zoom: mapbox.getZoom(),
		ismain:true,
    showpin:true,
    radius:0
  }
  storyData.lables = $("#create-article-story-modal #story-description-input").val().split(", ");
	storyData.format = ARTICLE_STORY;
  storyData.published = 1;
	storyData.thumbnail = articleItem.imageUrl;
  storyData.content = JSON.stringify([{
    type:HEADER_SECTION,
    location:storyData.location,
    content:[{type:STORY_ARTICLE,text:JSON.stringify(articleItem)}]
  }]);
  saveStoryData(storyData,function() {
    $("#create-article-story-modal").modal('hide');
  });
}

/******************************************************************
	BUILD STORY CONTAINERS
******************************************************************/

function buildLocationBannerForSingleStory(story,l,editable) {
  var location;
  if (l == null) {
    location = new Object();
    location.id = null;
    location.latitude = null;
    location.longitude = null;
    location.radius = 0;
    location.zoom = null;
    location.showpin = false;
    location.ismain = false;
    location.name = "(choose location)";
  } else
    location = l;

  var locationBanner = $('<div class="location-banner" contenteditable="false" />');
  if (editable) locationBanner.addClass('edit')
  addLocationDataAttrOnElement(locationBanner,location)
  $('<span class="location-icon glyph-icon icon-no-margins icon-15px flaticon-placeholder">').appendTo(locationBanner)
  var locationNameelem = $('<p class="location-name" contenteditable="'+editable+'">' + location.name + '</p>').appendTo(locationBanner);
	if (editable)
		setPasteBehaviour(locationNameelem,true);
	//add marker to map
	if (story.location != null) {
		//indexStoriesMarkerList.put(story.id,drawStoryMarkerOnMap(story.location))
		//storySectionsMarkerList.put(0,drawSectionMarkerOnMap(story.location));
	}

  return locationBanner;
}

function addLocationDataAttrOnElement(element,location) {
  element.attr('id',location.id);
  element.attr('lat',location.latitude);
  element.attr('lng',location.longitude);
  element.attr('radius',location.radius);
  element.attr('zoom',location.zoom);
  element.attr('locationName',location.name);
  element.attr('showpin',location.showpin);
  element.attr('ismain',location.ismain);
}

function buildSingleStoryPictureFrame(link,editable) {
  var picContainer = $("<div class='picture-container' readonly/>");
  var picFrame = $("<div class='picture-frame' contenteditable='false'/>").appendTo(picContainer);

  $('<img src=' + link + '>').appendTo(picFrame);
	if (editable) {
		picContainer.removeAttr('readonly')
	  var picControlers = $("<div class='picture-controls btn-group' />").appendTo(picFrame);
	  $("<a class='btn btn-no-background btn-white'><span class='glyph icon-no-margins icon-20px flaticon-cross'/></a>").click(function() {
	                                                              //TODO: delete image on server
																																$(".single-story #image-upload-input").replaceWith($(".single-story #image-upload-input").val('').clone(true));
	                                                              picContainer.remove();
																																uploadimagedata = null;
	                                                            })
	                                                            .appendTo(picControlers);
	}
  return picContainer;
}

function setPublishingType(opt,updatestatus) {
  switch (parseInt(opt)) {
    case PUBLISH_WITH_EVERYONE:
      $("#publish-options-dropdown").attr("publish-type",PUBLISH_WITH_EVERYONE);
      $("#publish-options-dropdown .publish-option-text").text("Share with everyone")
      if (updatestatus) $("#story-status").text("Shared with everyone")
      break;
    case PUBLISH_WITH_FOLLOWERS:
      $("#publish-options-dropdown").attr("publish-type",PUBLISH_WITH_EVERYONE);
      $("#publish-options-dropdown .publish-option-text").text("Share with followers")
      if (updatestatus) $("#story-status").text("Shared with followers")
      break;
    case PUBLISH_PRIVATELY:
      $("#publish-options-dropdown").attr("publish-type",PUBLISH_WITH_EVERYONE);
      $("#publish-options-dropdown .publish-option-text").text("Share privately")
      if (updatestatus) $("#story-status").text("Shared privately")
      break;
    default:
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
  if (story.format == SINGLE_STORY) {
    storyContainer.addClass('single-story');
  }

	storyContainer.hover(function() {
		$('#story-' + story.id + '.story-container.sm-container').addClass('highlighted');
		if (story.location && !options.featured)
			indexStoriesMarkerList.get(story.id).addClass('highlighted')
	} , function() {
		$('#story-' + story.id + '.story-container.sm-container').removeClass('highlighted');
		if (story.location && !options.featured)
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
																																			fitLocationOnView(story.location,map);
																																			openStoryView(story,{loadstoriesfirst:true});
																																		} else
                                                                    	openStoryView(story);
                                                                      stud_triggerstoryread(story);
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

  $('<li class="option-open"><a>Open</a></li>').appendTo(optionsList)
                                    .click(function() {
                                      openStoryView(story);
                                      stud_triggerstoryread(story);
                                    });


	var editStoryBtn = $('<li class="option-edit"><a>Edit Story</a></li>').appendTo(optionsList)
                                            .click(function() {
																							openEditStoryView(story);
                                            });
	if (storyBelongsToCurrentUser(story)) editStoryBtn.css('display','block');

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

  if (!story.locationName || story.locationName && story.locationName.length == 0)
    story.locationName = "(a location)"
  $('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-10px flaticon-location"></div>').appendTo(locationContainer);
  $('<p class="location">' + story.locationName + '</p>').appendTo(locationContainer);

	if (story.format == OPEN_STORY) {
	  //Thumbnail: article image or story image
	  var imageContainer = $('<div class="image-container"/>').attr('id', 'image-story-' + story.id).appendTo(storyContainerBody);
		if (story.thumbnail && story.thumbnail.length > 0) {
	    $('<img>').appendTo(imageContainer).attr('src',PICTURES_SERVER_PATH + story.thumbnail);
	  }

	  if (!story.title || story.title && story.summary.title == 0)
	    story.title = "(A Story Title)"
	  var titleContainer = $('<div class="title-container"/>').appendTo(storyContainerBody);
	  var title = $('<p class="story-title"/>').appendTo(titleContainer).text(story.title);

	  if (!story.summary || story.summary && story.summary.length == 0)
	    story.summary = "(a story summary...)"
	  var summaryContainer = $('<div class="summary-container"/>').appendTo(storyContainerBody);
	  var summary = $('<p class="story-summary"/>').appendTo(summaryContainer);
	  setStoryText(story.summary,summary);
	} else if (story.format == SINGLE_STORY) {
		if (!story.summary || story.summary && story.summary.length == 0)
	    story.summary = "(a story summary...)"
	  var summaryContainer = $('<div class="summary-container"/>').appendTo(storyContainerBody);
	  var summary = $('<p class="story-summary"/>').appendTo(summaryContainer);
	  setStoryText(story.summary,summary);
    var summaryContainerOverlay = $('<div class="summary-container-overlay"/>').appendTo(summaryContainer);
		//Thumbnail: article image or story image
	  var imageContainer = $('<div class="image-container"/>').attr('id', 'image-story-' + story.id).appendTo(storyContainerBody);
		if (story.thumbnail && story.thumbnail.length > 0) {
	    $('<img>').appendTo(imageContainer).attr('src',PICTURES_SERVER_PATH + story.thumbnail);
	  }
	}

  //--- FOOTER ---//

  // Stats: Likes and Saves
  var storyStatsContainer = $('<div class="story-stats-container"/>').appendTo(storyContainerFooter);
  $('<div class="story-stats-views">' + story.noViews + ' views</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-likes">' + story.noOfLikes + ' likes</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-saves">' + story.noOfSaves + ' bookmarks</div>').appendTo(storyStatsContainer);

  return storyContainer;
}

/******************************************************************
	BUILD LARGE CONTAINER
******************************************************************/

function buildStoryLargeContainer(story,options) {
	if (!options) var options = {featured:false,editable:false,new:true}
  var storyContainer = $('<div class="story-container lg-container"></div>');

  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
	//Scrollable content
	var scrollableContent = $('<div class="scrollable-content"/>').appendTo(storyContainer)
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(scrollableContent)
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
		$('<button type="button" class="close-button btn btn-icon"><span class="glyph-icon icon-no-margins icon-25px flaticon-arrows"></button>').appendTo(optionsBtnContainer)
																																				.click(function() {
																																					closeStoryView();
																																				});
	}

  //Story location container
  var locationContainer = $('<div class="location-container"/>').appendTo(storyContainerBody)
  var location = "";
	if (story.locationName && story.locationName.length > 0)
    location = story.locationName;
  $('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-15px flaticon-placeholder"></div>').appendTo(locationContainer);
  var locationInput = $('<input readonly class="location" placeholder="Story location..." />').appendTo(locationContainer).val(location);

	if (!options.new)
  	buildStoryContent(story).appendTo(storyContainerBody);

  return storyContainer;
}

function buildSingleStoryLargeContainer(story,options) {
	if (!options) var options = {featured:false,editable:false,new:true}
  var storyContainer = $('<div class="story-container lg-container single-story"></div>');

  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
	//Scrollable content
	var scrollableContent = $('<div class="scrollable-content"/>').appendTo(storyContainer)
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(scrollableContent)
	if (options.editable)
		storyContainerBody.addClass('edit');
  //Story container footer
  var storyContainerFooter = $('<div class="story-container-footer"/>').appendTo(scrollableContent);

  //Story author container
  var authorContainer = $('<div class="author-container"/>').appendTo(storyContainerHeader);
  //Story author thumbnail
	var authorName, numberId, avatarUrl;
	if (!options.new) {
		authorName = story.author.fullName;
		avatarUrl = (story.author.avatarUrl != null) ? story.author.avatarUrl : defaultAvatarPic;
		numberId = story.author.numberId;
	} else {
		authorName = user.domainUser.fullName;
		avatarUrl = (user.domainUser.avatarUrl != null) ? user.domainUser.avatarUrl : defaultAvatarPic;
		numberId = user.domainUser.numberId;
	}
  var authorThumbnail = $("<div class='story-author-thumbnail'></div>")
              .css('background-image','url(' + avatarUrl + ')')
              .appendTo(authorContainer)

  //Story author name
  authorContainer.append('<a class="story-author-name" href="/profile/' + numberId + '">' + authorName +  '</a>');

	//Story Options Container
	var optionsBtnContainer = $('<div class="story-options-container"/>').appendTo(storyContainerHeader);
	if (!options.editable) {
		// LIKE BUTTON
	  optionsBtnContainer.append(buildLikeButton(story));
	  // SAVE BUTTON
	  optionsBtnContainer.append(buildSaveStoryButton(story));
		// Close/Gridview
		$('<button type="button" class="close-button btn btn-icon"><span class="glyph-icon icon-no-margins icon-25px flaticon-arrows"></button>').appendTo(optionsBtnContainer)
																																				.click(function() {
																																					closeStoryView();
																																				});
	} else {
		var cancelBtn = $('<button id="cancel-btn" type="button" class="btn btn-default" onclick="closeStoryView({keepMapPosition:true,updatePageHistory:true})"><span class="glyph icon-no-margins icon-15px flaticon-cross"/></button>').appendTo(optionsBtnContainer)
		var addPictureBtn = $('<a class="btn btn-default" id="add-picture-btn"><span class="glyph icon-no-margins icon-20px flaticon-art"/></a>').appendTo(optionsBtnContainer)
		$('<form enctype="multipart/form-data" id="image-upload-form" class="image-upload-form"/>')
			.append('<input id="image-upload-input" name="profileImg[]" type="file" />').appendTo(addPictureBtn);
		var saveBtn = $('<button id="save-btn" type="button" class="btn btn-default" onclick="saveStory('+ story.id +')"><span class="glyph icon-no-margins icon-15px flaticon-save"/></button>').appendTo(optionsBtnContainer)
		var dropdownmenu = $('<div class="dropdown"/>').appendTo(optionsBtnContainer)
		var publishoptionsBtn = $('<button class="btn btn-default dropdown-toggle" type="button" publish-type="2" id="publish-options-dropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"></button>').appendTo(dropdownmenu)
		publishoptionsBtn.append('<span class="publish-option-text">Share with followers</span>')
		publishoptionsBtn.append('<span class="caret"></span>')
		var dropdownlist = $('<ul class="dropdown-menu" aria-labelledby="publish-options-dropdown"></ul>').appendTo(dropdownmenu)
		dropdownlist.append('<li><a publish-type="1" onclick="setPublishingType(1,false)">Share with everyone</a></li>')
		dropdownlist.append('<li><a publish-type="2" onclick="setPublishingType(2,false)">Share with followers</a></li>')
		dropdownlist.append('<li><a publish-type="3" onclick="setPublishingType(3,false)">Share privately</a></li>')
		if (story.published > 0) {
			var postBtn = $('<button id="post-btn" type="button" class="btn btn-default highlighted" onclick="publishStory('+ story.id +')">Unpost</button>').appendTo(optionsBtnContainer)
		} else {
			var postBtn = $('<button id="post-btn" type="button" class="btn btn-default" onclick="publishStory('+ story.id +')">Post</button>').appendTo(optionsBtnContainer)
		}
		postBtn.attr('published-status',story.published);

		addPictureBtn.find("#image-upload-input").change(function(ev) {
	    var saveimagefile = ev.target.files[0];
	    var fileReader = new FileReader();
	    fileReader.onload = function(ev2) {
				uploadimagedata = ev2.target.result;
				$(".single-story #story-picture").append(buildSingleStoryPictureFrame(uploadimagedata,true))
	    };
	    fileReader.readAsDataURL(saveimagefile);
	  });
	}

  //Story location container
  $('<div id="story-location"/>')
			.append(buildLocationBannerForSingleStory(story,story.location,options.editable))
			.appendTo(storyContainerBody)
	var storytext = $('<p id="story-text" class="story-text" contenteditable="'+options.editable+'"></p>').appendTo(storyContainerBody)
	if (options.editable)
		setPasteBehaviour(storytext,false);

	if (!options.new) {
		setStoryText(story.summary,storytext);
	}
	var storypicture = $('<div id="story-picture"/>').appendTo(storyContainerBody)
	if (story.thumbnail != null)
		storypicture.append(buildSingleStoryPictureFrame(PICTURES_SERVER_PATH + story.thumbnail,options.editable));

  return storyContainer;
}

/******************************************************************
	STORY CONTENT
******************************************************************/

function buildStoryContent(story,options) {
	var contentElement = $("<div id='story-content'/>")
	var storytitle = $('<h2 class="story-title"></h2>').text(story.title);
	var storysummary = $('<p class="story-summary"></p>').text(story.summary);
	var placeholderoverlay = $('<div class="placeholder-overlay"></div>');
	var detailsoverlay = $('<div class="details-overlay"></div>');
	var storythumbnailandcontainer = $('<div class="story-thumbnail-and-container"></div>').css('background-image','url(' + PICTURES_SERVER_PATH + story.thumbnail + ')')
	detailsoverlay.append(storytitle);
	detailsoverlay.append(storysummary);
	storythumbnailandcontainer.append(placeholderoverlay);
	storythumbnailandcontainer.append(detailsoverlay);
	storythumbnailandcontainer.appendTo(contentElement);

	if (!options) var options = {editable:false}
	var storycontent = JSON.parse(story.content.replace(/&quot;/g,'"'));
	if (!storycontent) { return contentElement; }
	var sectioncounter = 0;
  storycontent.forEach(function(sectionObj) {
    if (sectionObj.type == LOCATION_SECTION) {
      var sectionElem = $("<div class='section location-section'/>").appendTo(contentElement);
      buildLocationBanner(sectionObj.location,options,sectioncounter).appendTo(sectionElem)
      if (sectionObj.content) {
        sectionObj.content.forEach(function(itemObj) {
          switch (itemObj.type) {
            case STORY_TEXT:
              $('<p class="section-item story-text text-normal-size">' + itemObj.text + '</p>').appendTo(sectionElem);
              break;
						case STORY_SUBTITLE:
              $('<p class="section-item story-text text-title-size">' + itemObj.text + '</p>').appendTo(sectionElem);
              break;
            case PICTURE_CONTAINER:
              buildPictureFrame(itemObj.link,itemObj.text,itemObj.position,options).appendTo(sectionElem);
              break;
          }
        });
      }
			sectionElem.hover(function() {
				fitLocationOnView(sectionObj.location,map);
				var counter = parseInt($(this).attr('section-counter'));
				storySectionsMarkerList.get(counter).addClass('highlighted')
			} , function() {
				var counter = parseInt($(this).attr('section-counter'));
				storySectionsMarkerList.get(counter).removeClass('highlighted')
			});
    } else {
      var sectionElem = $("<div class='section'/>").appendTo(contentElement);
      if (sectionObj.content) {
        sectionObj.content.forEach(function(itemObj) {
          switch (itemObj.type) {
            case STORY_TEXT:
              $('<p class="section-item story-text text-normal-size">' + itemObj.text + '</p>').appendTo(sectionElem);
              break;
						case STORY_SUBTITLE:
              $('<p class="section-item story-text text-title-size">' + itemObj.text + '</p>').appendTo(sectionElem);
              break;
            case PICTURE_CONTAINER:
              buildPictureFrame(itemObj.link,itemObj.text,itemObj.position,options).appendTo(sectionElem);
              break;
          }
        });
      }
    }
		sectionElem.attr('section-counter',sectioncounter);
		sectioncounter++;
  });
	return contentElement;
}

function buildLocationBanner(location,options,counter) {
	if (!options) var options = {editable:false}
  var _map;
	var locationBannerContainer = $('<div class="location-banner-container" contenteditable="false" />');
  var locationBanner = $('<div class="location-banner" contenteditable="false" />').appendTo(locationBannerContainer);
  $('<span class="location-icon glyph-icon icon-no-margins icon-15px flaticon-placeholder">').appendTo(locationBanner)
  var locationNameelem = $('<p class="location-name">' + location.name + '</p>').appendTo(locationBanner);
	var sectionmarker = drawSectionMarkerOnMap(location);
	storySectionsMarkerList.put(counter,sectionmarker);

  return locationBannerContainer;
}

function buildPictureFrame(link,caption,pos,options) {
	if (!options) var options = {editable:false}
  var picContainer = $("<div class='section-item picture-container' readonly/>");
  var position = (pos) ? pos : "center"
  var picFrame = $("<div class='picture-frame' position='" + position + "'/>").appendTo(picContainer);
  $('<img src=' + PICTURES_SERVER_PATH + link + '>').appendTo(picFrame);

	if (options.editable) {
		picContainer.removeAttr('readonly');
		var picControlers = $("<div class='picture-controls btn-group' />").appendTo(picFrame);
	  $("<a class='btn btn-default picture-position'>Left</a>").click(function() {
	                                                              picFrame.attr('position','left');
	                                                            })
	                                                            .appendTo(picControlers);
	  $("<a class='btn btn-default picture-position'>Center</a>").click(function() {
	                                                              picFrame.attr('position','center');
	                                                            })
	                                                            .appendTo(picControlers);
	  $("<a class='btn btn-default picture-position'>Right</a>").click(function() {
	                                                              picFrame.attr('position','right');
	                                                            })
	                                                            .appendTo(picControlers);
	  $("<a class='btn btn-default picture-position'>Cover</a>").click(function() {
	                                                              picFrame.attr('position','cover');
	                                                            })
	                                                            .appendTo(picControlers);
	  $("<a class='btn btn-default'>Delete</a>").click(function() {
	                                                              //TODO: delete image on server
	                                                              picContainer.remove();
	                                                            })
	                                                            .appendTo(picControlers);
	}
	if (options.editable) {
  	$("<p class='picture-caption' contenteditable='true'/>").text(caption)
																														.appendTo(picFrame);
	} else {
		$("<p class='picture-caption' contenteditable='false' readonly/>").text(caption)
																														.appendTo(picFrame);
	}

  return picContainer;
}

/******************************************************************
	BUILD OTHER LAYOUT PARTS AND HELPERS
******************************************************************/

function buildLikeButton(story) {
	var icon = '<span class="glyph-icon icon-no-margins icon-25px flaticon-like">'
  var id = story.id;
  var likeButtonClass = (story.currentUserLikesStory) ? 'liked' : '';
  var likeButton = $('<button storyId= ' + id + ' class="story-like-button btn btn-icon ' + likeButtonClass + '" >' + icon + '  <span class="badge">' + story.noOfLikes + '</span></button>')
              .click(function() {
                if (!user)
                  openNeedLoginWarningModal();
                else {
                  var storyId = parseInt($(this).attr('storyId'));
                  likeStory(storyId, function(result) {
                    var story = getStoryById(result.storyId,indexStories);
                    story.noOfLikes = result.noOfLikes;
                    story.currentUserLikesStory = result.currentUserLikesStory;
                    $('.story-like-button[storyId=' + storyId + '] span').html(result.noOfLikes);
  									$('.story-like-button[storyId=' + storyId + '] .story-stats-likes').html(result.noOfLikes + ' likes');
                    if (result.currentUserLikesStory) {
                      $('.story-like-button[storyId=' + storyId + ']').addClass('liked')
                                                                    .html(icon + '  <span class="badge">' + result.noOfLikes + '</span>');
                    } else {
                      $('.story-like-button[storyId=' + storyId + ']').removeClass('liked')
                                                                    .html(icon + '  <span class="badge">' + result.noOfLikes + '</span>');
                    }
                    updateStatsFromSmallContainer(story);
                  });
                }
              });
  return likeButton;
}

function buildSaveStoryButton(story) {
	var icon = '<span class="glyph-icon icon-no-margins icon-25px flaticon-bookmark">'
  var id = story.id;
  var saveStoryButtonClass = (story.currentUserSavedStory) ? 'saved' : '';
  var saveStoryButton = $('<a storyId= ' + id + ' role="button" data-toggle="popover" tabindex="0" class="story-save-button btn btn-icon ' + saveStoryButtonClass + '" >' + icon + '  <span class="badge">' + story.noOfSaves + '</span></a>')
              .click(function() {
                if (!user) {
                  openNeedLoginWarningModal();
                } else {
  								var storyId = parseInt($(this).attr('storyId'));
                  bookmarkStory(storyId, function(result) {
                    var story = getStoryById(result.storyId,indexStories);
                    story.currentUserSavedStory = result.currentUserSavedStory;
  									story.noOfSaves = result.noOfSaves;
                    $('.story-save-button[storyId=' + storyId + '] span').html(result.noOfSaves);
  									$('.story-save-button[storyId=' + storyId + '] .story-stats-saves').html(result.noOfSaves + ' saves');
                    if (result.currentUserSavedStory) {
                      $('.story-save-button[storyId=' + storyId + ']').addClass('saved')
                                                                    .html(icon + '  <span class="badge">' + result.noOfSaves + '</span>');
                    } else {
                      $('.story-save-button[storyId=' + storyId + ']').removeClass('saved')
                                                                    .html(icon + '  <span class="badge">' + result.noOfSaves + '</span>');
                    }
                    updateStatsFromSmallContainer(story);
                  });
                }
              });
    return saveStoryButton;
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
    scrollwheel: true,
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
		google.maps.event.addListener(map, 'zoom_changed', function() {updateMapState()});
    google.maps.event.addListener(map, 'dragend', function() {updateMapState()});
		if (openingtarget)
			setUpOpeningTarget();
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
		setTimeout(function() { updatePageHistory() },200);
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
		setTimeout(function() { updatePageHistory() },200);
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
		updatePageHistory();
  });
}

function initiateMapBox() {
  mapbox = new mapboxgl.Map({
    container: 'mapbox-canvas',
    style: 'mapbox://styles/jozie-blueyes/cizcm816700am2smcjyqd2pvb'
  });
}

function initiateSearchBox(map) {
  var input = document.getElementById('story-location-input');
  var searchBox = new google.maps.places.SearchBox(input);
  //Bias the SearchBox results towards current map's viewport.

  // searchBox.setBounds(mapbox.getBounds());
  // mapbox.addListener('bounds_changed', function() {
  //   searchBox.setBounds(mapbox.getBounds());
  // });
  searchBox.addListener('places_changed', function() {
    searchBoxCenterMap(this,mapbox);
  });
}

function updateMapState() {
  //getAddressNameOnEditingMode();
  if (!isStoryViewOpen && !openingtarget && !poppingWindowState) {
    loadStories(null,function(stories) {
      drawLayout(stories);
    });
    updatePageHistory();
  }
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
			north:places[0].geometry.viewport.getNorthEast().lat(),
			east:places[0].geometry.viewport.getNorthEast().lng(),
			south:places[0].geometry.viewport.getSouthWest().lat(),
			west:places[0].geometry.viewport.getSouthWest().lng()
		}
		// fitMapBoundsOnLayout(bounds);
	} else {
		bounds = {
			north:places[0].geometry.location.lat() + DEFAULT_VIEWPORT_SIZE,
			east:places[0].geometry.location.lng() + DEFAULT_VIEWPORT_SIZE,
			south:places[0].geometry.location.lat() - DEFAULT_VIEWPORT_SIZE,
			west:places[0].geometry.location.lng() - DEFAULT_VIEWPORT_SIZE
		}
	}

  if (editingMode) {
    $(".single-story #story-location .location-name").text($('#search-and-controls-bar #search-input').val());
  }

	fitMapBoundsOnLayout(bounds);
	loadStories(bounds,function(stories) {
		drawLayout(stories);
	});
}

function searchBoxCenterMap(sb,map) {
	var places = sb.getPlaces();
	var bounds;
	if (!places || places.length == 0) {
		displayAlertMessage('No places found!')
		return;
	}
	if (places[0].geometry.viewport) {
		bounds = {
			north:places[0].geometry.viewport.getNorthEast().lat(),
			east:places[0].geometry.viewport.getNorthEast().lng(),
			south:places[0].geometry.viewport.getSouthWest().lat(),
			west:places[0].geometry.viewport.getSouthWest().lng()
		}
		// fitMapBoundsOnLayout(bounds);
	} else {
		bounds = {
			north:places[0].geometry.location.lat(),
			east:places[0].geometry.location.lng(),
			south:places[0].geometry.location.lat(),
			west:places[0].geometry.location.lng()
		}
	}

	map.fitBounds([
    [bounds.west,bounds.south],
    [bounds.east,bounds.north]])
}

function getStoryLocationFromMap(map) {
	var loc = getMapCenterOnLayout(map);
	var storylocation = {
		name: $('.single-story #story-location .location-name').text(),
    latitude:loc.lat(),
    longitude:loc.lng(),
		zoom: map.getZoom(),
		ismain:true,
    showpin:true,
    radius:0
  }
	var mapregiondiameter = $('#map-region').innerWidth();
	if (mapregiondiameter < 10) {
		storylocation.showpin = true;
		storylocation.radius = 0;
	} else {
		storylocation.showpin = false;
		storylocation.radius = $('#map-region').innerWidth() / 2 * 1.404595 * Math.exp(-0.693*map.getZoom());
	}
	return storylocation;
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
		var zoom = Math.floor(-1/0.693*Math.log(height_coord/(1.404595*height_pix)));
	else
		var zoom = Math.floor(-1/0.693*Math.log(width_coord/(1.404595*width_pix)));
	zoom = (zoom >= 2) ? zoom : 2;
	var delta_coord = $('#map-canvas').innerWidth() * 1.404595 * Math.exp(-0.693*zoom),
	center = new google.maps.LatLng(0.5*(north+south), 0.5*(west+east) - (1 - (width_pix)/$('#map-canvas').innerWidth())*0.5*delta_coord, true);
	// var marker = new google.maps.Marker({
	// 	position : new google.maps.LatLng(0.5*(north+south), 0.5*(west+east)),
	// 	map : map,
	// 	draggable : false
	// });
	map.setZoom(Math.round(zoom));
	map.panTo(center);
}


function getMapCenterOnLayout(map) {
	var bounds = map.getBounds(),
	east = bounds.getNorthEast().lng(),
	west = bounds.getSouthWest().lng(),
	zoom = map.getZoom();
	longitude = east - $('#map-viewport').innerWidth() / 2 * 1.404595 * Math.exp(-0.693*zoom),
	latitude = map.getCenter().lat(),
	center = new google.maps.LatLng(latitude,longitude);
  // map.setCenter(center);
	return center;
}

function zoomInMap() {
	var center = getMapCenterOnLayout(map),
	zoom = map.getZoom()
	if (zoom <= 20)
		map.setZoom(Math.round(zoom)+1);
	centerMapOnLayout(center,map);
	loadStories(null,function(stories) { drawLayout(stories);});
}

function zoomMapWheel(wheelvalue) {
  var center = getMapCenterOnLayout(map),
  zoom = map.getZoom();
  if (wheelzoom == null) wheelzoom = zoom;
  wheelzoom = wheelzoom + wheelvalue / 1000
  if (Math.round(wheelzoom) != zoom) {
    if (wheelzoom <= MAX_ZOOM && wheelzoom >= MIN_ZOOM) {
      map.setZoom(Math.round(wheelzoom));
    	centerMapOnLayout(center,map);
    	//loadStories(null,function(stories) { drawLayout(stories);});
    }
    console.log("Wheelzoom is: " + Math.round(wheelzoom) + " and current zoom is: " + zoom);
    wheelzoom = null;
  }
}

function zoomOutMap() {
	var center = getMapCenterOnLayout(map),
	zoom = map.getZoom()
	if (zoom > 3)
		map.setZoom(Math.round(zoom)-1)
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
		if (map) {
			var sets = fitLocationOnView(markers[0].location,map)
		}
		indexZoom = sets.zoom;
		indexCenter = sets.center;
	} else {
		for (var i = 0; i < markers.length; i++) {
			if (markers[i].location != null)
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
		map.setZoom(Math.round(indexZoom));
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
			var sets = fitLocationOnView(stories[0].location,map)
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
		map.setZoom(Math.round(indexZoom));
		map.panTo(indexCenter);
	}
}

//--- fitLocationOnView ---//
function fitLocationOnView(location,map) {
	if (location != null) {
		var zoom = location.zoom,
		width_pix = $('#map-viewport').innerWidth(),
		delta_coord = $('#map-canvas').innerWidth() * 1.404595 * Math.exp(-0.693*zoom),
		center = new google.maps.LatLng(location.latitude, location.longitude - (1 - width_pix/$('#map-canvas').innerWidth())*0.5*delta_coord, true);
		map.setZoom(Math.round(zoom));
		map.panTo(center);
		return {zoom:zoom, center:center}
	}
}

function fitPositionOnView(lat,lng,zoom,map) {
	width_pix = $('#map-viewport').innerWidth(),
	delta_coord = $('#map-canvas').innerWidth() * 1.404595 * Math.exp(-0.693*zoom),
	center = new google.maps.LatLng(lat, lng - (1 - width_pix/$('#map-canvas').innerWidth())*0.5*delta_coord, true);
	map.setZoom(Math.round(zoom));
	map.panTo(center);
	return {zoom:zoom, center:center}
}

//--- drawPublishedStoryMarkersOnMap method ---//
function drawStoriesMarkersOnMap(stories,icon) {
	clearAllMarkersFromMap();
	markerList  = new Hashtable();
	if (stories.length == 0) return markerList;

  var st_;
	for ( var i = 0; i < stories.length; i++) {
		st_ = stories[i];
		if (st_.location) {
			//custom marker
			var markerDiv = $('<div class="marker-div animated-marker"></div>'),
			position = new google.maps.LatLng(st_.location.latitude, st_.location.longitude, true),
			offset = new Object({x:0, y:0 }),
			marker = new SimpleMapOverlay(position,position,offset,markerDiv[0],map,false);
			marker.setColor(STORY_MARKER_COLOR);
			marker.story = st_;
			marker.location = st_.location;
			marker.addListener('click', function() {
				openStoryView(this.story);
      });
			marker.addListener('mouseenter',function() {
				$('#story-' + this.story.id + '.story-container.sm-container').addClass('highlighted');
			});
			marker.addListener('mouseleave',function() {
				$('#story-' + this.story.id + '.story-container.sm-container').removeClass('highlighted');
			});
			markerList.put(st_.id,marker);
		}
	//fitLocationOnView(storyMarkerList);
	}
  return markerList;
}

function drawStoryMarkerOnMap(story) {
	var position = new google.maps.LatLng(story.location.latitude, story.location.longitude, true)
	var markerDiv = $('<div class="marker-div animated-marker"></div>'),
	offset = new Object({x:0, y:0 }),
	marker = new SimpleMapOverlay(position,position,offset,markerDiv[0],map,false);
	marker.setColor(STORY_MARKER_COLOR);
	marker.story = story;
	marker.location = story.location;
	marker.addListener('click', function() {
    openStoryView(this.story);
  });
	marker.addListener('mouseenter',function() {
		$('#story-' + this.story.id + '.story-container.sm-container').addClass('highlighted');
	});
	marker.addListener('mouseleave',function() {
		$('#story-' + this.story.id + '.story-container.sm-container').removeClass('highlighted');
	});
  return marker;
}

function drawSectionMarkerOnMap(location) {
	var position = new google.maps.LatLng(location.latitude, location.longitude, true);
	var markerDiv = $('<div class="marker-div animated-marker"></div>'),
	offset = new Object({x:0, y:0 }),
	marker = new SimpleMapOverlay(position,position,offset,markerDiv[0],map,false);
	marker.location = location;
	marker.setColor(SECTION_MARKER_COLOR);
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

function clearStorySectionsMarkersFromMap() {
	if (!storySectionsMarkerList) return;
	var markerList = storySectionsMarkerList.values();
	for (var i in markerList) {
		markerList[i].setMap(null);
	}
	storySectionsMarkerList.clear()
}

function hideAllStoriesMarkersFromMap() {
	if (!indexStoriesMarkerList) return;
	var markerList = indexStoriesMarkerList.values();
	for (var i in markerList) {
		markerList[i].setMap(null);
	}
}

function showAllStoriesMarkersFromMap() {
	if (!indexStoriesMarkerList) return;
	var markerList = indexStoriesMarkerList.values();
	for (var i in markerList) {
		markerList[i].setMap(map);
	}
}

/******************************************************************
	SAVE AND PUBLISH STORY
******************************************************************/

function saveStoryData(storydata,onFinished) {
  if (storydata.id != null) {
    stud_updateStory(storydata,function(st){
  		onFinished();
  	}, function() {
      saveError();
    });
  } else {
    stud_createStory(storydata,function(st){
  		onFinished();
  	}, function() {
      saveError();
    });
  }
}

function saveFinished(story) {
	$('#post-btn').attr('published-status',story.published)
	if (story.published > 0) {
		$('#post-btn').addClass('highlighted').text('Unpost');
	} else {
		$('#post-btn').removeClass('highlighted').text('Post');
	}
	if (indexStories == null) indexStories = [];
  updateStoryFromIndexList(story);
  //if position changes the marker must be updated
	if (story.location) {
		updateMarkerPosition(story)
	} else {
		if (indexStoriesMarkerList.get(story.id)) {
			indexStoriesMarkerList.get(story.id).setMap(null);
			indexStoriesMarkerList.remove(story.id);
		}
	}
  //drawLayout(indexStories);
	//closeStoryView({keepMapPosition:true});
}

function saveError() {
  displayAlertMessage('Posting Failed. Error while posting the story.')
}

function publishStory(storyid) {
	publishedstatus = parseInt($('#post-btn').attr('published-status'));
	if (publishedstatus > 0)
		publish = 0;
	else
		publish = parseInt($('#publish-options-dropdown').attr('publish-type'));
	saveStory(storyid,publish);
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
	LOG IN & SIGN UP
******************************************************************/

function openNeedLoginWarningModal() {
  $(".login-modal .login-alert-message, .signup-modal .signup-alert-message").hide();
  $("#login-email-input-2").val("")
  $("#login-password-input-2").val("")
  $('#need-login-warning-modal').modal('show');
}

function openLoginModal() {
  $("#login-email-input-1").val("")
  $("#login-password-input-1").val("")
  $(".login-modal .login-alert-message, .signup-modal .signup-alert-message").hide();
  $('#login-modal').modal('show');
}

function loginWithUserCredentials() {
  var username = $("#login-email-input-1").val() || $("#login-email-input-2").val(),
  password = $("#login-password-input-1").val() || $("#login-password-input-2").val();

  if (!username.includes("@")) {
    $('.login-modal .login-alert-message p').text("invalid email")
    $('.login-modal .login-alert-message').show();
    return;
  }

  if (password == null || password.length < 1) {
    $('.login-modal .login-alert-message p').text("invalid password")
    $('.login-modal .login-alert-message').show();
    return;
  }

  document.cookie = COOKIE_HISTORY_TAG + JSON.stringify(getStateObj()) + COOKIE_HISTORY_TAG;
  window.location.href = "/authenticate/userpass?username=" + username + "&password=" + password;
  //window.location.href = "/authenticate/userpass?username=jose@lostinreality.net&password=dc3mcdou";

  // $.ajax( {
	// 	url: "/authenticate/userpass?username=" + username + "&password=" + password,
	// 	type: 'GET',
	// 	contentType:"application/json",
	// 	success: function(data) {successLoggingIn()},
  //   error: function(error) {
  //     $('.login-modal .login-alert-message p').text("invalid credentials")
  //     $('.login-modal .login-alert-message').show();
  //   }
	// });
}

function loginWithFacebook() {
  document.cookie = COOKIE_HISTORY_TAG + JSON.stringify(getStateObj()) + COOKIE_HISTORY_TAG;
  window.location.href = "/authenticate/facebook"
  // $.ajax( {
	// 	url: "/authenticate/facebook",
	// 	type: 'GET',
  //   dataType: "json",
	// 	contentType:"application/json",
	// 	success: successLoggingIn(),
  //   error: function(error) {
  //     alert("ERROR: could not log in with Facebook. Try to log in on Facebook first and then try again.")
  //   }
	// });
}

function successLoggingIn() {
  $('#login-modal, #need-login-warning-modal').modal('hide');
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
    $('#login-link').css('display' , 'none' );
	});
}

function startSignup() {
  $('#login-modal, #need-login-warning-modal').modal('hide');
  $("#signup-email-input").val("")
  $(".login-modal .login-alert-message, .signup-modal .signup-alert-message").hide();
  $('#signup-modal').modal('show');
}

function sendSignupEmail() {
  document.cookie = "history=" + JSON.stringify(getStateObj()) + COOKIE_HISTORY_TAG;
  var email = $("#signup-email-input").val();
  if (!email.includes("@")) {
    $('.signup-modal .signup-alert-message p').text("invalid email")
    $('.signup-modal .signup-alert-message').show();
    return;
  }
  $.ajax( {
		url: "/signup?email=" + email,
		type: 'POST',
		success: function() {  $("#signup-modal .modal-body").empty().append('<p>Thank you! Please, now check your email inbox.</p>');}
	});
}
/******************************************************************
	SETTERS, GETTERS AND UPDATES
******************************************************************/

function updateStatsFromSmallContainer(story,noviews) {
  var storyviews = (noviews) ? noviews : story.noViews;
  $('#story-' + story.id + '.story-container.sm-container .story-stats-views').html(storyviews + ' views');
  $('#story-' + story.id + '.story-container.sm-container .story-stats-likes').html(story.noOfLikes + ' likes');
  $('#story-' + story.id + '.story-container.sm-container .story-stats-saves').html(story.noOfSaves + ' bookmarks');
}


function updateStoryFromIndexList(story) {
  for (var i in indexStories) {
    if (indexStories[i].id == story.id) {
      indexStories[i] = story;
			return;
    }
  }
	indexStories.push(story);
}

function updateMarkerPosition(story) {
	if (story.location == null) return;
	var position = new google.maps.LatLng(story.location.latitude, story.location.longitude, true)
	var marker = indexStoriesMarkerList.get(story.id)
	if (marker) {
	 marker.setPosition(position,position,true)
	 indexStoriesMarkerList.get(story.id).story = story;
 	} else {
		var marker = drawStoryMarkerOnMap(story)
		marker.story = story;
		indexStoriesMarkerList.put(story.id,marker)
	}
}

function setLayoutDimensions(stories) {
	var storiesListContainer = $("#story-grid-layout");

  // Set layout
	if (!stories || stories.length==0)
		noColumns = 0;
	else if (stories.length < 5)
		noColumns = 1
	else if (stories.length < 10)
		noColumns = 2
	else if (stories.length >= 10)
		noColumns = 3

	if (noColumns > MAX_NO_COLUMNS) noColumns = MAX_NO_COLUMNS;

	storiesGridListContainerWidth = noColumns*(COLUMN_WIDTH + COLUMN_MARGIN) + COLUMN_PADDING_LEFT + COLUMN_PADDING_LEFT;
	storiesListContainer.outerWidth(storiesGridListContainerWidth);
	if (isStoryViewOpen)
		$('#map-viewport').innerWidth(contentwidth-$("#story-large-layout").outerWidth());
	else
		$('#map-viewport').innerWidth(contentwidth-storiesGridListContainerWidth-GRID_LAYOUT_MARGIN_LEFT);
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

	// story large container body height
	var height = storyContainersWrapperHeight - $('#story-large-layout').css('padding-top').replace("px", "") - $('.lg-container .story-container-header').innerHeight();
	$('.lg-container .story-container-body').css('min-height',height + 'px');
	$('.lg-container .scrollable-content').css('height',height + 'px');

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

function setPasteBehaviour(element,preventReturn) {
	element.bind('paste', function(e) {
	  var pastedText = undefined;
	  if (e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) { // IE
	    pastedText = e.originalEvent.clipboardData.getData('Text');
	  } else if (e.clipboardData && e.clipboardData.getData) {
	    pastedText = e.clipboardData.getData('text/plain');
	  }
		document.execCommand("insertText", false, pastedText);
	  return false; // Prevent the default handler from running.
	})
	.keydown(function(e) {
    // trap the return key being pressed
    if (e.keyCode === returnKey) {
			if (preventReturn)
      	e.preventDefault();
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
    element[0].innerHTML = text.replace(/\n/g,'<br>').replace(/(^|\s)([#][a-z\d-]+)/ig, "$1<span class='hash-tag'>$2</span>");
  } else {
    element[0].innerText = text.replace(/(^|\s)([#][a-z\d-]+)/ig, "$1<span class='hash-tag'>$2</span>");
  }
}

function getStoryText(element) {
  if (element.hasClass('empty'))
    return "";
  //element.find('.placeholder')[0].remove();
  if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    return element[0].innerHTML.replace('<span class="hash-tag">'," ").replace('</span>'," ")
															 .replace(/<br>/g,'\n')
                               .replace(/&nbsp;/g,' ');

  }
  return element[0].innerText.replace('<span class="hash-tag">'," ").replace('</span>'," ");
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
  var imagesrc = $('.lg-container.single-story #story-picture').attr('src');
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

function updatePageHistory(story) {
	if (isStoryViewOpen) return;
	var center = getMapCenterOnLayout(map),
	zoom = map.getZoom();
	stateObj = {"latitude":center.lat(),"longitude":center.lng(),"zoom":zoom};
	if (story!=null && story.id!=null) {
		stateObj.story = story;
		if (editingMode) {
			var stateUrl = LIR_SERVER_URL + '/story/edit/' + story.id;
		} else {
			var stateUrl = LIR_SERVER_URL + '/story/read/' + story.id;
		}
		window.history.pushState(stateObj,"", stateUrl);
	} else {
		var stateUrl = LIR_SERVER_URL + '/location/' + center.lat() + ',' + center.lng() + ',' + zoom;
		stud_nominatimReverseGeoCoding(center.lat(),center.lng(),zoom, function(data) {
			if (!data.error) {
				var city = (data.address.city) ? data.address.city + ", " : "";
				// var state = (data.address.state) ? data.address.state + ", " : "";
				var country = (data.address.country) ? data.address.country : "";
				stateUrl = stateUrl + '&addr=' + data.display_name;
			} else {
				stateUrl = stateUrl + '&addr=' + "no+address+defined";
			}
			window.history.pushState(stateObj,"", stateUrl);
		}, function() {
			window.history.pushState(stateObj,"", stateUrl);
		})
	}
}

function getStateObj() {
	var center = getMapCenterOnLayout(map),
	zoom = map.getZoom(),
  stateObj = new Object();
	stateObj.location = {"latitude":center.lat(),"longitude":center.lng(),"zoom":zoom};
	if (story_!=null && story_.id!=null) {
		stateObj.storyid = story_.id;
	}
  return stateObj;
}

function getAddressNameOnEditingMode() {
	if (!editingMode) return;
	var center = getMapCenterOnLayout(map),
	zoom = map.getZoom();
	stud_nominatimReverseGeoCoding(center.lat(),center.lng(),zoom, function(data) {
		if (!data.error) {
			var city = (data.address.city) ? data.address.city + ", " : "";
			var country = (data.address.country) ? data.address.country : "";
			$(".single-story #story-location .location-name").text(city + country)
		} else {
			$(".single-story #story-location .location-name").text("Unknown location");
		}
	}, function() {
		$(".single-story #story-location .location-name").text("Unknown location");
	})
}

function openPageOnTarget(target) {
	console.log("opening storyid " + target.storyid);
	openStoryLayoutView();
	openingtarget = target;
}

function setUpOpeningTarget() {
	// If opening page with a story/location target
  if (openingtarget.location != null) {
    var loc = openingtarget.location
    fitPositionOnView(loc.latitude,loc.longitude,loc.zoom,map)
  }
  else {
    fitPositionOnView(DEFAULT_LATITUDE,DEFAULT_LONGITUDE,DEFAULT_ZOOM,map)
  }
  if (openingtarget.storyid) {
    stud_readStory(openingtarget.storyid, function(loadedstory) {
      var story = loadedstory;
      if (editingMode) {
        openStoryView(story,{editable:true,loadstoriesfirst:true});
      } else {
        openStoryView(story,{editable:false,loadstoriesfirst:true});
      }
      openingtarget = null;
    });
  } else {
    loadStories(null,function(stories) {
      drawLayout(stories);
      openingtarget = null;
    });
  }
}

function uploadImageToServer(onFinished) {
  var imageData = new FormData($('#image-upload-form')[0]);
  stud_uploadStoryImage(imageData,story.id,function(data) {
    console.log(data);
    if (onFinished) {
      onFinished(data);
    }
  });
}

/******************************************************************
	SERVER LINKS STUDS
******************************************************************/

function uploadStoryImage(storyId,onFinished) {
	url = '/story/uploadthumbnail/' +storyId;
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
		url: '/story/deleteimage/' +storyId,
		type: "DELETE",
    dataType: "json",
		success: success,
		error: error
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

function bookmarkStory(storyId, onFinished){
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
		url: "/story/delete/" + storyId,
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

function stud_nominatimReverseGeoCoding(lat,lng,zoom, success, error){
	$.ajax({
		url: "http://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=" + zoom + "&addressdetails=1",
		type: "GET",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_createStory(storydata,success, error){
	$.ajax({
		url: "/story/create/" + storydata.format,
		type: "POST",
		dataType: "json",
    data: JSON.stringify(storydata),
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_updateStory(storydata, success, error){
	$.ajax({
		url: "/story/update/" + storydata.id,
		type: "PUT",
		dataType: "json",
		data: JSON.stringify(storydata),
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

function stud_triggerstoryread(story,success) {
	$.ajax({
		url: "/story/read/trigger/" + story.id,
		type: 'PUT',
    dataType: "json",
		success: function(response) {  updateStatsFromSmallContainer(story,response.noOfViews)}
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

function stud_findTagsStaringWith(value,success) {
	$.ajax( {
		url: "/tagsstartingwith=" + value,
		type: 'GET',
		dataType: "json",
		contentType:"application/json",
		success: success
	});
}

function publisherCreateStory() {
	stud_publisherCreateStory()
}
