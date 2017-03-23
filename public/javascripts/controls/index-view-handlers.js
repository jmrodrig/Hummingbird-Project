
/******************************************************************
	GLOBAL VARIABLES
******************************************************************/

var map;
var mapbox;
var autocompleteService;
var placeService;
var herosearchBox;
var hero5searchBox;
var mapsearchBox;
var story_;

var article;
var saveimagefile = null;
var uploadimagedata;

var defaultLocation = new google.maps.LatLng(37, -20);



var indexStories;
var storyLabels;
var indexStoriesMarkerList = new Hashtable();
var storySectionsMarkerList = new Hashtable();
var scrollSpyStoryMap = new Hashtable();
var currentStoryInViewport;
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

var loadingMoreStories = false;

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

var STORY_DETAILS_WIDTH = 500,
STORY_CONTAINER_HEIGHT = 700;

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
STORY_BOOKDATA = 14,
STORY_INSTAGRAM = 15,
DEFAULT_ZOOM = 3,
NO_VIEWPORT_ZOOM = 14,
INSTAGRAM_STORY = 4,
BOOKREF_STORY = 3,
ARTICLE_STORY = 2,
SINGLE_STORY = 1,
OPEN_STORY = 0,
DRAFT = 0,
PUBLISH_WITH_EVERYONE = 1,
PUBLISH_WITH_FOLLOWERS = 2,
PUBLISH_PRIVATELY = 3;

var SORTED_BY_RELEVANCE = 0,
SORTED_BY_LABEL = 1,
SORTED_BY_LOCATION = 2;

var DEFAULT_LATITUDE = 39.432031,
DEFAULT_LONGITUDE = -8.084700;

var SECTION_MARKER_COLOR = '#e808d7',
STORY_MARKER_COLOR = '#ff2c2c';

var COOKIE_HISTORY_TAG = "lir-15452345=";


/******************************************************************
	INITIALIZATION
******************************************************************/

$(function() {
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
    loadStoriesByRelevance(0,20,function() {
      loadStoriesOnLayout();
    })
	},
	function (){
		user = null
		$('#login-link, #stories-link').css('display' , 'block' );
    loadStoriesByRelevance(0,20,function() {
      loadStoriesOnLayout();
    })
	});
	intializeEvents();
});

function reloadStories(onFinished) {
  var noStories = parseInt($("#story-list").attr('noStories')),
  sortedBy = parseInt($("#story-list").attr('sortedBy'))
  switch (sortedBy) {
    case SORTED_BY_RELEVANCE:
      loadStoriesByRelevance(0,noStories,function() {
        if (onFinished) onFinished(stories);
      })
      return;
    case SORTED_BY_LABEL:
      var label = $("#story-list").attr('label')
      loadStoriesByLabel(label,0,noStories,function() {
        if (onFinished) onFinished(stories);
      })
      return;
    case SORTED_BY_LOCATION:
      var lat = $("#story-list").attr('lat'),
      lng = $("#story-list").attr('lng')
      loadStoriesByLocation(lat,lng,0,noStories,function() {
        if (onFinished) onFinished(stories);
      })
      return;
  }
}

function loadMoreStories() {
  if (loadingMoreStories) return;
  loadingMoreStories = true;
  var noStories = parseInt($("#story-list").attr('noStories')),
  sortedBy = parseInt($("#story-list").attr('sortedBy'))
  switch (sortedBy) {
    case SORTED_BY_RELEVANCE:
      addStoriesByRelevance(noStories+1,20,function(strs) {
        addStoriesToLayout(strs);
        resetScrollSpy();
        loadingMoreStories = false;
      })
      return;
    case SORTED_BY_LABEL:
      var label = $("#story-list").attr('label')
      addStoriesByLabel(label,noStories+1,20,function(strs) {
        addStoriesToLayout(strs);
        resetScrollSpy();
        loadingMoreStories = false;
      })
      return;
    case SORTED_BY_LOCATION:
      var lat = $("#story-list").attr('lat'),
      lng = $("#story-list").attr('lng')
      addStoriesByLocation(lat,lng,noStories+1,20,function(strs) {
        addStoriesToLayout(strs);
        resetScrollSpy();
        loadingMoreStories = false;
      })
      return;
  }
}

function loadStoriesByRelevance(index,noStories,onFinished) {
  stud_loadStories(index,noStories, function(stories) {
		indexStories = stories;
    $("#story-list").attr('noStories',indexStories.length)
    $("#story-list").attr('sortedBy',SORTED_BY_RELEVANCE)
    indexStories = readStoryContent(indexStories);
		if (onFinished) onFinished(stories);
  });
}

function loadStoriesByLabel(label,index,noStories,onFinished) {
  stud_loadStoriesByLabel(label,index,noStories, function(stories) {
    if (stories.length == 0 ) return;
		indexStories = stories;
    $("#story-list").attr('noStories',indexStories.length)
    $("#story-list").attr('sortedBy',SORTED_BY_LABEL)
    $("#story-list").attr('label',label)
    indexStories = readStoryContent(indexStories);
		if (onFinished) onFinished(stories);
  });
}

function loadStoriesByLocation(lat,lng,index,noStories,onFinished) {
  stud_loadStoriesByLocation(lat,lng,index,noStories, function(stories) {
    if (stories.length == 0 ) return;
		indexStories = stories;
    $("#story-list").attr('noStories',indexStories.length)
    $("#story-list").attr('sortedBy',SORTED_BY_LOCATION)
    $("#story-list").attr('lat',lat)
    $("#story-list").attr('lng',lng)
    indexStories = readStoryContent(indexStories);
		if (onFinished) onFinished(stories);
  });
}

function addStoriesByRelevance(index,noStories,onFinished) {
  stud_loadStories(index,noStories, function(stories) {
    if (stories.length == 0 ) return;
    stories = readStoryContent(stories);
    indexStories = indexStories.concat(stories);
    $("#story-list").attr('noStories',indexStories.length)
		if (onFinished) onFinished(stories);
  });
}

function addStoriesByLabel(label,index,noStories,onFinished) {
  stud_loadStoriesByLabel(label,index,noStories, function(stories) {
    if (stories.length == 0 ) return;
    stories = readStoryContent(stories);
    indexStories = indexStories.concat(stories);
    $("#story-list").attr('noStories',indexStories.length)
		if (onFinished) onFinished(stories);
  });
}

function addStoriesByLocation(lat,lng,index,noStories,onFinished) {
  stud_loadStoriesByLocation(lat,lng,index,noStories, function(stories) {
    if (stories.length == 0 ) return;
    stories = readStoryContent(stories);
    indexStories = indexStories.concat(stories);
    $("#story-list").attr('noStories',indexStories.length)
		if (onFinished) onFinished(stories);
  });
}

function loadStoriesOnLayout() {
  drawLayout();
  resetScrollSpy();
  var sid = getStoryIdOnViewport();
  updateMapLocation(sid);
  updateStoryMarkers();
  //intializeEvents();
}

