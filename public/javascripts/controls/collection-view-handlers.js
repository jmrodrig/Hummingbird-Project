
//--- initialize global variables ---//

var map;
var markercluster;

var storymap;
var article;
var saveimagefile = null;
var fr;

var collection;
var collectionStories;
var collectionStoriesMarkerList;

var defaultLocation;
var fitZoom;

var user = null;

var defaultAvatarPic = "/assets/images/user-avatar.jpg"

var markerIcon;

var editingMode = false;
var editingstory;

//--- initialize method ---//
function initialize() {

	//$('#blog-link').css('display' , 'block' );

  //TODO: set title in the server

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
    initiateMap();
    intializeEvents();
    initializeCollectionDetails();
    loadCollectionStories(col.id,function() {
      collectionStoriesMarkerList = drawCollectionMarkersOnMap(collectionStories,markerIcon);
			fitStoryOnView(collectionStoriesMarkerList.values(),map);
      drawLayout();
			$('#stories-container').css('opacity','1');
    });
  }, function() {});
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
      $('#collection-location-banner').removeClass('animate-transition collapsed-navbar');
    else
      $('#collection-location-banner').addClass('collapsed-navbar animate-transition');
  });

  $('#collection-location-banner').keypress(function(e) {
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
	});

  //remove STORY IMAGE
  $('#open-story-view #remove-story-image').click(function() {
    $('#open-story-view #story-image-container').hide();
    $('#open-story-view #story-image').attr('src','');
    saveimagefile = null;
  });

  //add ARTICLE LINK
  $('#open-story-view #story-add-link-button').click(function() {
    $('#open-story-view #story-insert-article').show();
  });

  //remove ARTICLE LINK
  $('#open-story-view #close-article-link').click(function() {
    $('#open-story-view #story-insert-article').hide();
    $('#open-story-view #article-link').val('');
    article = null;
    removeArticleContainer();
  });

  //STORY TEXT AREA: LOOK FOR URL AND SET ARTICLE
	$('#open-story-view #article-link').keyup(function() {
		txt = $(this).val();
		webUrl = getUrlFromText(txt);
		grabWebsiteMetadata(webUrl)
	});

  // ADD IMAGE FILE FOR STORY
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

  // COLLECTION IMAGE FILE
	$('#collection-edit-picture').change(function(ev) {
		saveimagefile = ev.target.files[0];
		var fileReader = new FileReader();

		fileReader.onload = function(ev2) {
			console.dir(ev2);
      //$('#collection-details-container').css('background-image','url(' + ev2.target.result + ')');
      uploadCollectionImage(collection.id, function(url) {
        $('#collection-details-img-container').css('background-image','url(' + url + ')');
      });
		};

		fileReader.readAsDataURL(saveimagefile);
		// fr = fileReader;
	});
}

function  initializeCollectionDetails() {
  if (collection.imageUrl)
    $('#collection-details-img-container').css('background-image','url(' + collection.imageUrl + ')');
  $('#collection-details-img-container').css({ height: $(window).innerHeight() - $('nav.navbar').height() });

  // Collection name and description
  $('#collection-name').val(collection.name);
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

  if (collectionBelongsToCurrentUser()) {
    $('#editing-opt-buttons').show();
  } else {
    $('#follow-collection-btn').show();
  }
}

function enableEditingMode() {
  editingMode = true;

  $('#editing-mode-off-btn').removeClass('btn-primary active');
  $('#editing-mode-on-btn').addClass('btn-primary active');
  $('#add-collection-authors-btn').show();
  $('#collection-name').removeAttr('readonly');
  $('#collection-description').attr('contenteditable', 'true');
	$('#collection-edit-picture-btn').addClass('enabled');
	loadStoryTextBehaviours($('#collection-description'));

  $('.story-container .option-remove').show();

  //Update events
  // COLLECTION NAME and DESCRIPTION UPDDATE
  $('#collection-name, #collection-description').focusout(function() {
    if (editingMode && collectionBelongsToCurrentUser()) {
      var name = $('#collection-name').val();
      var description = getStoryText($('#collection-description'));
      if (name != collection.name || description != collection.description) {
        collection.name = name;
        collection.description = description;
        stud_updateStoryCollection(collection,function() {},function() {alert('failed collection update')});
      }
    }
  });
}

function disableEditingMode() {
  editingMode = false;
  $('#editing-mode-on-btn').removeClass('btn-primary active');
  $('#editing-mode-off-btn').addClass('btn-primary active');
  $('.story-container .option-remove').hide();
  $('#collection-name').attr('readonly','readonly');
  unloadStoryTextBehaviours($('#collection-description'));
  $('#collection-name, #collection-description').unbind();
  $('#add-collection-authors-btn').hide();
	$('#collection-edit-picture-btn').removeClass('enabled');
}

function drawStoryItemOnMapView(story) {
  var mapViewStoryContainer = $('#collection-map-cover-left');
  mapViewStoryContainer.empty()
  var storyContainer = buildStorySmallContainer(story);
  storyContainer.appendTo(mapViewStoryContainer);
}

