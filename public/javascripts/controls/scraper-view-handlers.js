
// Get feeds from Feedly
var fdata;
var categoriesArray;
var itemsArray;
var itemHTML;
var article;

var map;
var story = new Object();
var storyTitle;
var domainStory = new Object();
var locationMode = "single";
var stories = new Hashtable();
var mapLocationStories = new Hashtable();
var currentStoryId;

var isRemovingElements = false;
var isSelectingLocationContent = false;
var level;


var optionsMap = {
  count: 20,
  ranked: "newest",  //newest or oldest
  unreadOnly: true
}

var optionsStrg = ""
for (var opt in optionsMap){
  optionsStrg = optionsStrg + opt + "=" + optionsMap[opt] + "&";
}

// ----- INITIALIZATION ------//

$(function() {
  fetchFeeds();

  $('#article-content').mouseup(function(e) {
    if ($('.floating-box').has(e.target).length > 0)
      return;
    $('.floating-box').remove();
    if (window.getSelection) {
      var selection = window.getSelection();
      if (selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        var selectionText = range.toString();
        if (selectionText.length > 0) {
          // create floating box
          var floatingBox = $('<div class="floating-box" >');
          $('#article-content').append(floatingBox);
          // set buttons and events
          var buttonGroup = $('<div class="btn-group" role="group">');
          if (locationMode == "single") {
            $('<button type="button" class="btn btn-default">Location</button>')
                                  .click(function() {
                                    openAddLocationDialog(selectionText);
                                  })
                                  .appendTo(buttonGroup);
          } else if (locationMode == "multi") {
            $('<button type="button" class="btn btn-default">Add Location</button>')
                                  .click(function() {
                                    splitArticleForNewLocation(selection.getRangeAt(0));
                                  })
                                  .appendTo(buttonGroup);
          }
          $('<button type="button" class="btn btn-default">Date</button>')
                                .click(function() {
                                  openAddRuleDialog(selection.focusNode.parentNode,selectionText,"date");
                                })
                                .appendTo(buttonGroup);
          $('<button type="button" class="btn btn-default">Author</button>')
                                .click(function() {
                                  openAddRuleDialog(selection.focusNode.parentNode,selectionText,"author");
                                })
                                .appendTo(buttonGroup);
          buttonGroup.appendTo(floatingBox);
          // position buttons floating box
          var bounding = range.getBoundingClientRect(),
          offsetTop = $('#content-wrapper').position().top - $('#article-content-wrapper').scrollTop(),
          offsetLeft = $('#article-content-wrapper').position().left;
          floatingBox.css({ top: bounding.bottom - offsetTop, left: bounding.left-offsetLeft });
        }
      }
    }
  });
});

//------------ FUNCTIONS ----------//

function openAddRuleDialog(elm,selection,field) {
  $('.floating-box').empty();
  var fbox = $('.floating-box');
  $('<span>set rule for date</span>').text("set rule for date").appendTo(fbox);
  $('<p>').text($('<div>').append($(elm).clone()).html()).appendTo(fbox);
  $('<input id="strategy-in" type="text" placeholder="strategy"><input id="value-in" type="text" placeholder="value">').appendTo(fbox)
  $('<button type="button" class="btn btn-success">Set</button>').click(function() {
      if (field == "date") {
        article.date = selection;
        $('#article-content-date').html(article.date);
      }
      if (field == "author") {
        article.author = selection;
        $('#article-content-author').html(article.author);
      }
      $('.floating-box').remove();
    })
    .appendTo(fbox);
}

function openAddLocationDialog(address) {
  $('.floating-box').empty();
  $('<input id="location-in" type="text">')
        .appendTo($('.floating-box'))
        .val(address)
        .change(function() {
          address = $('.floating-box input').val()
          populateLocationDialog(address);
        });
  populateLocationDialog(address);
}

function populateLocationDialog(address) {


}

function fetchFeeds() {
  stud_fetchFeedsAllCategories(function(data) {
    categoriesArray = data
    populateCategoriesList(categoriesArray)
    // fetch items for the first category
    stud_fetchFeedsItemsOfCategory(categoriesArray[0].id,optionsStrg,function(data){
      itemsArray = data.items;
      populateItemsList(data.items)
      $('#categories-list a:first-child').addClass('active');
    }, processError);
  }, processError);
}
// fetchArticle("http://www.bbc.com/travel/story/20151123-the-last-king-of-ireland?ocid=global_travel_rss", function(a) {
//   article = a;
//   $('#article-content *').removeClass("highlight")
//                         .removeClass("toberemoved")
//                         .removeClass("hidecontent");
//   console.log(article);
//   $('#article-content-title').html(article.title);
//   $('#article-content-image').attr("src",article.imageUrl)
//   $('#article-content-description').html(article.description);
//   $('#article-content-author').html(article.author);
//   $('#article-content-date').html(article.date);
//   $('#article-content-source').html(article.source);
//   $('#article-content-source').attr("href",article.url);
//   $('#article-content-html').html(article.html);
// });