function intializeEvents() {
  //--- MAIN LAYOUT DIMENSIONS ---//
	contentheight = $(window).innerHeight() - $('.lir-navbar').height();
	contentwidth = $('#content-wrapper').innerWidth();
  $('#content-wrapper').innerHeight(contentheight)
                       .css('margin-top',$('.lir-navbar').height());

	if ($(window).innerWidth() < 768) $('#content-wrapper').addClass('container-collapsed');

  //--- INITIALIZE MAP ---//
  initiateMapBox();

  //--- GOOGLE ANALYTICS TRACK EVENT ---//
	$(".ga-event-map-publish").click( function() {
		ga('send','event','map', 'publish') //Google Analytics track event
	});

	//--- PRESS ESCAPE ---//
	document.onkeydown = function(event) {
		if (event.keyCode == 27) {

		}
	}

  //--- HANDLE PAGE NAVIGATION ---//
	window.onpopstate = function(e){
    poppingWindowState = true;
    if(e.state){
      //se tem estado gravado

    } else {
			//não tem estado gravado
		}
	};

	$('#create-story-btn, #create-link').click(function() {
    closeCreateStoryPane();
		if (user)
			openCreateStoryPromptModal();
		else
      openNeedLoginWarningModal();
	});

  //--- PASTE TEXT ---//
	$("#create-edit-story-pane .story-text").bind('paste', function(e) {
	  var pastedText = undefined;
	  if (e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) { // IE
	    pastedText = e.originalEvent.clipboardData.getData('Text');
	  } else if (e.clipboardData && e.clipboardData.getData) {
	    pastedText = e.clipboardData.getData('text/plain');
	  }
		$(this).html(pastedText);
	  return false; // Prevent the default handler from running.
	});

  //--- HANDLE ALERT MESSAGE ON LOGIN/SIGNUP MODAL ---//
  $(".login-modal input, signup-modal input").on("keypress",function() {
    $(".login-modal .login-alert-message, .signup-modal .signup-alert-message").hide();
  });

  //--- HANDLE IMAGE UPDATE  ---//
  $("#create-edit-story-pane #story-image-url-input").change(function() {
    updateImageUrl();
  });

  //--- HANDLE ARTICLE UPDATE  ---//
  $("#create-edit-story-pane #story-url-input").change(function() {
    updateMetadataFromUrl();
  });

  //--- HANDLE BOOK SEARCH RESULTS UPDATE  ---//
  $("#create-edit-story-pane #search-query-input").keyup(function() {

  });

  $("#lir-navbar").click(function() {
    closeCreateStoryPane();
  })

  // SPY SCROLL: DOMMouseScroll WheelEvent
  $("#content-wrapper").bind("wheel", function(event) {
    var sid = getStoryIdOnViewport();
    if (sid != currentStoryInViewport) {
      updateMapLocation(sid);
      currentStoryInViewport = sid;
    }
    if ($("#content-wrapper").scrollTop() - $("#story-list").height() + $("#content-wrapper").height() == 0)
      loadMoreStories();
  })

  // LOAD LABELS
  loadLabels();

  //--- HANDLE SEARCH BAR INPUT  ---//
  autocompleteService = new google.maps.places.AutocompleteService();
  placesService = new google.maps.places.PlacesService($("#search-bar-input")[0]);
  $("#search-bar-input").keyup(function(event) {
    var sel = $("#search-bar ul li.selected");
    var query = $("#search-bar-input").val();
    switch (event.keyCode) {
      case 13: // return key pressed
        if (sel.length > 0) {
          closeCreateStoryPane();
          if (sel.attr('place_id'))
            loadStoriesByPlaceResult(sel.attr('place_id'));
          else if (sel.attr('label'))
            loadStoriesByLabelResult(sel.attr('label'));
        }
        break;
      case 38: // up arrow key pressed
        if (sel.length > 0) {
          sel.removeClass('selected')
          sel.prev().addClass('selected');
        }
        break;
      case 40: // down arrow key pressed
        if (sel.length == 0) {
          $("#search-bar ul li:first-child").addClass('selected');
        } else {
          sel.removeClass('selected');
          sel.next().addClass('selected');
        }
        break;
      case 39: // right arrow key pressed
      case 41: // left arrow key pressed
      default:
        hanbleSearchBarAutocompleteList(query);
    }
  });

  //--- HANDLE SEARCH BOOK  ---//
  $("#create-edit-story-pane #prompt #search-query-input").keyup(function(event) {
    var sel = $("#search-query-results li.selected");
    var query = $("#create-edit-story-pane #prompt #search-query-input").val();
    switch (event.keyCode) {
      case 13: // return key pressed
        event.preventDefault();
        if (sel.length > 0) {
          updateBookDataFromResult(JSON.parse(sel.attr('itemjson').replace(/&quot;/g,'"')))
        }
        break;
      case 38: // up arrow key pressed
        event.preventDefault();
        if (sel.length > 0) {
          sel.removeClass('selected')
          sel.prev().addClass('selected');
        }
        break;
      case 40: // down arrow key pressed
        event.preventDefault();
        if (sel.length == 0) {
          $("#search-query-results li:first-child").addClass('selected');
        } else {
          sel.removeClass('selected');
          sel.next().addClass('selected');
        }
        break;
      case 39: // right arrow key pressed
      case 37: // left arrow key pressed
        break;
      default:
        updateBookSearchResults(query);
    }
  });
}
/******************************************************************
	DRAW AND CONTROL LAYOUTS
******************************************************************/

function openCreateStoryPromptModal() {
	$('#create-story-prompt-modal').modal('show');
}

function openCreateStoryPane(format,storyid) {
  $('#create-story-prompt-modal').modal('hide');
  if (storyid) {
    var story = getStoryById(storyid,indexStories)
    format = story.format;
  }

  if (format != OPEN_STORY) {
    fillStoryDataOnLayout(format,story);
    initializeCreateStoryPane(format,story);
  }

  $("#create-edit-story-pane").addClass('open');
}

function closeCreateStoryPane() {
  $("#create-edit-story-pane #story-details > div").removeClass('open');
  $("#create-edit-story-pane").removeClass('open');
  destroyCreateStoryPane();
}

function initializeCreateStoryPane(format,story) {
  var map_container = $("#create-edit-story-pane #mapbox-canvas"),
  sb_input = $("#create-edit-story-pane #story-location-input");
  initiateCreateStoryMapBox(map_container);
  initiateSearchBox(mapbox_b,sb_input);
  $("#create-edit-story-pane #story-keywords-input").autocomplete({
    source:storyLabels
  });

  if (story && story.location) {
    mapbox_b.setCenter([story.location.longitude,story.location.latitude]);
    mapbox_b.setZoom(story.location.zoom);
    if (story.location.showpin) {
      var markerdiv = $('<span class="marker-mpb"></span>')[0];
      var marker = new mapboxgl.Marker(markerdiv,{offset:[-5,-5]})
        .setLngLat([story.location.longitude, story.location.latitude])
        .addTo(mapbox_b);
    }
  }
}

