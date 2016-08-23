
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
		setTimeout(function() {
			$('#banner-intro').animate({opacity: .2}, 500,"easeOutQuart", function() {
				drawStoryList(stories);
				$("#stories-list").css('top',0);
			});
		},1000)
	});
})

function loadStories(onFinished) {
  stud_readPublicStories(0,20,function(stories) {
		indexStories = stories;
		if (indexStories.length == 0) displayAlertMessage('There are no stories published.');
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
	if (!story.locationName)
		story.locationName = "(no location)";
	var itemcontainer = $("<div class='story-item-container'></div>");
	var locationcontainer = $("<div class='location-container'></div>").appendTo(itemcontainer);
	$('<span class="glyph-icon icon-no-margins icon-no-padding icon-10px flaticon-placeholder"/>').appendTo(locationcontainer);
	$("<p class='story-location'></p>").appendTo(locationcontainer).text(story.locationName);
	var thumbnailcontainer = $("<div class='story-thumbnail-container'></div>").css('background-image','url(' + story.thumbnail + ')').appendTo(itemcontainer);
	var detailscontainer = $("<div class='story-details-container'></div>").appendTo(itemcontainer);
	$("<p class='story-title'></p>").text(story.title).appendTo(detailscontainer);
	var authorcontainer = $("<div class='story-author-container'></div>").appendTo(detailscontainer);
	$("<div class='pull-left story-author-thumbnail'></div>").css('background-image','url(' + story.author.avatarUrl + ')').appendTo(authorcontainer);
	$("<p class='story-author'></p>").appendTo(authorcontainer).text(story.author.fullName);
	$("<p class='story-summary'></p>").appendTo(detailscontainer).text(story.summary);
	var statscontainer = $("<div class='story-stats-container'></div>").appendTo(detailscontainer);
	$('<span class="glyph-icon icon-no-margins icon-no-padding icon-10px flaticon-like"></div>').appendTo(statscontainer);
	$("<p class='story-likes'></p>").appendTo(statscontainer).text(story.noOfLikes);
	$('<span class="glyph-icon icon-no-margins icon-no-padding icon-10px flaticon-bookmark"></div>').appendTo(statscontainer);
	$("<p class='story-saves'></p>").appendTo(statscontainer).text(story.noOfSaves);

	itemcontainer.click(function() {
		window.location.href = '/story/' + story.id;
	})
	return itemcontainer;
}

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
