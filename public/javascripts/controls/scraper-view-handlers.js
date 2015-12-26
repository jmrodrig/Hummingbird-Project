
// Get feeds from Feedly
var fdata;
var categoriesArray;
var itemsArray;
var itemHTML;

var map;
var story;
var storyTitle;
var domainStory = new Object();

var optionsMap = {
  count: 20,
  ranked: "oldest",  //newest or oldest
  unreadOnly: true
}

var optionsStrg = ""
for (var opt in optionsMap){
  optionsStrg = optionsStrg + opt + "=" + optionsMap[opt] + "&";
}

$(function() {
  $('#item-content').mouseup(function(e) {
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
          $('#item-content').append(floatingBox);
          // set buttons and events
          var buttonGroup = $('<div class="btn-group" role="group">');
          $('<button type="button" class="btn btn-default">Location</button>')
                                .click(function() {
                                  console.log(selectionText);
                                  geoCodeAddress(selectionText);
                                })
                                .appendTo(buttonGroup);
          $('<button type="button" class="btn btn-default">Title</button>')
                                .click(function() {
                                  console.log('resetTitleButton')
                                })
                                .appendTo(buttonGroup);
          buttonGroup.appendTo(floatingBox);
          // position buttons floating box
          var bounding = range.getClientRects()[0],
          offsetTop = $('#content-wrapper').position().top - $('#item-content-wrapper').scrollTop(),
          offsetLeft = $('#item-content-wrapper').position().left;
          floatingBox.css({ top: bounding.bottom - offsetTop, left: bounding.left-offsetLeft });
        }
      }
    }
  });
});

function geoCodeAddress(address) {
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      // var marker = new google.maps.Marker({
      //   map: map,
      //   position: results[0].geometry.location,
      //   title: address
      // });
      // build address options list
      if (results.length > 0) {
        var listLocations = $('<div class="list-group"></div>')
        results.forEach(function(r) {
          $('.btn-group').remove();
          $('<a href="#" class="list-group-item">' + r.formatted_address + '</a>')
                       .appendTo(listLocations)
                       .click(function(e) {
                         index = $(e.target).index();
                         map.setCenter(results[index].geometry.location);
                         $('.floating-box > button').removeAttr("disabled");
                       });
        });
        listLocations.appendTo($('.floating-box'));
        $('<button type="button" class="btn btn-success" disabled="disabled">Set Location</button>')
                        .click(function(e) {
                          index = $(e.target).index();
                          var marker = new google.maps.Marker({
                            map: map,
                            position: map.getCenter()
                          });
                          $('.floating-box').remove();
                        })
                        .appendTo($('.floating-box'));
      }

      } else {
      alert("Geocode was not successful for the following reason: " + status);
    }
  });
}

// stud_fetchFeedsAllCategories(function(data) {
//   categoriesArray = data
//   populateCategoriesList(categoriesArray)
//   // fetch items for the first category
//   stud_fetchFeedsItemsOfCategory(categoriesArray[0].id,optionsStrg,function(data){
//     itemsArray = data.items;
//     populateItemsList(data.items)
//     $('#categories-list a:first-child').addClass('active');
//   }, processError);
// }, processError);

fetchItemHTML("http://www.bbc.com/travel/story/20151123-the-last-king-of-ireland?ocid=global_travel_rss", function(article) {
  //$('#item-content-wrapper').text(item.alternate[0].href + '\n\n' + articleText);
  //bodyhtml = article.split('<body')[1].split('</body>')[0];
  $('#item-content').empty();
  console.log(article);
  $('#item-content').html(article.html);
});

function fetchItemHTML(url,onFinished) {
  stud_fetchFeedsItemHTML(url, function(data) {
    itemHTML = new Object(data);
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
                //$('#item-content-wrapper').html('');
                //$("#item-content").attr('src',item.origin.htmlUrl);
                fetchItemHTML(item.alternate[0].href, function(article) {
                  //$('#item-content-wrapper').text(item.alternate[0].href + '\n\n' + articleText);
                  //bodyhtml = article.split('<body')[1].split('</body>')[0];
                  $('#item-content').empty();
                  console.log(article);
                  $('#item-content').html(article.html);
                });
              });
  });
}


function extractTextFromHTML(html) {
  var prgrphs = html.split('<p');
  console.log(prgrphs.length);
  var paragraphs = [];
  for (var i = 1; i < prgrphs.length; i++) {
    var p = prgrphs[i];
    p = p.split('</p>',1)[0].split('>',1)[1];
    if (p.length > 0) {
      paragraphs.push(p);
      $('#item-content-wrapper').append('<p>' + p + '</p>');
    }
  };

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

function stud_fetchFeedsItemHTML(url,success, error){
	$.ajax({
		url: "/fetch/html/" + encodeURIComponent(url),
		type: "GET",
    dataType: "json",
		contentType:"application/json",
		success: success,
		error: error
	});
}

function saveStory() {

}



function initiateMap() {
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
}

//--- Listener for window ---//
google.maps.event.addDomListener(window, 'load', initiateMap);