function destroyCreateStoryPane() {
  try {
    mapbox_b.remove();
    $("#create-edit-story-pane #story-keywords-input").autocomplete( "destroy" );
  } catch(error) {
    console.log(error);
  };
  $("#create-edit-story-pane #story-image-container iframe").remove();
  $("#create-edit-story-pane #story-image-container").removeAttr('instahtml');
  $("#create-edit-story-pane #story-keywords").text("");
  $("#create-edit-story-pane #story-source-icon").attr('src',"");
  $("#create-edit-story-pane input, #create-edit-story-pane textarea").val("");
  $("#create-edit-story-pane #single-story-details, #create-edit-story-pane #single-story-details , #create-edit-story-pane #bookref-story-details").addClass("collapsed");
  $("#create-edit-story-pane #prompt #search-query-input, #create-edit-story-pane #prompt #story-url-input").val("").hide();
  $("#create-edit-story-pane #prompt .loader").hide();
  $("#create-edit-story-pane #prompt #search-query-results").empty().hide();
}

function drawLayout() {
  $('#story-list').empty();
  for (i in indexStories) {
    var story = indexStories[i];
    if (buildStoryContainer(story))
      buildStoryContainer(story).appendTo($('#story-list'))
  }
  // $('.story-container').css('height',contentheight + 'px');
  // $('.story-thumbnail-container img').load(function() {
  //   setStoryCoverLayout($(this));
  // })
  instgrm.Embeds.process();
  setInstagramStoryCoverLayout();
}

function addStoriesToLayout(stories) {
  for (i in stories) {
    var story = stories[i];
    if (buildStoryContainer(story))
      buildStoryContainer(story).appendTo($('#story-list'))
  }
  instgrm.Embeds.process();
  setInstagramStoryCoverLayout();

  var sid = getStoryIdOnViewport();
  updateMapLocation(sid);
  updateStoryMarkers();
}

/******************************************************************
	BUILD STORY CONTAINER
******************************************************************/

function buildStoryContainer(story,options) {
	if (!options) {
		var options = {};
  }
  var storyContainer = $('<div class="story-container"/>').attr('id', 'story-' + story.id).attr('storyId', story.id);

  storyContainer.height(contentheight);

  switch (story.format) {
    case OPEN_STORY:
      storyContainer.addClass('open-story');
      return buildSingleAndOpenStoryContainer(story,storyContainer);
    case SINGLE_STORY:
      storyContainer.addClass('single-story');
      return buildSingleAndOpenStoryContainer(story,storyContainer);
    case ARTICLE_STORY:
      storyContainer.addClass('article-story');
      return buildArticleStoryContainer(story,storyContainer);
    case BOOKREF_STORY:
      storyContainer.addClass('bookref-story');
      if (!story.article) return null;
      return buildBookrefStoryContainer(story,storyContainer);
    case INSTAGRAM_STORY:
      storyContainer.addClass('instagram-story');
      return buildArticleStoryContainer(story,storyContainer);
    default:
      return storyContainer;
  }

}

/******************************************************************
	BUILD SINGLE STORY CONTAINER
******************************************************************/

function buildSingleAndOpenStoryContainer(story,storyContainer) {

  //Story container cover
  var storyContainerCover = $('<div class="story-container-cover"/>').appendTo(storyContainer)
                                                                     .click(function() {})
                                                                     .hover(function() {
                                                                     		//in
                                                                     	} , function() {
                                                                     		//out
                                                                     	});
  //Story container body
  var storyContainerBody = $('<div class="story-container-body  animate-transition"/>').appendTo(storyContainer)
                                                                  .click(function() {});

  //-------------------//
  //--- STORY COVER ---//
  //-------------------//

  var storyThumbnailContainer = $('<div class="story-thumbnail-container  animate-transition"/>').appendTo(storyContainerCover);
  var storyThumbnailImg = $('<img/>').attr('id', 'image-story-' + story.id).appendTo(storyThumbnailContainer);
  if (story.thumbnail && story.thumbnail.length > 0) {
    if (story.thumbnail.indexOf("http") == -1)
      story.thumbnail = PICTURES_SERVER_PATH + story.thumbnail;
    storyThumbnailImg.attr('src', story.thumbnail )
    //storyThumbnailContainer.css('background-image','url(' + PICTURES_SERVER_PATH + story.thumbnail + ')')
  }

  storyThumbnailImg.load(function() {
    setStoryCoverLayout($(this));
  });

  // STORY DETAILS
  buildStoryDetails(story).appendTo(storyContainerCover);

  //------------------//
  //--- STORY BODY ---//
  //------------------//

  buildStoryContent(story).appendTo(storyContainerBody);
  $("<a>close</a>").click(function() {$(this).parents(".story-container").removeClass('show-content')}).appendTo(storyContainerBody);

  //--------------------//
  //--- STORY FOOTER ---//
  //--------------------//

  buildStoryFooter(story).appendTo(storyContainer);


  return storyContainer;
}

/******************************************************************
	BUILD ARTICLE STORY CONTAINER
******************************************************************/

function buildArticleStoryContainer(story,storyContainer) {

  //Story container cover
  var storyContainerCover = $('<div class="story-container-cover"/>').appendTo(storyContainer)
                                                                     .click(function() {})
                                                                     .hover(function() {
                                                                     		//in
                                                                     	} , function() {
                                                                     		//out
                                                                     	});
  //Story container body
  var storyContainerBody = $('<div class="story-container-body  animate-transition"/>').appendTo(storyContainer)
                                                                  .click(function() {});

  //-------------------//
  //--- STORY COVER ---//
  //-------------------//

  var storyThumbnailContainer = $('<div class="story-thumbnail-container  animate-transition"/>').appendTo(storyContainerCover);

  switch (story.format) {
    case ARTICLE_STORY:
      var storyThumbnailImg = $('<img/>').attr('id', 'image-story-' + story.id)
                                         .appendTo(storyThumbnailContainer);
      if (story.article.imageUrl && story.article.imageUrl.length > 0) {
        storyThumbnailImg.attr('src', story.article.imageUrl )
      }
      storyThumbnailImg.load(function() {
        setStoryCoverLayout($(this));
      });
      break;
    case INSTAGRAM_STORY:
      storyThumbnailContainer.append(story.article.html);
      break;
  }


  // STORY DETAILS
  buildArticleDetails(story).appendTo(storyContainerCover);

  //------------------//
  //--- STORY BODY ---//
  //------------------//

  buildStoryContent(story).appendTo(storyContainerBody);
  $("<a>close</a>").click(function() {$(this).parents(".story-container").removeClass('show-content')}).appendTo(storyContainerBody);

  //--------------------//
  //--- STORY FOOTER ---//
  //--------------------//

  buildStoryFooter(story).appendTo(storyContainer);


  return storyContainer;
}

