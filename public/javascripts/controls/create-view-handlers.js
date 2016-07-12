var STORY_TEXT = 10;
var PICTURE_CONTAINER = 11;


var ctrlDown = false,
        ctrlKey = 17,
        cmdKey = 91,
        vKey = 86,
        cKey = 67,
        returnKey = 13,
        backspacekey = 8,
        arrowUpKey = 38,
        arrowDownKey = 40,
        arrowLeftKey = 37,
        arrowRightKey = 39;


function getElementAtCursorPosition() {
  if (window.getSelection) {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var element = selection.getRangeAt(0).startContainer;
      if (element.nodeName == "#text") //if is a textnode
        element = element.parentNode;
    }
    console.log(element);
    return element;
  }
}

function getSectionAtCursorPosition() {
  var currentelement = getElementAtCursorPosition();
  if ($(currentelement).is('.section'))
    return currentelement;
  else {
    return $(currentelement).closest('.section')[0];
  }
}

function addSectionWithLocation() {
  var locationSection = $("<div class='section location-section'/>");
  buildMapContainer(location).appendTo(locationSection);
  var firstp = $('<p class="section-item story-text text-normal-size" />').appendTo(locationSection);
  locationSection.insertAfter($(getSectionAtCursorPosition()));
  resetCaretPositionOnElement(firstp[0],0);
}

function buildMapContainer(location) {
  var map;

  var locationBanner = $('<div class="location-banner" contenteditable="false" />');
  addLocationDataAttrOnElement(locationBanner,location)
  $('<span class="location-icon glyph-icon icon-no-margins icon-20px flaticon-placeholder">').appendTo(locationBanner)
  var locationNameelem = $('<p class="location-name">' + location.locationName + '</p>').appendTo(locationBanner);
  var deleteLocationBtn = $('<button type="button" class="delete-location close"><span>&times;</span></button>').appendTo(locationBanner);

  // map popover
  var mapContainer = $("<div class='map-container' contenteditable='false'/>");
  var mapelem = $('<div class="map-canvas"/>').appendTo(mapContainer);
  var mapcontrols = $('<div class="map-controls"/>').appendTo(mapContainer);
  var searchboxelem = $('<input class="location-search-box" placeholder="choose location">').appendTo(mapcontrols);
  searchboxelem.val(location.locationName);
  var cancelLocationSelection = $('<button class="cancel-location btn btn-default btn-icon"><span class="glyph-icon icon-no-margins icon-15px flaticon-close"></button></button>').appendTo(mapcontrols);
  var confirmLocationSelection = $('<button class="confirm-location btn btn-info btn-icon"><span class="glyph-icon icon-no-margins icon-15px flaticon-check"></button></button>').appendTo(mapcontrols);
  $('<div class="map-sight"/>').appendTo(mapContainer);


  locationBanner.popover({
    html: true,
    content: mapContainer,
    placement: 'bottom',
    animation: true,
    trigger: 'manual'
  })
    .on('shown.bs.popover', function () {
      var coords = new Object();
      coords.position = new google.maps.LatLng(location.latitude,location.longitude);
      coords.zoom = parseFloat(location.zoom);
      if (!map)
        map = initiateMap(mapelem[0],searchboxelem[0],coords);
  })

  locationNameelem.click(function() {
      locationBanner.popover('show');
  })

  cancelLocationSelection.click(function() {
    locationBanner.popover('hide');
  })

  confirmLocationSelection.click(function() {
    location.latitude = map.getCenter().lat();
    location.longitude = map.getCenter().lng();
    location.locationName = searchboxelem.val();
    location.zoom = map.getZoom();
    addLocationDataAttrOnElement(locationBanner,location);
    if (!map.marker)
      map.marker = new google.maps.Marker({map: map});
    map.marker.setPosition(new google.maps.LatLng(location.latitude,location.longitude));
    locationNameelem.text(location.locationName)
    locationBanner.popover('hide');
  })

  deleteLocationBtn.click(function() {
    deleteLocationSection(locationBanner.parent());
  })

  return locationBanner;
}

function deleteLocationSection(sectionNode) {
  sectionNode.find('.location-banner').remove();
  prevSection = sectionNode.prev();
  if (!prevSection || prevSection.hasClass('location-section') || prevSection.hasClass('title')) {
    sectionNode.removeClass('location-section')
  } else {
    sectionNode.children().each(function() {
      $(this).appendTo(prevSection);
    });
    sectionNode.remove();
  }
  updateSectionDistribution();
}