function clearHighlightedStoryFromMapView() {
  $('#collection-map-cover-left').empty();
}

function drawLayout() {
  drawStoryListLayout();
  // Initialize tooltips (helper popups)
  $('[data-toggle="tooltip"]').tooltip()
}

function drawStoryGridLayout() {
  var stories = collectionStories;

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

  // Add remaining Story Containers
  // var storiesinbounds = getStoriesWithinMapBounds(stories);
  // var storiesSortedByDate = sortStoriesWithDate(storiesinbounds);

  if(!stories || stories.length == 0) {
		$('#no-stories-message').show();
		return;
	} else
		$('#no-stories-message').hide();

  stories.forEach(function(story) {
    var storyContainer = buildStorySmallContainer(story);
    columnCommuter = (counter++ % noColumns) + 1;
    storyContainer.appendTo($('#column-' + columnCommuter));
  });
}

function drawStoryListLayout() {
  var stories = collectionStories;

  $('.story-container').remove();
	var storiesListContainer = $("#stories-list");

  if(!stories[0]) {
		$('#no-stories-message').show();
		return;
	} else
		$('#no-stories-message').hide();

  // Sort stories
  //var stories = getStoriesWithinMapBounds(stories);
  //var stories = sortStoriesWithDate(stories);

  stories.forEach(function(story) {
    var storyContainer = buildStoryLargeContainer(story);
    storyContainer.appendTo(storiesListContainer);
  });
}