function buildBookrefStoryContainer(story,storyContainer) {

  //Story container cover
  var storyContainerCover = $('<div class="story-container-cover"/>').appendTo(storyContainer)
                                                                     .click(function() {})
                                                                     .hover(function() {
                                                                     		//in
                                                                     	} , function() {
                                                                     		//out
                                                                     	});
  //Story container body
  var storyContainerBody = $('<div class="story-container-body  animate-transition"/>').appendTo(storyContainer)
                                                                  .click(function() {});

  //-------------------//
  //--- STORY COVER ---//
  //-------------------//

  var storyThumbnailContainer = $('<div class="story-thumbnail-container  animate-transition"/>').appendTo(storyContainerCover);
  var storyThumbnailImg = $('<img/>').attr('id', 'image-story-' + story.id)
                                     .appendTo(storyThumbnailContainer);
  if (story.article.imageUrl && story.article.imageUrl.length > 0) {
    storyThumbnailImg.attr('src', story.article.imageUrl )
  }
  storyThumbnailImg.load(function() {
    setStoryCoverLayout($(this));
  });

  // STORY DETAILS
  buildBookrefDetails(story).appendTo(storyContainerCover);

  //------------------//
  //--- STORY BODY ---//
  //------------------//

  buildStoryContent(story).appendTo(storyContainerBody);
  $("<a>close</a>").click(function() {$(this).parents(".story-container").removeClass('show-content')}).appendTo(storyContainerBody);

  //--------------------//
  //--- STORY FOOTER ---//
  //--------------------//

  buildStoryFooter(story).appendTo(storyContainer);


  return storyContainer;
}

/******************************************************************
	BUILD STORY DETAILS
******************************************************************/

function buildStoryDetails(story) {
  var storyDetails = $('<div class="story-details animate-transition"/>');
  var storyDetailsInner = $('<div class="story-details-inner"/>').appendTo(storyDetails);
  // Story title
  if (story.title || story.title && story.title.length > 0) {
    var title = $('<p class="story-title"/>').appendTo(storyDetailsInner).text(story.title);
  }

  // Story author container
  var authorContainer = $('<div class="author-container"/>').appendTo(storyDetailsInner);

  // Story author thumbnail
  if (story.author.avatarUrl)
    avatarUrl = story.author.avatarUrl;
  else
    avatarUrl = defaultAvatarPic
  var authorThumbnail = $("<div class='story-author-thumbnail'></div>")
              .css('background-image','url(' + avatarUrl + ')')
              .appendTo(authorContainer)

  // Story author name
  var authorName = story.author.fullName;
  authorContainer.append('<a class="story-author-name" href="/profile/' + story.author.numberId + '">' + authorName +  '</a>');

  // Story description
  if (story.summary || story.summary && story.summary.length > 0) {
    var summaryContainer = $('<div class="summary-container"/>').appendTo(storyDetailsInner);
    var summary = $('<p class="story-summary"/>').appendTo(summaryContainer);
    if (story.summary.length > 400) {
      summary.text(story.summary.substring(0,399) + "... ").addClass("overflow")
      summary.append($("<a>(More)</a>").click(function() {$(this).parents(".story-container").addClass("show-content")}));
    } else {
      summary.text(story.summary)
    }
    //setStoryText(story.summary,summary);
  }

  // Story added date
  if (story.createdDate && story.createdDate.length > 0) {
    $('<br><p class="story-added-date">' + story.createdDate + '</p>').appendTo(storyDetailsInner);
  }

  if (story.labels && story.labels.length > 0) {
    var storyLabelsContainer = $('<div class="story-labels-container"/>').appendTo(storyDetailsInner);
    for (i in story.labels) {
      $("<span class='label'>" + story.labels[i] + "</span>").appendTo(storyLabelsContainer);
    }
  }

  // Stats: Views, Likes and Saves
  var storyStatsContainer = $('<div class="story-stats-container"/>').appendTo(storyDetailsInner);
  $('<div class="story-stats-views">' + story.noViews + ' views</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-likes">' + story.noOfLikes + ' likes</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-saves">' + story.noOfSaves + ' bookmarks</div>').appendTo(storyStatsContainer);

  return storyDetails;
}

/******************************************************************
	BUILD ARTICLE DETAILS
******************************************************************/

function buildArticleDetails(story) {
  var article = story.article;
  var storyDetails = $('<div class="story-details animate-transition"/>').click(function() {
                                                                //window.open(article.url)
                                                              });
  var storyDetailsInner = $('<div class="story-details-inner"/>').appendTo(storyDetails);
  // Story shared by container
  var sharedbyContainer = $('<div class="shared-by-container"/>').appendTo(storyDetailsInner);

  // Story publisher thumbnail
  if (story.author.avatarUrl)
    avatarUrl = story.author.avatarUrl;
  else
    avatarUrl = defaultAvatarPic
  var sharedbyThumbnail = $("<div class='story-shared-by-thumbnail'></div>")
              .css('background-image','url(' + avatarUrl + ')')
              .appendTo(sharedbyContainer)

  // Story shared-by name
  var sharedbyName = story.author.fullName;
  sharedbyContainer.append('<a class="story-shared-by-name" href="/profile/' + story.author.numberId + '">' + sharedbyName +  '</a>');


  // Article title
  if (article.title || article.title && article.title.length > 0) {
    var title = $('<p class="story-title"/>').appendTo(storyDetailsInner).text(article.title);
  }

  // Article description
  var summaryContainer = $('<div class="summary-container"/>').appendTo(storyDetailsInner);
  var summary = $('<p class="story-summary"/>').appendTo(summaryContainer);
  if (article.description.length > 250) {
    summary.text(article.description.substring(0,249) + "... ").addClass("overflow")
    summary.append($("<a>(More)</a>").click(function() {$(this).parents(".story-container").addClass("show-content")}));
  } else {
    summary.text(article.description)
  }
  //setStoryText(article.description,summary);

  // Article author
  $('<p class="article-author"/>').appendTo(storyDetailsInner).text(article.author);

  // Article source icon
  if (article.icon || article.icon && article.icon.length > 0) {
    $('<img class="article-icon"/>').appendTo(storyDetailsInner).attr('src',article.icon);
  } else if (story.format == INSTAGRAM_STORY) {
    $('<img class="article-icon"/>').appendTo(storyDetailsInner).attr('src','https://www.instagram.com/static/images/ico/favicon-192.png/b407fa101800.png');
  }

  // Article source
  $('<a class="article-source" href="' + article.url + '" />').appendTo(storyDetailsInner).text(article.source);

  // Article date
  if (article.date || article.date && article.date.length > 0) {
    $('<p class="article-date"/>').appendTo(storyDetailsInner).text(article.date);
  }

  if (story.labels && story.labels.length > 0) {
    var storyLabelsContainer = $('<div class="story-labels-container"/>').appendTo(storyDetailsInner);
    for (i in story.labels) {
      $("<span class='label'>" + story.labels[i] + "</span>").appendTo(storyLabelsContainer);
    }
  }

  // Stats: Views, Likes and Saves
  var storyStatsContainer = $('<div class="story-stats-container"/>').appendTo(storyDetailsInner);
  $('<div class="story-stats-views">' + story.noViews + ' views</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-likes">' + story.noOfLikes + ' likes</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-saves">' + story.noOfSaves + ' bookmarks</div>').appendTo(storyStatsContainer);

  return storyDetails;
}