function updateSectionDistribution() {
  var sectionsNodes = $('#story-content').find('.section')
  sectionsNodes.each(function() {
    var _this = $(this);
    if (!_this.hasClass('location-section')) {
      var nextSectionSibling = _this.next();
      while (nextSectionSibling.length > 0 && !nextSectionSibling.hasClass('location-section')) {
        nextSectionSibling.children().appendTo(_this);
        nextSectionSibling = nextSectionSibling.next();
      }
    }
  });
  $(".section:empty").remove();
}

function addLocationDataAttrOnElement(element,location) {
  location.latitude = (location.latitude) ? location.latitude : 0;
  location.longitude = (location.longitude) ? location.longitude : 0;
  location.radius = (location.radius) ? location.radius : 0;
  location.zoom = (location.zoom) ? location.zoom : 0;
  location.locationName = (location.locationName) ? location.locationName : "choose location";

  element.attr('lat',location.latitude);
  element.attr('lng',location.longitude);
  element.attr('radius',location.radius);
  element.attr('zoom',location.zoom);
  element.attr('locationName',location.locationName);
}

function readLocationDataAttrOnElement(element) {
  var location = new Object();
  location.latitude = parseFloat(element.attr('lat'));
  location.longitude = parseFloat(element.attr('lng'));
  location.radius = parseFloat(element.attr('radius'));
  location.zoom = parseFloat(element.attr('zoom'));
  location.locationName = element.attr('locationName');
  return location;
}

function addSection() {
  var section = $("<div class='section'/>");
  var firstp = $('<p class="section-item story-text text-normal-size" />').appendTo(section);
  section.insertAfter($(getSectionAtCursorPosition()));
  resetCaretPositionOnElement(firstp[0],0);
}

function toggleTextSize() {
  var currentElement = getElementAtCursorPosition();
  $(currentElement).toggleClass("text-title-size");
}

function resetCaretPositionOnElement(el,offset) {
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart(el, offset);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  $(el).focus();
}

function resetCaretPosition() {
  var el = $("#story-content :first-child")[0];
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart(el, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  $(el).focus();
}

function buildPictureFrame(link,pos) {
  var picContainer = $("<div class='section-item picture-container' contenteditable='true'/>");
  var position = (pos) ? pos : "center"
  var picFrame = $("<div class='picture-frame' position='" + position + "' contenteditable='false'/>").appendTo(picContainer);
  $('<img src=' + link + '>').appendTo(picFrame);
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
  $("<p class='picture-caption' contenteditable='true'/>").appendTo(picFrame);
  return picContainer;
}

//--- initiateMap method ---//
function initiateMap(mapelem,searchboxelem,coords) {

	var mapOptions = {
		zoom : 2,
		streetViewControl: true,
		streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_CENTER},
    scaleControl : true,
		zoomControl : true,
		zoomControlOptions : {style: google.maps.ZoomControlStyle.LARGE, position: google.maps.ControlPosition.RIGHT_CENTER},
		mapTypeId : google.maps.MapTypeId.ROADMAP,
		mapTypeControl : true,
		mapTypeControlOptions : {style: google.maps.MapTypeControlStyle.DEFAULT, position: google.maps.ControlPosition.LEFT_BOTTOM},
	}

  var map = new google.maps.Map(mapelem,mapOptions);

  if (!coords) {
    var coords = new Object();
    coords.position = new google.maps.LatLng(37, -20);
    coords.zoom = 4;
  } else {
    map.marker = new google.maps.Marker({map: map, position:coords.position});
  }
  map.setZoom(coords.zoom);
  map.setCenter(coords.position);


  //-- SearchBox --//
  var searchBox = new google.maps.places.SearchBox(searchboxelem);
  // map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchboxelem);
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

  return map;
}

function isBeginingOfFirstChild() {
  if (window.getSelection) {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var element = selection.getRangeAt(0).startContainer;
      var offset = selection.getRangeAt(0).startOffset;
      var isCollapsed = selection.getRangeAt(0).collapsed;
      var firstchildOfCurrentSection = $(element).closest('.section :first-child')[0];
      if (element === firstchildOfCurrentSection && offset==0 && isCollapsed)
        return true;
    }
  }
  return false;
}