function fetchArticle(url,onFinished) {
  level = 1;
  stud_fetchArticle(url, function(data) {
    if (onFinished)
      onFinished(data)
  }, processError);
}

function populateCategoriesList(cArray) {
  cArray.forEach(function(item) {
    var listItemContainer = $('<a href="#" class="list-group-item">')
              .attr('id', 'item-' + item.id)
              .text(item.label)
              .appendTo('#categories-list')
              .click(function() {
                $('#categories-list .active').removeClass('active')
                listItemContainer.addClass('active')
                reloadItemsListWithCategory(item.id)
              });
  });
}

function reloadItemsListWithCategory(catId) {
  $('#item-list').empty();
  stud_fetchFeedsItemsOfCategory(catId,optionsStrg,function(data) {
    itemsArray = data.items;
    populateItemsList(data.items)
    //$("#content-wrapper").text(JSON.stringify(postData));
  }, processError);
}

function populateItemsList(iArray) {
  iArray.forEach(function(item) {
    var listItemContainer = $('<a href="#" class="list-group-item">')
              .attr('id', 'item-' + item.id)
              .text(item.title)
              .appendTo('#item-list')
              .click(function() {
                $('#item-list .active').removeClass('active')
                listItemContainer.addClass('active')
                fetchArticle(item.alternate[0].href, function(a) {
                  article = a;
                  $('#article-content *').removeClass("highlight")
                                        .removeClass("toberemoved")
                                        .removeClass("hidecontent");
                  console.log(article);
                  $('#article-content-title').html(article.title);
                  $('#article-content-image').attr("src",article.imageUrl)
                  $('#article-content-description').html(article.description);
                  $('#article-content-author').html(article.author);
                  $('#article-content-date').html(article.date);
                  $('#article-content-source').html(article.source);
                  $('#article-content-source').attr("href",article.url);
                  $('#article-content-html').html(article.html);
                });
              });
  });
}