/******************************************************************
	BUILD BOOKREF DETAILS
******************************************************************/

function buildBookrefDetails(story) {
  var article = story.article;
  var storyDetails = $('<div class="story-details  animate-transition"/>').click(function() {
                                                                window.open(article.url)
                                                              });
  var storyDetailsInner = $('<div class="story-details-inner"/>').appendTo(storyDetails);
  // Story shared by container
  var sharedbyContainer = $('<div class="shared-by-container"/>').appendTo(storyDetailsInner);
  // Story publisher thumbnail
  if (story.author.avatarUrl)
    avatarUrl = story.author.avatarUrl;
  else
    avatarUrl = defaultAvatarPic
  var sharedbyThumbnail = $("<div class='story-shared-by-thumbnail'></div>")
              .css('background-image','url(' + avatarUrl + ')')
              .appendTo(sharedbyContainer)

  // Story shared-by name
  var sharedbyName = story.author.fullName;
  sharedbyContainer.append('<a class="story-shared-by-name" href="/profile/' + story.author.numberId + '">' + sharedbyName +  '</a>');


  // Article title
  var title = $('<p class="story-title"/>').appendTo(storyDetailsInner).text(article.title);

  // Article description
  var summaryContainer = $('<div class="summary-container"/>').appendTo(storyDetailsInner);
  var summary = $('<p class="story-summary"/>').appendTo(summaryContainer);
  if (article.description.length > 300) {
    summary.text(article.description.substring(0,299) + "... ").addClass("overflow")
    summary.append($("<a>(More)</a>").click(function() {$(this).parents(".story-container").addClass("show-content")}));
  } else {
    summary.text(article.description)
  }
  //setStoryText(article.description,summary);

  // Article author
  $('<p class="article-author"/>').appendTo(storyDetailsInner).text(article.author);

  // Article publisher
  $('<a class="article-source" href="' + article.url + '" />').appendTo(storyDetailsInner).text(article.publisher);

  // Article date
  if (article.date || article.date && story.date.length > 0) {
    $('<br><p class="article-date"/>').appendTo(storyDetailsInner).text(article.date);
  }

  if (story.labels && story.labels.length > 0) {
    var storyLabelsContainer = $('<div class="story-labels-container"/>').appendTo(storyDetailsInner);
    for (i in story.labels) {
      $("<span class='label'>" + story.labels[i] + "</span>").appendTo(storyLabelsContainer);
    }
  }

  // Stats: Views, Likes and Saves
  var storyStatsContainer = $('<div class="story-stats-container"/>').appendTo(storyDetailsInner);
  $('<div class="story-stats-views">' + story.noViews + ' views</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-likes">' + story.noOfLikes + ' likes</div>').appendTo(storyStatsContainer);
  $('<div class="story-stats-saves">' + story.noOfSaves + ' bookmarks</div>').appendTo(storyStatsContainer);

  return storyDetails;
}

/******************************************************************
	SET STORY COVER LAYOUT
******************************************************************/

function setStoryCoverLayout(imageElem) {
  var storyContainerElem = imageElem.parents(".story-container");
  imageContainer = storyContainerElem.find(".story-thumbnail-container"),
  detailsContainer = storyContainerElem.find(".story-details"),
  c_w = imageContainer.width(),
  c_h = imageContainer.height(),
  h = imageElem.height(),
  w = imageElem.width();

  if (storyContainerElem.width() - contentheight < 400)
    storyContainerElem.addClass('extended')

  if (h < c_h || w < c_w || w/h < 1) {
    imageContainer.width(contentheight);
    detailsContainer.outerWidth(storyContainerElem.width() - contentheight);
    storyContainerElem.find(".story-container-cover").addClass('squared-layout');
    if (Math.round(Math.random()))
      storyContainerElem.find(".story-container-cover").addClass('left');
    else
      storyContainerElem.find(".story-container-cover").addClass('right');
  } else {
    storyContainerElem.find(".story-container-cover").addClass('cover-layout');
  }
  resizeCoverImage(imageElem);
}

function resizeCoverImage(imgElem) {
  var c_w = imgElem.parent().width(),
  c_h = imgElem.parent().height(),
  h = imgElem.height(),
  w = imgElem.width();
  if (w/h < 1 && h >= c_h) {
    imgElem.width(c_w);
    imgElem.css('top','50%')
    imgElem.css('margin-top',-c_w*h/w/2 + 'px')
  } else if (w >= c_w && w/h <= c_w/c_h) {
    imgElem.width(c_w);
    imgElem.css('top','50%')
    imgElem.css('margin-top',-c_w*h/w/2 + 'px')
  } else if (w >= c_w && w/h >= c_w/c_h) {
    imgElem.height(c_h);
    imgElem.css('left','50%')
    imgElem.css('margin-left',-c_h*w/h/2 + 'px')
  } else if (h < c_h || w < c_w) {
    imgElem.height(c_h);
    imgElem.css('left','50%')
    imgElem.css('margin-left',-c_h*w/h/2 + 'px')
  }
}

function setInstagramStoryCoverLayout() {
  $('.story-container.instagram-story .story-details').outerWidth($('.story-container').width() - contentheight);
  $('.story-container.instagram-story .story-thumbnail-container').outerWidth(contentheight);
  $('.story-container.instagram-story .story-container-cover').each(function() {
    if (Math.round(Math.random()))
      $(this).addClass('squared-layout left');
    else
      $(this).addClass('squared-layout right');
    if ($(this).width() - contentheight < 400)
      $(this).parents(".story-container").addClass('extended')
  })
}


/******************************************************************
	BUILD FOOTER
******************************************************************/

function buildStoryFooter(story) {
  var storyContainerFooter = $('<div class="story-container-footer"/>');
  // LIKE BUTTON
  buildLikeButton(story).appendTo(storyContainerFooter);
  // SAVE BUTTON
  buildSaveStoryButton(story).appendTo(storyContainerFooter);
  // EDIT BUTTON
  if (user && story.author.numberId == user.domainUser.numberId) {
    $('<button storyId= ' + story.id + ' class="story-edit-button btn btn-icon" ><span class="glyph-icon icon-no-margins icon-25px flaticon-draw"></button>')
      .appendTo(storyContainerFooter)
      .click(function() {
        openCreateStoryPane(null,$(this).attr('storyId'));
      });
  }

  return storyContainerFooter;
}

/******************************************************************
	BUILD STORY CONTENT
******************************************************************/