function isBeforePictureFrame() {
  var currentelement = getElementAtCursorPosition();
  if ($(currentelement).prev().is('.picture-container'))
    return $(currentelement).prev();
  return false;
}

function isCaretAtBegining() {
  if (window.getSelection) {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var offset = selection.getRangeAt(0).startOffset;
      var isCollapsed = selection.getRangeAt(0).collapsed;
      if (offset==0 && isCollapsed)
        return true;
    }
  }
  return false;
}

function convertStoryContentToObject() {
  var contentObject = [];
  $('.section').each(function() {
    var sectionObj = new Object();
    var _thissection = $(this);
    if (_thissection.hasClass('location-section')) {
      sectionObj.type = 'location-section';
      sectionObj.location = readLocationDataAttrOnElement(_thissection.find('.location-banner').first());
    } else {
      sectionObj.type = 'section';
    }
    sectionObj.content = [];
    _thissection.children().each(function() {
      var _thischild = $(this);
      var itemObj = new Object();
      if (_thischild.hasClass('story-text')) {
        itemObj.type = STORY_TEXT
        itemObj.text = _thischild.text();
      }
      if (_thischild.hasClass('picture-container')) {
        itemObj.type = PICTURE_CONTAINER
        itemObj.link = _thischild.find('img').attr('src')
        itemObj.position = _thischild.find('.picture-frame').attr('position')
      }
      if (_thischild.hasClass('media-container')) {
        itemObj.type = MEDIA_CONTAINER
        itemObj.link = _thischild.find('.media-frame').attr('src')
        itemObj.position = _thischild.find('.media-frame').attr('position');
      }
      if (_thischild.hasClass('ad-container')) {
        itemObj.type = MEDIA_CONTAINER
        itemObj.position = _thischild.find('.ad-frame').attr('position');
      }
      sectionObj.content.push(itemObj);
    });
    contentObject.push(sectionObj);
  });
  return contentObject;
}

/*------------------------
      image controls
-------------------------*/

function positionPictureFrame(position) {

}

function uploadImageToServer(onFinished) {
  var imageData = new FormData($('#image-upload-form')[0]);
  stud_uploadStoryImage(imageData,story.id,function(data) {
    console.log('picture-saved: ' + data);
    if (onFinished) {
      onFinished(data);
    }
  });
}

/*------------------------
      initialization
-------------------------*/

$(function() {
  $('#image-upload-input').change(function(ev) {
    var saveimagefile = ev.target.files[0];
    var fileReader = new FileReader();
    var cursorPosition = getElementAtCursorPosition();

    fileReader.onload = function(ev2) {
      uploadImageToServer(function(imageurl) {
        buildPictureFrame(imageurl).insertBefore(cursorPosition);
      });
    };
    fileReader.readAsDataURL(saveimagefile);

  });

  /* Set caret position at the firstchild of the article has the article is loaded */
  resetCaretPosition();

  // Overrides the return comand on the editable div
  $('div[contenteditable]').keydown(function(e) {
    // trap the return key being pressed
    if (e.keyCode === 13) {
      e.stopPropagation();
      var currentelement = getElementAtCursorPosition();
      if ($(currentelement).is('#story-content .title'))
        return false;
    }

    // trap the back key being pressed
    if (e.keyCode === 8) {
      e.stopPropagation();
      if (isBeginingOfFirstChild()) {
        return false;
      }
      if (isBeforePictureFrame() && isCaretAtBegining()) {
        isBeforePictureFrame().addClass('onfocus');
        return false;
      }
    }
  });

  readStoryDataAndLoadOnDOM(story)


  $(window).bind("wheel", function(event) {
		var scrollTop = $(window).scrollTop();
    $('#content-tools').css('top',scrollTop+200);
  });

  $(window).resize(function() {
		var scrollTop = $(window).scrollTop();
    $('#content-tools').css('top',scrollTop+200);
  });

  $('#story-content').mouseup(function(e) {
    $('#floating-new-location-section-button').remove();
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var range = selection.getRangeAt(0);
      if (!range.collapsed) {
        var floatingbutton = $('<button id="floating-new-location-section-button"/>');
        $('<span class="location-icon glyph-icon icon-no-margins icon-20px flaticon-placeholder">').appendTo(floatingbutton)
        floatingbutton.appendTo($('#content-wrapper'));
        floatingbutton.click(function() {
          addNewLocationSectionFromSelection(range);
          $('#floating-new-location-section-button').remove();
          selection.removeAllRanges();
        })
        var bounding = range.getBoundingClientRect(),
        top = bounding.bottom - $('#content-wrapper').offset().top + $(window).scrollTop(),
        left = bounding.left - $('#content-wrapper').offset().left + bounding.width/2 - 20;
        if (left < 0)
          left = 0
        else if (left > $(window).innerWidth() - 240)
          left = $(window).innerWidth() - 240;
        floatingbutton.css({ top:top, left:left});
      }
    }
  });

  $("#publish-link").click(function() {
    populateStoryDetailsButton();
    $('#story-details-modal').modal('show');
  })
});