function buildStorySmallContainer(story) {
  var storyContainer = $('<div/>').attr('id', 'story-' + story.id).attr('storyId', story.id)
            .addClass('story-container')
            .addClass('sm-container');

  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(storyContainer)
                                                                  .click(function() {
                                                                    if (storyBelongsToCurrentUser(story) && editingMode)
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
                                        openStoryView({edit:true, story:story});
                                      else
                                        openStoryView({readonly:true, story:story});
                                    });
  $('<li class="option-remove"><a href="#">Remove Story</a></li>').appendTo(optionsList)
                                            .click(function() {
                                              stud_removeStoryFromStoryCollection(story.id,collection.id, function(coll) {
                                                $('#collection-stat-stories #value').html(coll.noStories);
                                                removeStoryFromCollectionStoriesList(story);
                                                drawLayout();
                                              });
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

function buildStoryLargeContainer(story) {
  var storyContainer = $('<div/>').attr('id', 'story-' + story.id)
            .addClass('story-container')
            .addClass('lg-container');

  //Story container header
  var storyContainerHeader = $('<div class="story-container-header"/>').appendTo(storyContainer);
  //Story container body
  var storyContainerBody = $('<div class="story-container-body"/>').appendTo(storyContainer)
                                                                    .click(function() {
                                                                      if (storyBelongsToCurrentUser(story) && editingMode)
                                                                        openStoryView({edit:true, story:story});
                                                                      else
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
                                        openStoryView({edit:true, story:story});
                                      else
                                        openStoryView({readonly:true, story:story});
                                    });
  $('<li class="option-remove"><a href="#">Remove Story</a></li>').appendTo(optionsList)
                                            .click(function() {
                                              stud_removeStoryFromStoryCollection(story.id,collection.id, function(coll) {
                                                $('#collection-stat-stories #value').html(coll.noStories);
                                                removeStoryFromCollectionStoriesList(story);
                                                drawLayout();
                                              });
                                            });
  $('<li class="divider"></li>').appendTo(optionsList);
  $('<li> <a href="#">Add to</a></li>').appendTo(optionsList)
                                        .click(function() {
                                          openChooseCollectionView(story);
                                        });


  //Story location container
  var locationContainer = $('<div class="location-container"/>').appendTo(storyContainerHeader)
  var location = "";
  if (story.locationName && story.locationName.length > 0)
    location = story.locationName;
  $('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-15px flaticon-facebook30"></div>').appendTo(locationContainer);
  $('<p class="location">' + location + '</p>').appendTo(locationContainer);


  // Summary container
  if (story.summary && story.summary.length > 0) {
    var summaryContainer = $('<div class="summary-container collapsed"/>').appendTo(storyContainerBody);
    var summary = $('<p class="story-summary"></p>').appendTo(summaryContainer)
                                                    .text(story.summary);
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

  return storyContainer;
}

function buildLikeButton(story) {
  if (!user)
    return $('<button type="button" class="story-like-button btn btn-success" data-toggle="tooltip" data-placement="left" title="You need to login.">Like</button>')
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
  if (!user)
    return $('<a class="story-save-button btn btn-success" data-toggle="tooltip" data-placement="left" title="You need to login.">Save</a>')
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

function addArticleContainer(art) {
  removeArticleContainer();
  buildArticleContainer(art,$('#open-story-view .story-container-body'),{size:"large",autoplay:true})
}

function removeArticleContainer() {
  $('#open-story-view .article-container').remove();
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

function openStoryView(option) {
  resetStoryView();
  s = option.story;
  // Author Details
  if (option.edit == true | option.new == true) {
    var avatarUrl = (user.getAvatarUrl()) ? user.getAvatarUrl() : defaultAvatarPic;
    $('#open-story-view .story-author-name').text(user.getFullName())
    $('#open-story-view .story-author-thumbnail').css('background-image','url(' + avatarUrl + ')');
    loadStoryTextBehaviours($('#story-text'));
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
	$('#open-story-view').on('hidden.bs.modal',function() {
    resetStoryView();
    $('#open-story-view').unbind('hidden.bs.modal');
  });
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
}

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
    function() {alert('failed during collection creation')
  })
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

  defaultLocation = new google.maps.LatLng(37, -20);

  markerIcon = {
    url: "/assets/images/marker_icon.png",
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(13, 13)
  };

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

	map = new google.maps.Map(document.getElementById('collection-map-canvas'),mapOptions);

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
		// google.maps.event.addListener(map, 'dragend', drawLayout);
		// google.maps.event.addListener(map, 'zoom_changed', drawLayout);
    google.maps.event.addListener(map, 'click', clearHighlightedStoryFromMapView);
		google.maps.event.removeListener(listener);
	});

	//updateFocusedLocationName();

  //-- SearchBox --//
  var input = document.getElementById('collection-location-input');
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

function showStoryMap() {
  $('#open-story-view .story-container-body').hide();
  $('#open-story-view .story-set-location-view-container').show();
  initiateStoryMap();
}

function hideStoryMap() {
  $('#open-story-view .story-set-location-view-container').hide();
  $('#open-story-view .story-container-body').show();
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
function loadCollectionStories(collectionId,onFinished) {
  if (!user) {
    stud_readPublicCollectionStories(collectionId,function(s) {
      collectionStories = sortStoriesWithDate(s);
      if (onFinished)
        onFinished();
    });
  } else {
    stud_readCollectionStories(collectionId,function(s) {
      collectionStories = sortStoriesWithDate(s);
      if (onFinished)
        onFinished();
    });
  }
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

function formatArticleSource(art) {
  var s = art.source;
  if (!s)
    s = getHostFromUrl(art.url);
  if (s.split('.')[0] == 'www')
    return s.replace('www.','')
  else
    return s;
}

function storyBelongsToCurrentUser(story) {
  if (user && user.domainUser.id == story.author.id)
    return true;
  else
    return false;
}

function collectionBelongsToCurrentUser() {
  if (!user)
    return false;
  for (var i in collection.authors) {
    if (collection.authors[i].id == user.domainUser.id)
      return true;
  }
}

function removeStoryFromCollectionStoriesList(story) {
  index = collectionStories.indexOf(story);
  if (index > -1) {
    collectionStories.splice(index,1);
  }
  //remove marker
  removeMarkerForStoryInList(story,collectionStoriesMarkerList);
}

//--- drawPublishedStoryMarkersOnMap method ---//
function drawCollectionMarkersOnMap(stories,icon) {
  markerList  = new Hashtable();

  var st_;
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

function removeMarkerForStoryInList(story,list) {
  var marker = list.get(story.id);
  markercluster.removeMarker(marker);
  marker.setMap(null);
  list.remove(story.id);
}

function updateMarkerPosition(story) {
  var marker = collectionStoriesMarkerList.get(story.id);
  marker.setPosition(new google.maps.LatLng(story.location.latitude, story.location.longitude, true));
  marker.story = story;
}

function addStoryToCollection(storyId,collectionId) {
  stud_addStoryToStoryCollection(storyId,collectionId, function() {}, function() {alert('failed: Couldn\'t add story to collection')})
}

function getHostFromUrl(url) {
	return url.split("//")[1].split("/")[0];
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

function editStory() {
  hideStoryMap();

	if (!user) {
    alert('Failed to post. User not logged in.')
    return;
  }
  if ($('#open-story-view #story-map-location-input').val() == "" || storylocation == null) {
    alert('Failed to post. You must select a location.')
    return;
  }

  $('#story-publish-button').text('Posting...').attr('disabled','disabled');

  var story_ = newStoryObj(map);
	//set new story title
	story_.setTitle(editingstory.title);
	story_.setLocation(storylocation.latitude,storylocation.longitude);
  //set location name
  story_.setLocationName(locationName);
	story_.setSummary(getStoryText($('#open-story-view #story-text')));
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
  closeStoryView();
  updateStoryFromCollectionList(story)
  //if position changes the marker must be repositioned
  updateMarkerPosition(story);
  drawLayout();
}

function updateStoryFromCollectionList(story) {
  for (var i in collectionStories) {
    if (collectionStories[i].id == story.id) {
      collectionStories[i] = story;
    }
  }
}

function postingError() {
  $('#story-publish-button').text('Post').removeAttr('disabled');
  alert('Posting Failed. Error while posting the story.')
}

function hasImageToDelete(st) {
  var imagesrc = $('#open-story-view #story-image').attr('src');
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

function uploadStoryImage(storyId,onFinished) {
	url = '/story/'+storyId+'/uploadimage';
	var uploadImageForm = new FormData($('#open-story-view #image-upload-form')[0]);
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
