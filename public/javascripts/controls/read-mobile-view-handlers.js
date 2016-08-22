
/******************************************************************
	GLOBAL VARIABLES
******************************************************************/


var defaultAvatarPic = "/assets/images/user-avatar.jpg"
var defaultthumbnail = "/assets/images/lir_front.jpg"

var SECTION = 0,
LOCATION_SECTION = 1,
STORY_TEXT = 10,
PICTURE_CONTAINER = 11,
STORY_SUBTITLE = 12;

/******************************************************************
	INITIALIZATION
******************************************************************/

$(function() {
	drawStoryContent(story);
})

/******************************************************************
	DRAW AND CONTROL LAYOUTS
******************************************************************/


function drawStoryContent(story) {
	$('#story-body').html(buildStoryContent(story))
}



/******************************************************************
	BUILD STORY CONTENT
******************************************************************/

function buildStoryContent(story) {
	if (!story.author.avatarUrl)
		story.author.avatarUrl = defaultAvatarPic;
	if (!story.location.name)
		story.location.name = "(no location)";
	var contentElement = $("<div id='story-content'/>")
	var locationcontainer = $("<div class='location-banner'></div>");
	$('<span class="glyph-icon icon-no-margins icon-no-padding icon-12px flaticon-placeholder"/>').appendTo(locationcontainer);
	$("<p class='story-location'></p>").appendTo(locationcontainer).text(story.location.name);
	var storytitle = $('<p class="story-title"></p>').text(story.title);
	var authorcontainer = $("<div class='story-author-container'></div>");
	$("<div class='pull-left story-author-thumbnail'></div>").css('background-image','url(' + story.author.avatarUrl + ')').appendTo(authorcontainer);
	$("<p class='story-author'></p>").appendTo(authorcontainer).text(story.author.fullName);
	var storysummary = $('<p class="story-summary"></p>').text(story.summary);
	var statscontainer = $("<div class='story-stats-container'></div>");
	$('<span class="glyph-icon icon-no-margins icon-no-padding icon-12px flaticon-like"></div>').appendTo(statscontainer);
	$("<p class='story-likes'></p>").appendTo(statscontainer).text(story.noOfLikes);
	$('<span class="glyph-icon icon-no-margins icon-no-padding icon-12px flaticon-bookmark"></div>').appendTo(statscontainer);
	$("<p class='story-saves'></p>").appendTo(statscontainer).text(story.noOfSaves);
	var placeholderoverlay = $('<div class="placeholder-overlay"></div>');
	var detailsoverlay = $('<div class="details-overlay"></div>');
	var storythumbnailandcontainer = $('<div class="story-thumbnail-and-container"></div>').css('background-image','url(' + story.thumbnail + ')')
	detailsoverlay.append(locationcontainer);
	detailsoverlay.append(storytitle);
	detailsoverlay.append(authorcontainer);
	detailsoverlay.append(storysummary);
	detailsoverlay.append(statscontainer);
	storythumbnailandcontainer.append(placeholderoverlay);
	storythumbnailandcontainer.append(detailsoverlay);
	storythumbnailandcontainer.appendTo(contentElement);

	var storycontent = story.content;
	if (!storycontent) { return contentElement; }
	var sectioncounter = 0;
  storycontent.forEach(function(sectionObj) {
    if (sectionObj.type == LOCATION_SECTION) {
      var sectionElem = $("<div class='section location-section'/>").appendTo(contentElement);
      buildLocationBanner(sectionObj.location,sectioncounter).appendTo(sectionElem)
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
              buildPictureFrame(itemObj.link,itemObj.text,itemObj.position).appendTo(sectionElem);
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
              buildPictureFrame(itemObj.link,itemObj.text,itemObj.position).appendTo(sectionElem);
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

function buildLocationBanner(location,counter) {
	var locationBannerContainer = $('<div class="location-banner-container" contenteditable="false" />');
  var locationBanner = $('<div class="location-banner" contenteditable="false" />').appendTo(locationBannerContainer);
  $('<span class="location-icon glyph-icon icon-no-margins icon-12px flaticon-placeholder">').appendTo(locationBanner)
  var locationNameelem = $('<p class="location-name">' + location.name + '</p>').appendTo(locationBanner);
  return locationBannerContainer;
}

function buildPictureFrame(link,caption,pos) {
  var picContainer = $("<div class='section-item picture-container' readonly/>");
  var picFrame = $("<div class='picture-frame'/>").appendTo(picContainer);
  $('<img src=' + link + '>').appendTo(picFrame);
	$("<p class='picture-caption' contenteditable='false' readonly/>").text(caption).appendTo(picFrame);
  return picContainer;
}

/******************************************************************
	HANDLE BANNERS
******************************************************************/

function hideAppBanner() {
	$('#banner-app').hide();
}

/******************************************************************
	SERVER LINKS STUDS
******************************************************************/

function stud_readPublicStories(index, size, success, error){
	$.ajax({
		url: "/listpublicstories/" + index + "/" + size,
		type: "GET",
    dataType: "json",
		success: success,
		error: error
	});
}
