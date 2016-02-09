
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
    readStory();
	},
	function (){
		user = null
		$('#login-link, #stories-link').css('display' , 'block' );
    readStory();
	});
}

function readStory() {
  var storyId = document.URL.split("/story/")[1];
  stud_readStory(storyId,function(st) {
    initiateStoryMap(st);
    intializeEvents();
		$('#story-view #story-map-view').before(buildStoryView(st));
		$('[data-toggle="tooltip"]').tooltip();
		$('#story-view').css('opacity','1');
  }, function() {});
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
    iframesize = $('#open-story-view .article-container').height();
    $('#open-story-view  .vines-iframe').attr("width",iframesize)
                      .attr("height",iframesize);
	});
}

function buildStoryView(story) {
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
  buildArticleContainer(art,$('#story-view .story-container-body'),"large")
}

function removeArticleContainer() {
  $('#story-view .article-container').remove();
}

function buildArticleContainer(art,addToContainer,options) {
  var articleContainer = $('<div class="article-container"/>').appendTo(addToContainer);

  if (getHostFromUrl(art.url) == "vine.co") {
    buildVineContainer(art.url,articleContainer,options);
  } else if (getHostFromUrl(art.url) == "www.youtube.com") {
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

//--- initiateMap method ---//
function initiateStoryMap(story) {
	var mapOptions = {
		zoom : 16,
		streetViewControl: true,
		scrollwheel:false,
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

	var storylocation = new google.maps.LatLng(story.location.latitude, story.location.longitude, true);
	storyLocationMarker = new google.maps.Marker({
    position : storylocation,
    map : storymap,
    draggable : false
  });
	storymap.setCenter(storylocation);
}

function showStoryMap() {
  $('#story-view .story-container-body').hide();
  $('#story-view .story-location-view-container').show();
  initiateStoryMap();
}

function hideStoryMap() {
  $('#story-view .story-location-view-container').hide();
  $('#story-view .story-container-body').show();
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

function grabWebsiteMetadataReady() {
  isgrabWebsiteMetadataBusy = false;
}

function getHostFromUrl(url) {
	return url.split("//")[1].split("/")[0];
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

function stud_addUserToCollection(collectionId,numberId,success, error){
	$.ajax({
		url: "/collection/" + collectionId + "/adduser/" + numberId,
		type: "PUT",
		success: success,
		error: error
	});
}

function stud_readStory(storyId,success, error){
	$.ajax({
		url: "/story/read/" + storyId,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}