function buildStoryContent(story) {
  var contentElement = $("<div class='story-content'/>")
  switch (story.format) {
    case SINGLE_STORY:
    case INSTAGRAM_STORY:
    case BOOKREF_STORY:
    case ARTICLE_STORY:
      //contentElement.text(story.summary)
      setStoryText(story.summary,contentElement)
      break;
    case OPEN_STORY:
      contentElement.append(generateOpenStoryContent(story));
      break;
  }
  return contentElement;
}

function generateOpenStoryContent(story,options) {
  var contentElement = $("<div class='story-content'/>")
	var storycontent = story.content;
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
	BUILD MAP
******************************************************************/

function initiateMapBox() {
  mapbox = new mapboxgl.Map({
    container: $('#index-map-and-location-wrapper .mapbox-canvas')[0],
    style: 'mapbox://styles/jozie-blueyes/cj0f061hc00542spdx2513wo4',
    interactive: false
  });

  mapbox.on('load', function () {

  })
}

function updateMapLocation(storyid) {
  var story = getStoryById(storyid,indexStories);
  if (!story.location) {
    $("#location-name").hide();
    return;
  }
  mapbox.flyTo({
    center: [story.location.longitude,story.location.latitude],
    zoom: story.location.zoom
  })
  // mapbox.setCenter([story.location.longitude,story.location.latitude]);
  // mapbox.setZoom(story.location.zoom);
  if (story.location.name && story.location.name.length > 0)
    $("#location-name").show().text(story.location.name);
  else
    $("#location-name").hide();
}

function updateStoryMarkers() {
  for (i in indexStories) {
    var location = indexStories[i].location;
    if (location && location.showpin) {
      var markerdiv = $('<span class="marker-mpb"></span>')[0];
      var marker = new mapboxgl.Marker(markerdiv,{offset:[-5,-5]})
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapbox);
    }
  }
}

function addMarkerToMap(location,map) {

}

/******************************************************************
	BUILD CREATE SINGLE/ARTICLE STORY MODAL MAP
******************************************************************/

function initiateCreateStoryMapBox(map_canvas) {
  mapbox_b = new mapboxgl.Map({
    container: map_canvas[0],
    style: 'mapbox://styles/jozie-blueyes/cj0f061hc00542spdx2513wo4'
  });
}