function populateStoryDetailsButton() {
  var thumbnailscr = $(".picture-container img").first().attr("src"),
  storytitle = $("#title").text(),
  description = $(".story-text").first().text().substring(0,500)
  loc = readLocationDataAttrOnElement($(".location-banner").first()),
  $("#story-details-modal img#story-thumbnail").attr('src',thumbnailscr)
  $("#story-details-modal #story-title").text(storytitle)
  $("#story-details-modal #story-description").val(description)
  $("#story-details-modal #story-location").empty();
  buildLocationBannerForStoryDetailsModal(loc).appendTo($("#story-details-modal #story-location"))
  $("#story-details-modal #story-tags")
  $("#story-details-modal #story-external-link")
}

function toggleExternalLink() {
  if ($("#story-details-modal #external-link-checkbox")[0].checked) {
    $("#story-details-modal #story-external-link").removeAttr('disabled')
  } else {
    $("#story-details-modal #story-external-link").attr('disabled','')
  }
}

function nextThumbnailOnStoryDetailsModal() {
  changeThumbnailOnStoryDetailsModal('next')
}

function previousThumbnailOnStoryDetailsModal() {
  changeThumbnailOnStoryDetailsModal('previous')
}

function changeThumbnailOnStoryDetailsModal(direction) {
  var imagesrc=[],
  currentSrc = $("#story-details-modal img#story-thumbnail").attr('src');
  $(".picture-container img").each(function() {
    imagesrc.push($(this).attr('src'));
  });
  var index = imagesrc.indexOf(currentSrc);
  if (direction=="previous" && index > 0) {
    $("#story-details-modal img#story-thumbnail").attr('src',imagesrc[--index])
  } else if (direction=="next" && index < imagesrc.length-1) {
    $("#story-details-modal img#story-thumbnail").attr('src',imagesrc[++index])
  }
}

function buildLocationBannerForStoryDetailsModal(location) {
  var map;

  var locationBanner = $('<div class="location-banner" contenteditable="false" />');
  addLocationDataAttrOnElement(locationBanner,location)
  $('<span class="location-icon glyph-icon icon-no-margins icon-20px flaticon-placeholder">').appendTo(locationBanner)
  var locationNameelem = $('<p class="location-name">' + location.locationName + '</p>').appendTo(locationBanner);

  // map popover
  var mapContainer = $("<div class='map-container' contenteditable='false'/>");
  var mapelem = $('<div class="map-canvas"/>').appendTo(mapContainer);
  var mapcontrols = $('<div class="map-controls"/>').appendTo(mapContainer);
  var searchboxelem = $('<input class="location-search-box" placeholder="choose location">').appendTo(mapcontrols);
  searchboxelem.val(location.locationName);
  var cancelLocationSelection = $('<button class="cancel-location btn btn-default btn-icon"><span class="glyph-icon icon-no-margins icon-15px flaticon-close"></button></button>').appendTo(mapcontrols);
  var confirmLocationSelection = $('<button class="confirm-location btn btn-info btn-icon"><span class="glyph-icon icon-no-margins icon-15px flaticon-check"></button></button>').appendTo(mapcontrols);
  $('<div class="map-sight"/>').appendTo(mapContainer);


  locationBanner.popover({
    html: true,
    content: mapContainer,
    placement: 'bottom',
    animation: true,
    trigger: 'manual'
  })
    .on('shown.bs.popover', function () {
      var coords = new Object();
      coords.position = new google.maps.LatLng(location.latitude,location.longitude);
      coords.zoom = parseFloat(location.zoom);
      if (!map)
        map = initiateMap(mapelem[0],searchboxelem[0],coords);
  })

  locationNameelem.click(function() {
      locationBanner.popover('show');
  })

  cancelLocationSelection.click(function() {
    locationBanner.popover('hide');
  })

  confirmLocationSelection.click(function() {
    location.latitude = map.getCenter().lat();
    location.longitude = map.getCenter().lng();
    location.locationName = searchboxelem.val();
    location.zoom = map.getZoom();
    addLocationDataAttrOnElement(locationBanner,location);
    if (!map.marker)
      map.marker = new google.maps.Marker({map: map});
    map.marker.setPosition(new google.maps.LatLng(location.latitude,location.longitude));
    locationNameelem.text(location.locationName)
    locationBanner.popover('hide');
  })

  return locationBanner;
}

