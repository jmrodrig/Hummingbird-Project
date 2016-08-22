
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
	loadStories(function(stories) {
		drawStoryList(stories);
	});
})

function loadStories(onFinished) {
  stud_readPublicStories(0,20,function(stories) {
		indexStories = stories;
		if (indexStories.length == 0) displayAlertMessage('There are no stories here');
		if (onFinished) onFinished(stories);
  });
}

/******************************************************************
	DRAW AND CONTROL LAYOUTS
******************************************************************/


function drawStoryList(stories) {
	var storylistcontainer = $("#stories-list");
	stories.forEach(function(st) {
		storylistcontainer.append(buildStoryListItem(st));
	});
}



/******************************************************************
	BUILD SMALL CONTAINER
******************************************************************/

function buildStoryListItem(story) {
	if (!story.author.avatarUrl)
		story.author.avatarUrl = defaultAvatarPic;
	if (!story.thumbnail)
		story.thumbnail = defaultthumbnail;
	var itemcontainer = $("<div class='story-item-container'></div>");
	var locationcontainer = $("<div class='location-container'></div>").appendTo(itemcontainer);
	$('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-no-padding icon-10px flaticon-location"></div>').appendTo(locationcontainer);
	$("<p class='story-location'></p>").appendTo(locationcontainer).text(story.locationName);
	var thumbnailcontainer = $("<div class='pull-left story-thumbnail-container'></div>").css('background-image','url(' + story.thumbnail + ')').appendTo(itemcontainer);
	var detailscontainer = $("<div class='story-details-container'></div>").appendTo(itemcontainer);
	$("<h2 class='story-title'></h2>").text(story.title).appendTo(detailscontainer);
	var authorcontainer = $("<div class='story-author-container'></div>").appendTo(itemcontainer);
	$("<div class='pull-left story-author-thumbnail'></div>").css('background-image','url(' + story.author.avatarUrl + ')').appendTo(authorcontainer);
	$("<p class='story-author'></p>").appendTo(authorcontainer).text(story.author.fullName);
	$("<p class='story-summary'></p>").appendTo(itemcontainer).text(story.summary);
	var statscontainer = $("<div class='story-stats-container'></div>").appendTo(itemcontainer);
	$('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-no-padding icon-10px flaticon-location"></div>').appendTo(statscontainer);
	$("<p class='story-likes'></p>").appendTo(statscontainer).text(story.noOfLikes);
	$('<div class="pull-left"><span class="glyph-icon icon-no-margins icon-no-padding icon-10px flaticon-location"></div>').appendTo(statscontainer);
	$("<p class='story-saves'></p>").appendTo(statscontainer).text(story.noOfSaves);
	return itemcontainer;
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