function initiateSearchBox(map,inputElement) {
  var searchBox = new google.maps.places.SearchBox(inputElement[0]);
  //Bias the SearchBox results towards current map's viewport.

  // searchBox.setBounds(mapbox.getBounds());
  // mapbox.addListener('bounds_changed', function() {
  //   searchBox.setBounds(mapbox.getBounds());
  // });
  searchBox.addListener('places_changed', function() {
    searchBoxCenterMap(this,map);
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

/******************************************************************
	STORY CREATION HANDLERS
******************************************************************/

function fetchMetadataFromUrl(onFinished) {
  var url = $("#create-edit-story-pane #story-url-input").val();
  if (url.indexOf("www.instagram.com") > 0) {
    updateInstagramDataFromLink(url, function(data) {
      fillMetadataOnLayout(data);
      $("#create-edit-story-pane #story-image-container").attr('instahtml',data.html).append(data.html)
      instgrm.Embeds.process();
      if (onFinished) onFinished();
    });
  } else {
    stud_fetchHtml(url,function(data) {
      fillMetadataOnLayout(data);
      if (onFinished) onFinished();
    })
  }
}

function fillMetadataOnLayout(data) {
  $("#create-edit-story-pane #story-image-container").css('background-image','url(' + data.imageUrl + ')')
  $("#create-edit-story-pane #story-image-url-input").val(data.imageUrl)
  $("#article-story-details #story-title-input").val(data.title)
  $("#article-story-details #story-description-input").val(data.description)
  $("#article-story-details #story-author-input").val(data.author)
  $("#article-story-details #story-date-input").val(data.date)
  $("#article-story-details #story-source-icon").attr('src',data.icon)
  $("#article-story-details #story-source-input").val(data.source)
}

function updateMetadataFromUrl() {
  $("#create-edit-story-pane #prompt .loader").show();
  fetchMetadataFromUrl(function() {
    $("#create-edit-story-pane #prompt").addClass("collapsed");
    $("#create-edit-story-pane #prompt .loader").hide();
    $("#create-edit-story-pane #edit-story-container").removeClass("collapsed");
  });
}

function updateBookDataFromResult(bookinfo) {
  fillBookInfoOnLayout(bookinfo);
  $("#create-edit-story-pane #prompt").addClass("collapsed");
  $("#create-edit-story-pane #edit-story-container").removeClass("collapsed");
}

function updateBookSearchResults(query) {
  $("#create-edit-story-pane #prompt #search-query-results").hide();
  if (query == "") return;
  $("#create-edit-story-pane #prompt .loader").show();
  stud_fetchSearchBookResults(query, function(results) {
    $("#create-edit-story-pane #prompt .loader").hide();
    if (!results.items) return;
    var resultList = $("#create-edit-story-pane #prompt #search-query-results").empty().show();
    results.items.forEach(function(r) {
      var bookinfo = {
        url: r.volumeInfo.infoLink,
        imageUrl: (r.volumeInfo.imageLinks) ? r.volumeInfo.imageLinks.thumbnail : "",
        title: r.volumeInfo.title,
        description: r.volumeInfo.description,
        author: (r.volumeInfo.authors) ? r.volumeInfo.authors[0] : "",
        date: r.volumeInfo.publishedDate,
        publisher: r.volumeInfo.publisher
      }
      var label = bookinfo.title;
      if (bookinfo.author) label = label + ", " + bookinfo.author;
      $('<li itemjson="' + JSON.stringify(bookinfo).replace(/"/g,'&quot;') + '">' + label + '</li>')
                .click(function() { updateBookDataFromResult(JSON.parse($(this).attr('itemjson').replace(/&quot;/g,'"'))) })
                .hover(function() {
                  $("#create-edit-story-pane #prompt #search-query-results li").removeClass("selected");
                  $(this).addClass("selected");
                })
                .appendTo(resultList);
    })
  })
}

function updateInstagramDataFromLink(url,onFinished) {
  stud_fetchInstagramEmbedIframe(url, function(data) {
    var instainfo = {
      url: data,
      imageUrl: "",
      title: "",
      description: data.title,
      author: data.author_name,
      date: "",
      source: data.provider_name,
      html:data.html
    }
    if (onFinished) onFinished(instainfo);
  })
}

function updateImageUrl() {
  var imageurl = $("#create-edit-story-pane #story-image-url-input").val();
  $("#create-edit-story-pane #story-image-container").css('background-image','url(' + imageurl + ')')
}

function saveStory() {
  var storyid = $("#create-edit-story-pane #edit-story-container").attr('storyId'),
  format = parseInt($("#create-edit-story-pane #edit-story-container").attr('format')),
  storyData = new Object();

  storyData.summary = $("#create-edit-story-pane #story-description-input").val();
  storyData.thumbnail = $("#create-edit-story-pane #story-image-url-input").val();
  if (storyid) storyData.id = storyid;

  storyData.location = {
		name: $("#create-edit-story-pane #story-location-input").val(),
    latitude:mapbox_b.getCenter().lat,
    longitude:mapbox_b.getCenter().lng,
		zoom: mapbox_b.getZoom(),
		ismain:true,
    showpin: ($("#location-showpin:checked").length == 1) ? true : false,
    radius:0
  }

  storyData.labels = [];
  $("#create-edit-story-pane #story-keywords span").each(function() {
    storyData.labels.push($(this).text());
  });

	storyData.format = format;

  switch (format) {
    case SINGLE_STORY:
      storyData.content = JSON.stringify([{
        type:HEADER_SECTION,
        location:storyData.location
      }]);
      break;
    case ARTICLE_STORY:
      var articleItem = new Object();
      articleItem.author = $("#article-story-details #story-author-input").val()
      articleItem.date = $("#article-story-details #story-date-input").val()
      articleItem.source = $("#article-story-details #story-source-input").val()
      articleItem.url = $("#article-story-details #story-url-input").val()
      articleItem.title = $("#article-story-details #story-title-input").val();
      articleItem.description = $("#article-story-details #story-description-input").val();
      articleItem.imageUrl = $("#create-edit-story-pane #story-image-url-input").val();
      articleItem.icon = $("#create-edit-story-pane #story-source-icon").attr('src');
      storyData.content = JSON.stringify([{
        type:HEADER_SECTION,
        location:storyData.location,
        content:[{type:STORY_ARTICLE,text:JSON.stringify(articleItem)}]
      }]);
      break;
      case INSTAGRAM_STORY:
        var item = new Object();
        item.author = $("#article-story-details #story-author-input").val()
        item.source = $("#article-story-details #story-source-input").val()
        item.url = $("#article-story-details #story-url-input").val()
        item.description = $("#article-story-details #story-description-input").val();
        item.html = $("#create-edit-story-pane #story-image-container").attr('instahtml');
        storyData.content = JSON.stringify([{
          type:HEADER_SECTION,
          location:storyData.location,
          content:[{type:STORY_INSTAGRAM,text:JSON.stringify(item)}]
        }]);
        break;
    case BOOKREF_STORY:
      var bookItem = new Object();
      bookItem.author = $("#bookref-story-details #story-author-input").val()
      bookItem.date = $("#bookref-story-details #story-date-input").val()
      bookItem.publisher = $("#bookref-story-details #story-publisher-input").val()
      bookItem.url = $("#bookref-story-details #story-url-input").val()
      bookItem.title = $("#bookref-story-details #story-title-input").val();
      bookItem.description = $("#bookref-story-details #story-description-input").val();
      bookItem.imageUrl = $("#create-edit-story-pane #story-image-url-input").val();
      storyData.content = JSON.stringify([{
        type:HEADER_SECTION,
        location:storyData.location,
        content:[{type:STORY_BOOKDATA,text:JSON.stringify(bookItem)}]
      }]);
      break;
  }
  storyData.published = 1;

  saveStoryData(storyData,function() {
    reloadStories(function() {
      closeCreateStoryPane();
      loadStoriesOnLayout();
    })
  });
}

function deleteStory() {
  var storyid = $("#create-edit-story-pane #edit-story-container").attr('storyId')
  stud_deleteStory(storyid,function() {
    reloadStories(function() {
      closeCreateStoryPane();
      loadStoriesOnLayout();
    })
  })
}

function addNewKeyword() {
  newkw = $("#create-edit-story-pane #story-keywords-input").val();
  if (newkw.length > 0) {
    var tagspan = $("<span class='tag'>" + newkw + "</span>").click(function() { $(this).remove() })
    $("#create-edit-story-pane #story-keywords").append(tagspan);
  }
  $("#create-edit-story-pane #story-keywords-input").val("");
}

function addKeyword(kw) {
  var tagspan = $("<span class='tag'>" + kw + "</span>").click(function() { $(this).remove() })
  $("#create-edit-story-pane #story-keywords").append(tagspan);
}

function fillStoryDataOnLayout(format,story) {
  switch (format) {
    case SINGLE_STORY:
      $("#create-edit-story-pane #single-story-details").removeClass("collapsed");
      break;
    case INSTAGRAM_STORY:
      $("#create-edit-story-pane #edit-story-container").addClass("instagram-story");
    case ARTICLE_STORY:
      if (!story) {
        $("#create-edit-story-pane #prompt").removeClass("collapsed");
        $("#create-edit-story-pane #edit-story-container").addClass("collapsed");
        $("#create-edit-story-pane #prompt #story-url-input").show();
      }
      $("#create-edit-story-pane #article-story-details").removeClass("collapsed");
      break;
    case BOOKREF_STORY:
      if (!story) {
        $("#create-edit-story-pane #prompt").removeClass("collapsed");
        $("#create-edit-story-pane #edit-story-container").addClass("collapsed");
        $("#create-edit-story-pane #prompt #search-query-input").show();
      }
      $("#create-edit-story-pane #bookref-story-details").removeClass("collapsed");
      break;
  }


  $("#create-edit-story-pane #edit-story-container").attr('format',format)
  if (!story) return;
  $("#create-edit-story-pane #prompt").addClass("collapsed");
  $("#create-edit-story-pane #edit-story-container").removeClass("collapsed");

  $("#create-edit-story-pane #edit-story-container").attr('storyId',story.id);

  if (story.thumbnail && story.thumbnail.indexOf("http") == -1)
    story.thumbnail = PICTURES_SERVER_PATH + story.thumbnail;
  $("#create-edit-story-pane #story-image-url-input").val(story.thumbnail)
  $("#create-edit-story-pane #story-image-container").css('background-image','url(' + story.thumbnail + ')')


  if (story.labels.length > 0) {
    for (i = 0; i < story.labels.length; i++) {
      addKeyword(story.labels[i]);
    }
  }

  if (story.location) {
    $("#create-edit-story-pane #story-location-input").val(story.location.name)
    $("#create-edit-story-pane #location-showpin").prop('checked', story.location.showpin);
  }


  switch (format) {
    case ARTICLE_STORY:
      $("#article-story-details #story-url-input").val(story.article.url);
      $("#create-edit-story-pane #story-image-container").css('background-image','url(' + story.article.imageUrl + ')')
      $("#create-edit-story-pane #story-image-url-input").val(story.article.imageUrl)
      $("#article-story-details #story-title-input").val(story.article.title)
      $("#article-story-details #story-description-input").val(story.article.description)
      $("#article-story-details #story-author-input").val(story.article.author)
      $("#article-story-details #story-date-input").val(story.article.date)
      $("#article-story-details #story-source-icon").attr('src',story.article.icon)
      $("#article-story-details #story-source-input").val(story.article.source)
      break;
    case INSTAGRAM_STORY:
      $("#article-story-details #story-url-input").val(story.article.url);
      $("#article-story-details #story-description-input").val(story.article.description)
      $("#article-story-details #story-author-input").val(story.article.author)
      $("#article-story-details #story-source-icon").attr('src','https://www.instagram.com/static/images/ico/favicon-192.png/b407fa101800.png')
      $("#article-story-details #story-source-input").val(story.article.source)
      $("#create-edit-story-pane #story-image-container").attr('instahtml',story.article.html).append(story.article.html)
      instgrm.Embeds.process();
    case SINGLE_STORY:
      $("#single-story-details #story-description-input").val(story.summary)
      break;
    case BOOKREF_STORY:
      fillBookInfoOnLayout(story.article)
      break;
  }
}

function fillBookInfoOnLayout(bookinfo) {
  $("#bookref-story-details #story-url-input").val(bookinfo.url);
  $("#create-edit-story-pane #story-image-container").css('background-image','url(' + bookinfo.imageUrl + ')')
  $("#create-edit-story-pane #story-image-url-input").val(bookinfo.imageUrl)
  $("#bookref-story-details #story-title-input").val(bookinfo.title)
  $("#bookref-story-details #story-description-input").val(bookinfo.description)
  $("#bookref-story-details #story-author-input").val(bookinfo.author)
  $("#bookref-story-details #story-date-input").val(bookinfo.date)
  $("#bookref-story-details #story-publisher-input").val(bookinfo.publisher)
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

function saveError() {
  displayAlertMessage('Posting Failed. Error while posting the story.')
}

/******************************************************************
	READ STORY CONTENT
******************************************************************/

function readStoryContent(stories) {
  var readstories = stories;
  readstories.forEach(function(story) {
    if (story.content) {
      story.content = JSON.parse(story.content.replace(/&quot;/g,'"'));
      if (story.format == ARTICLE_STORY || story.format == BOOKREF_STORY || story.format == INSTAGRAM_STORY && story.content[0].content)
        story.article = JSON.parse(story.content[0].content[0].text.replace(/&quot;/g,'"'));
    }
  })
  return readstories;
}

/******************************************************************
	SEARCH BAR HANDLERS
******************************************************************/

function loadLabels(onFinished) {
  stud_loadLabels(function(results) {
    console.log(results);
    storyLabels = results;
    if (onFinished) onFinished();
  })
}

function hanbleSearchBarAutocompleteList(query) {
  if (query == "") {
    $("#search-results").hide();
    return;
  }
  autocompleteService.getPlacePredictions({ input: query }, function(results, status){
    if (status != google.maps.places.PlacesServiceStatus.OK) {
      console.log(status);
      return;
    }
    results = results.concat(filterStoryLabelsByExpression(query))
    if (results.length == 0) {
      $("#search-results").hide();
      return;
    }
    var ul = $("#search-results ul");
    ul.empty();
    results.forEach(function(result) {
      if (result.place_id)
        ul.append(buildPlaceSearchBarResult(result))
      else
        ul.append(buildLabelSearchBarResult(result))
      $("#search-results").show();
    });
  });
}

function buildPlaceSearchBarResult(place) {
  var li = $("<li place_id='" + place.place_id + "'><span class='glyph-icon icon-no-margins icon-no-padding icon-10px flaticon-location'></span><a>" + place.description + "</a></li>").click(function() {
    var placeId = $(this).attr('place_id');
    loadStoriesByPlaceResult(placeId);
  })
  return li;
}

function buildLabelSearchBarResult(label) {
  var li = $("<li label='" + label + "'><span class='glyph-icon icon-no-margins icon-no-padding icon-10px flaticon-favorite-1'></span><a>" + label + "</li>").click(function() {
    var label = $(this).attr('label');
    loadStoriesByLabelResult(label);
  })
  return li;
}

function filterStoryLabelsByExpression(expr) {
  var result = [];
  storyLabels.forEach(function(label) {
    if (label.indexOf(expr) > -1)
      result.push(label)
  })
  return result;
}

function loadStoriesByLabelResult(label) {
  $("#search-bar-input").val(label);
  loadStoriesByLabel(label,0,20, function() {
    $("#search-bar ul").empty();
    $("#search-results").hide();
    closeCreateStoryPane();
    loadStoriesOnLayout()
  })
}

function loadStoriesByPlaceResult(placeId) {
  placesService.getDetails({placeId:placeId},function(result, status){
    if (status != google.maps.places.PlacesServiceStatus.OK) {
      alert(status);
      return;
    }
    var lat = result.geometry.location.lat(),
    lng = result.geometry.location.lng();
    $("#search-bar-input").val(result.formatted_address);
    loadStoriesByLocation(lat,lng,0,20,function() {
      $("#search-bar ul").empty();
      $("#search-results").hide();
      closeCreateStoryPane();
      loadStoriesOnLayout();
    })
  })
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
  //document.cookie = COOKIE_HISTORY_TAG + JSON.stringify(getStateObj()) + COOKIE_HISTORY_TAG;
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

function getStoryById(storyId,list) {
	for (var i in list) {
    if (list[i].id == storyId)
      return list[i];
  }
}

/******************************************************************
	HELPERS
******************************************************************/

function resetScrollSpy() {
  scrollSpyStoryMap.clear();
  $('#story-list .story-container').each(function() {
    var storyContainer = $(this);
    scrollSpyStoryMap.put(storyContainer.position().top,storyContainer.attr('storyId'));
  })
}

function getStoryIdOnViewport() {
  var scrollpos = $("#content-wrapper").scrollTop();
  var ssarray = scrollSpyStoryMap.keys();
  for (var i in ssarray) {
    if (ssarray[i] - scrollpos <= 200) {
      return scrollSpyStoryMap.get(ssarray[i]);
    }
  }
}

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

function stud_deleteStory(storyId, success, error){
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

function stud_fetchInstagramEmbedIframe(link,onFinished) {
	$.ajax( {
	  url: '/fetchinstagram=' + encodeURIComponent(link),
	  type: 'GET',
	  dataType: "json",
	  success: onFinished
	} );
}

function stud_fetchSearchBookResults(query,onFinished) {
	$.ajax( {
	  url: 'https://www.googleapis.com/books/v1/volumes?q=' + query + '&projection=lite&maxResults=10',
	  type: 'GET',
	  dataType: "json",
	  success: onFinished
	} );
}

function stud_fetchBookInfo(id,onFinished) {
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

function stud_loadStories(index, limit, success, error){
	$.ajax({
		url: "/listpublicfollowingandprivatestories/" + index + "/" + limit, //listpublicstories, listpublicfollowingandprivatestories
		type: "GET",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_loadStoriesByLocation(lat, lng, index, limit, success, error){
	$.ajax({
		url: "/listpublicfollowingandprivatestoriesbylocation/" + lat + "/" + lng + "/" + index + "/" + limit,
		type: "GET",
    dataType: "json",
		success: success,
		error: error
	});
}

function stud_loadStoriesByLabel(label, index, limit, success, error){
	$.ajax({
		url: "/listpublicfollowingandprivatestoriesbylabel/" + label + "/" + index + "/" + limit,
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