function addNewLocationSectionFromSelection(range) {
  var locationSection = $("<div class='section location-section'/>");
  buildMapContainer(location).appendTo(locationSection);
  var lastchild = $(range.endContainer).parents('.section-item')[0],
  child = $(range.startContainer).parents('.section-item')[0],
  parent = $(range.startContainer).parents('.section')[0],
  // grab selected nodes
  children = [child];
  while (child != lastchild) {
    child = child.nextSibling
    children.push(child)
    console.log(children);
  }
  // grab nodes after selection
  lastchild = parent.children[parent.children.length-1];
  var childrenAfterSelection = [child.nextSibling];
  while (child != lastchild) {
    child = child.nextSibling
    childrenAfterSelection.push(child)
    console.log(childrenAfterSelection);
  }
  // insert Selection nodes on a new section
  children.forEach(function(elem) {
    locationSection.append(elem);
  });
  if (locationSection.find('.story-text').length == 0)
    $('<p class="section-item story-text text-normal-size" />').appendTo(locationSection);
  locationSection.insertAfter($(parent));
  // insert remaining nodes after selection
  // on a new section after the previously
  // created section
  var remainingNodesSection = $("<div class='section'/>");
  childrenAfterSelection.forEach(function(elem) {
    remainingNodesSection.append(elem);
  });
  remainingNodesSection.insertAfter(locationSection);

  updateSectionDistribution();
}

function readStoryDataAndLoadOnDOM(story) {
  var contentElement = $('#story-content');
  $("#title").text(story.title);
  story.content.forEach(function(sectionObj) {
    if (sectionObj.type == "location-section") {
      var sectionElem = $("<div class='section location-section'/>").appendTo(contentElement);
      buildMapContainer(sectionObj.location).appendTo(sectionElem)
      if (sectionObj.content) {
        sectionObj.content.forEach(function(itemObj) {
          switch (itemObj.type) {
            case STORY_TEXT:
              $('<p class="section-item story-text text-normal-size">' + itemObj.text + '</p>').appendTo(sectionElem);
              break;
            case PICTURE_CONTAINER:
              buildPictureFrame(itemObj.link,itemObj.position).appendTo(sectionElem);
              break;
          }
        });
      } else {
        $('<p class="section-item story-text text-normal-size" />').appendTo(sectionElem);
      }
    } else {
      var sectionElem = $("<div class='section'/>").appendTo(contentElement);
      if (sectionObj.content) {
        sectionObj.content.forEach(function(itemObj) {
          switch (itemObj.type) {
            case STORY_TEXT:
              $('<p class="section-item story-text text-normal-size">' + itemObj.text + '</p>').appendTo(sectionElem);
              break;
            case PICTURE_CONTAINER:
              buildPictureFrame(itemObj.link,itemObj.position).appendTo(sectionElem);
              break;
          }
        });
      } else {
        $('<p class="section-item story-text text-normal-size" />').appendTo(sectionElem);
      }
    }
  });
}

function saveStoryOnServer(published) {
  var storycontent = convertStoryContentToObject();
  story.title = $("#title").text();
  story.summary = $("#story-details-modal #story-description").val();
  story.thumbnail = $("#story-details-modal img#story-thumbnail").attr('src');
  story.published = published;
  story.content = JSON.stringify(storycontent)
  var firstlocation = readLocationDataAttrOnElement($("#story-details-modal .location-banner"));
  story.locations = [firstlocation];
  // storycontent.forEach(function(sectionObj) {
  //   story.locations.push(sectionObj.location);
  // });

  story.labels = [];

  stud_updateStory(story, function(data) {
    console.log('story saved');
    console.log(data);
  });
}

function publishStory() {
  saveStoryOnServer(true);
}

function publishStory() {
  saveStoryOnServer(false);
}