function stud_fetchFeedsAllCategories(success, error){
	$.ajax({
		url: "/fetch/category",
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_fetchFeedsItemsOfCategory(category_id,options,success, error){
	$.ajax({
		url: "/fetch/category/" + encodeURIComponent(category_id) + "/" + options,
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_fetchFeedsItemDetails(item_id,success, error){
	$.ajax({
		url: "/fetch/item/" + encodeURIComponent(item_id),
		type: "GET",
		dataType: "json",
		contentType:"application/json",
		success: success,
		error: error,
	});
}

function stud_fetchArticle(url,success, error){
	$.ajax({
		url: "/fetch/html/" + encodeURIComponent(url),
		type: "GET",
    dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_fetchmoreArticle(url, level,success, error){
	$.ajax({
		url: "/fetch/html/" + encodeURIComponent(url) + "/" + level,
		type: "GET",
    dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function stud_setNewRule(jsonRule, success, error){
	$.ajax({
		url: "/rules/setRule",
		type: "POST",
    dataType: "json",
    data: JSON.stringify(jsonRule),
		contentType:"application/json",
		success: success,
		error: error
	});
}

function saveStory() {

}

function startRemoveElement() {
  if (isRemovingElements) {
    //finiching up
    isRemovingElements = false;
    $('#article-content *').unbind("mouseover")
                          .removeClass("highlight");
    $('#article-content').unbind("click");
    $("#remove-element-button").text("Clean content");
    return;
  }
  isRemovingElements = true;
  $("#remove-element-button").text("Stop cleaning");
  $('#article-content *').mouseover(
    function(e) {$('#article-content *').removeClass("highlight"); $(e.target).addClass("highlight"); console.log(e.target);}
  );
  $('#article-content').click(function(e) {
    $(e.target).addClass("hidecontent").addClass("toberemoved");
    var undoHideButton = $('<span class="control-remove-content glyph-icon icon-no-margins icon-shadow icon-small icon-round-borders flaticon-dark"></span> ').click(function() {
      $(e.target).removeClass("hidecontent").removeClass("toberemoved");
      undoHideButton.remove();
    });
    $(e.target).after(undoHideButton);
  });
}

function fetchmoreArticle() {
  level++;
  console.log(level);
  console.log("fetchmoreArticle...");
  stud_fetchmoreArticle(article.url, level, function(a) {
    console.log("done fetchmoreArticle");
    article.html = a.html;
    $('#article-content-html').html(a.html);
  }, processError);
}

function switchLocationMode(mode) {
  if (mode == "single") {
    locationMode = "single";
    $("#single-location-mode").removeClass("btn-default").addClass("btn-primary");
    $("#multi-location-mode").addClass("btn-default").removeClass("btn-primary");
    $("#add-location-buttons, #location-buttons").addClass("hidden");
  } else if (mode == "multi") {
    locationMode = "multi";
    $("#multi-location-mode").removeClass("btn-default").addClass("btn-primary");
    $("#single-location-mode").addClass("btn-default").removeClass("btn-primary");
    $("#add-location-buttons, #location-buttons").removeClass("hidden");
  }
}


function selectLocationContent() {
  if (isSelectingLocationContent) {
    //finiching up
    isSelectingLocationContent = false;
    $('#article-content *').unbind("mouseover")
    $('#article-content').unbind("click");
    //$("#remove-element-button").text("Clean content");
    return;
  }
  isSelectingLocationContent = true;
  //$("#remove-element-button").text("Stop cleaning");
  $('#article-content *').mouseover(function(e) {
    if ($(e.target).hasClass("control-add-location")) return;
    $('#article-content *').removeClass("highlight-location-content");
    $(e.target).addClass("highlight-location-content");
  });
  $('#article-content').click(function(e) {
    if ($(e.target).hasClass("selected-location")) return;
    if (!currentStoryId) {
      currentStoryId = 1;
      stories.put(currentStoryId,"story-" + currentStoryId);
      $('<button id="story-1" type="button" class="btn btn-default color-1">1</button>')
            .appendTo($("#location-buttons"))
            .click(function() {currentStoryId = 1});
    }
    $(e.target).addClass("selected-location").attr("story",currentStoryId).addClass(getStoryColorName(currentStoryId));
    var setLocationButton = $('<span class="control-add-location location-button glyph-icon icon-small icon-no-margins icon-round-borders icon-shadow  flaticon-facebook30"></span> ')
      .addClass(getStoryColorName(currentStoryId))
      .click(function() {
        var st = $(e.target).attr("story");
        setCurrentStoryId(st);
        $('#set-location-button').text('Set location for story ' + st)
                                  .addClass(getStoryColorName(st));
        stopSelectingLocationContent();
        console.log(st);
      });
    $(e.target).before(setLocationButton);
    var deselectLocationContentButton = $('<span class="control-add-location deselect-button glyph-icon icon-xsmall icon-no-margins icon-round-borders icon-shadow  flaticon-cross29"></span> ')
      .addClass(getStoryColorName(currentStoryId))
      .click(function() {
        var st = $(e.target).attr("story");
        $(e.target).removeClass("selected-location")
                   .removeClass(getStoryColorName(st))
                   .removeAttr("story");
        deselectLocationContentButton.remove();
        setLocationButton.remove();
      });
    $(e.target).after(deselectLocationContentButton);
  });
}

function stopSelectingLocationContent() {
  //finiching up
  isSelectingLocationContent = false;
  $('#article-content *').unbind("mouseover")
  $('#article-content').unbind("click");
  //$("#remove-element-button").text("Clean content");
}

function setLocation() {
  var location = map.getCenter();
  cStId = getCurrentStoryId()
  mapLocationStories.put(cStId,location);
  $('#set-location-button').text('Set location')
                            .removeClass(getStoryColorName(cStId));
  $('span[story="' + cStId + '"].')
}

function setCurrentStoryId(id) {
  currentStoryId = id;
}

function getCurrentStoryId() {
  return currentStoryId;
}

function newLocation() {
  var n = stories.size()+1;
  currentStoryId = n
  stories.put(currentStoryId,"story-" + currentStoryId);
  $('<button id="story-1" type="button" class="btn">' + currentStoryId + '</button>')
        .addClass(getStoryColorName(n))
        .appendTo($("#location-buttons"))
        .click(function() {
          console.log("currentStoryId: " + currentStoryId);
          console.log("n: " + n);
          currentStoryId = n
        });
}

function getStoryColorName(i) {
  var colornumber = (i % 6);
  return "color-" + colornumber;
}


function initAutocomplete() {
	var mapOptions = {
		zoom : 16,
		streetViewControl: false,
		streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
		panControl : false,
		panControlOptions : {position: google.maps.ControlPosition.RIGHT_CENTER},
		zoomControl : false,
		zoomControlOptions : {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		mapTypeControl : true,
		center : new google.maps.LatLng(38.711652, -9.131238)
	}

	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);

	//--- Map Event Handlers ---//
	var listener = google.maps.event.addListener(map, 'tilesloaded', function() {
		//google.maps.event.addListener(map, 'click', mapLeftClicked);
		google.maps.event.removeListener(listener);
	});


  //-- SearchBox --//
  var input = document.getElementById('location-in');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
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
  });
}

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initAutocomplete);
