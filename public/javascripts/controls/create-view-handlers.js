
var SECTION = 0,
LOCATION_SECTION = 1,
HEADER_SECTION = 2,
STORY_TEXT = 10,
STORY_SUBTITLE = 12,
PICTURE_CONTAINER = 11,
DEFAULT_ZOOM = 4,
DEFAULT_LATITUDE = 39.432031,
DEFAULT_LONGITUDE = -8.084700;


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

var currentSelectedElement;

function initializeUser() {

	user = newUserObj();
	user.constructor();
	user.readLoggedUser(function (user){
		if (user.getAvatarUrl())
			avatarUrl = user.getAvatarUrl();
		else
			avatarUrl = defaultAvatarPic
		$('#user-link').html('<div/><span>' + user.getFullName() + '  <span class="caret"></span></span>')
						.css('display' , 'block' );

		$('#user-link div').css('background-image','url(' + avatarUrl + ')');
	},
	function (){
		user = null
		$('#login-link, #stories-link').css('display' , 'block' );
	});
}


function getElementAtCursorPosition() {
  if (window.getSelection) {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
      var element = selection.getRangeAt(0).startContainer;
      if (element.nodeName == "#text") //if is a textnode
        element = element.parentNode;
    } else {
      var element = currentSelectedElement;
    }
    console.log(element);
    if ($.contains( $('#story-content')[0],element  ))
      return element;
    else
      return null;
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

function addSectionAtCurrentPosition() {
  var section = $('<div class="section" contenteditable="true" section-id="' + Date.now() +'"/>');
  var firstp = $('<p class="section-item story-text text-normal-size" />').appendTo(section);
  var currentpositon = getSectionAtCursorPosition();
  if (currentpositon != null)
    section.insertAfter($(getSectionAtCursorPosition()));
  else
    section.appendTo($('#story-content'));
  resetCaretPositionOnElement(firstp[0],0);
  setSectionKeyListners(section);
  saveStoryOnServer();
}

function addSectionAtEnd() {
  var section = $('<div class="section" contenteditable="true" section-id="' + Date.now() +'"/>');
  var firstp = $('<p class="section-item story-text text-normal-size" />').appendTo(section);
  section.appendTo($('#story-content'));
  resetCaretPositionOnElement(firstp[0],0);
  setSectionKeyListners(section);
  saveStoryOnServer();
}

function addSectionWithLocation() {
  var locationSection = $("<div class='section location-section' section-id='" + Date.now() +"'/>");
  buildLocationBanner(location).appendTo(locationSection);
  var firstp = $('<p class="section-item story-text text-normal-size" />').appendTo(locationSection);
  locationSection.insertAfter($(getSectionAtCursorPosition()));
  resetCaretPositionOnElement(firstp[0],0);
  setSectionKeyListners(locationSection);
}

function removeSection(elem) {
  elem.remove();
}

function addLocationToCurrentSection() {
  var currentsection = getSectionAtCursorPosition();
  if (currentsection == null) return;
  currentsection = $(currentsection);
  if (currentsection.hasClass('location-section')) return;
  currentsection.addClass('location-section');
  var locationbanner = buildLocationBanner();
  currentsection.prepend(locationbanner);
}

function addPicture(imageUrl) {
  var cursorPosition = getElementAtCursorPosition();
  if (!cursorPosition) return;
  var pictureframe = buildPictureFrame(imageUrl).insertBefore(cursorPosition);
  if (!pictureframe[0].previousElementSibling || pictureframe[0].previousElementSibling.className.indexOf("story-text") == -1)
    $('<p class="section-item story-text text-normal-size" />').insertBefore(pictureframe);
  saveStoryOnServer();
}

function setSectionKeyListners(sectionelement) {
  sectionelement.keydown(function(e) {
    // trap the return key being pressed
    if (e.keyCode === returnKey) {}

    // trap the back key being pressed
    if (e.keyCode === backspaceKey) {
      var thissection = $(this);
      var currentElement = getElementAtCursorPosition();
      if (!currentElement.previousElementSibling || currentElement.previousElementSibling.className.indexOf("story-text") == -1) {
        if (currentElement.innerHTML.length == 0 || currentElement.innerHTML == "<br>") {
          e.preventDefault();
          currentElement.innerHTML = "";
          if (thissection[0].children.length == 1 && thissection[0].previousElementSibling != null)
            removeSection(thissection);
        }
      }
    }
  });
}

function toggleTextSize() {
  var currentElement = getElementAtCursorPosition();
  $(currentElement).toggleClass("text-title-size text-normal-size");
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
  var el = $("#story-content .story-text").last()[0];
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart(el, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  $(el).focus();
}

function buildLocationBanner(l) {
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

  var map;
  var locationBannerContainer = $('<div class="location-banner-container" contenteditable="false" />');
  var locationBanner = $('<div class="location-banner" contenteditable="false" />').appendTo(locationBannerContainer);
  addLocationDataAttrOnElement(locationBanner,location)
  $('<span class="location-icon glyph-icon icon-no-margins icon-15px flaticon-placeholder">').appendTo(locationBanner);
  var locationNameelem = $('<p class="location-name">' + location.name + '</p>').appendTo(locationBanner);
  var deleteLocationBtn = $('<button type="button" class="delete-location btn btn-default btn-no-background"><span class="location-icon glyph-icon icon-no-margins icon-10px flaticon-close"></button>').appendTo(locationBanner);

  // map popover
  var mapContainer = $("<div class='map-container' contenteditable='false'/>");
  var mapelem = $('<div class="map-canvas"/>').appendTo(mapContainer);
  var mapcontrols = $('<div class="map-controls"/>').appendTo(mapContainer);
  var searchboxelem = $('<input class="location-search-box" placeholder="choose location">').appendTo(mapcontrols);
  searchboxelem.val(location.name);
  var cancelLocationSelection = $('<button class="cancel-location btn btn-default btn-icon"><span class="glyph-icon icon-no-margins icon-15px flaticon-close"></button></button>').appendTo(mapcontrols);
  var confirmLocationSelection = $('<button class="confirm-location btn btn-info btn-icon"><span class="glyph-icon icon-no-margins icon-15px flaticon-check"></button></button>').appendTo(mapcontrols);
  $('<div class="map-sight"/>').appendTo(mapContainer);

  //Map popover layout
  var mapPopOverContainer = $("<div class='popover-container' contenteditable='false'/>").appendTo(locationBannerContainer);
  mapContainer.appendTo(mapPopOverContainer);

  locationBanner.click(function(e) {
    mapPopOverContainer.css('top',locationBanner.position().top + locationBanner.height());
    var coords;
    if (location.latitude != null) {
      coords = new Object();
      coords.position = new google.maps.LatLng(location.latitude,location.longitude);
      coords.zoom = parseFloat(location.zoom);
    }

    if (!map)
      map = initiateMap(mapelem[0],searchboxelem[0],coords);
    mapPopOverContainer.toggleClass('open');
  })

  cancelLocationSelection.click(function(e) {
    mapPopOverContainer.removeClass('open');
  })

  confirmLocationSelection.click(function(e) {
    location.latitude = map.getCenter().lat();
    location.longitude = map.getCenter().lng();
    location.name = searchboxelem.val();
    location.zoom = map.getZoom();
    addLocationDataAttrOnElement(locationBanner,location);
    if (!map.marker)
      map.marker = new google.maps.Marker({map: map});
    map.marker.setPosition(new google.maps.LatLng(location.latitude,location.longitude));
    locationNameelem.text(location.name)
    mapPopOverContainer.removeClass('open');
  })

  deleteLocationBtn.click(function() {
    deleteLocationSection(locationBannerContainer.parent());
  })

  return locationBannerContainer;
}

function deleteLocationSection(sectionNode) {
  sectionNode.find('.location-banner-container').remove();
  sectionNode.removeClass('location-section')
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
  element.attr('id',location.id);
  element.attr('lat',location.latitude);
  element.attr('lng',location.longitude);
  element.attr('radius',location.radius);
  element.attr('zoom',location.zoom);
  element.attr('locationName',location.name);
  element.attr('showpin',location.showpin);
  element.attr('ismain',location.ismain);
}

function readLocationDataAttrOnElement(element) {
  if (element == null) return null;
  var location = new Object(),
  id = parseInt(element.attr('id')),
  latitude = parseFloat(element.attr('lat')),
  longitude = parseFloat(element.attr('lng')),
  radius = parseFloat(element.attr('radius')),
  zoom = parseFloat(element.attr('zoom')),
  name = element.attr('locationName'),
  showpin = element.attr('showpin'),
  ismain = element.attr('ismain');

  location.id = (!isNaN(id)) ? id : null;
  location.latitude = (!isNaN(latitude)) ? latitude : null;
  location.longitude = (!isNaN(longitude)) ? longitude : null;
  location.radius = (!isNaN(radius)) ? radius : 0;
  location.zoom = (!isNaN(zoom)) ? zoom : null;
  location.showpin = (showpin) ? showpin : false;
  location.ismain = (ismain) ? ismain : false;
  location.name = (name) ? name : "(choose location)";
  return location;
}

function buildPictureFrame(link,pos,caption) {
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
  $("<p class='picture-caption' contenteditable='true'/>").text(caption).appendTo(picFrame);
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
    coords.position = new google.maps.LatLng(DEFAULT_LATITUDE, DEFAULT_LONGITUDE);
    coords.zoom = DEFAULT_ZOOM;
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

/*------------------------
      image controls
-------------------------*/

function positionPictureFrame(position) {

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

function uploadStoryThumbnailToServer(onFinished) {
  var imageData = new FormData($('#cover-upload-form')[0]);
  stud_uploadStoryThumbnail(imageData,story.id,function(data) {
    console.log(data);
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
      uploadImageToServer(function(data) {
        addPicture(data.imageUrl)
      });
      $("#image-upload-input").replaceWith($("#image-upload-input").val('').clone(true));
    };
    fileReader.readAsDataURL(saveimagefile);
  });

  $('#cover-upload-input').change(function(ev) {
    var saveimagefile = ev.target.files[0];
    var fileReader = new FileReader();
    var cursorPosition = getElementAtCursorPosition();

    fileReader.onload = function(ev2) {
      uploadStoryThumbnailToServer(function(data) {
        addCover(data.imageUrl)
      });
      $("#cover-upload-input").replaceWith($("#cover-upload-input").val('').clone(true));
    };
    fileReader.readAsDataURL(saveimagefile);
  });

  readStoryDataAndLoadOnDOM(story);
  /* Set caret position at the firstchild of the article has the article is loaded */
  resetCaretPosition();

  // Overrides the return comand on the editable div
  $('#story-content div[contenteditable]').each(function( index ) {
    setSectionKeyListners($( this ));
  });

  $('#story-header #story-summary').keydown(function(e) {
    // trap the return key being pressed
    if (e.keyCode === returnKey) {
      e.preventDefault();
    }
    // limit the number of characters
    if ($(this).text().length > 180 && !(e.keyCode === backspaceKey || e.keyCode === deleteKey || e.keyCode === arrowLeftKey || e.keyCode === arrowRightKey)) {
      e.preventDefault();
    }
    $('#story-header #details-overlay').css('bottom',0);
  });

  $('#story-header #story-title').keydown(function(e) {
    // trap the return key being pressed
    if (e.keyCode === returnKey) {
      e.preventDefault();
    }
    // limit the number of characters
    if ($(this).text().length > 80 && !(e.keyCode === backspaceKey || e.keyCode === deleteKey || e.keyCode === arrowLeftKey || e.keyCode === arrowRightKey)) {
      e.preventDefault();
    }
  });

  $('[data-toggle="tooltip"]').tooltip({delay: { "show": 1500, "hide": 100 }})


  $(window).bind("wheel load", function(event) {
		var scrollTop = $(window).scrollTop();
    $('#content-tools').css('top',scrollTop + 200);
  });

  $(window).resize(function() {
		var scrollTop = $(window).scrollTop();
    $('#content-tools').css('top',scrollTop + 200);
  });

  $('#story-content').on('mouseup',function(e) {
		currentSelectedElement = e.target;
  });

  $("#publish-link").click(function() {
    openPublishPane();
  });

  initializeUser();
})

function openPublishPane() {
  window.scrollTo(0, 0);
  $('#story-header').addClass('open');
  $('#content-tools').addClass('publish-pane-open');
  saveStoryOnServer();
}

function closePublishPane() {
  $('#story-header .map-popover').removeClass('open');
  $('#story-header').removeClass('open');
  $('#content-tools').removeClass('publish-pane-open');
  saveStoryOnServer();
}

function addCover(imageUrl) {
  $('#story-container-and-thumbnail').css('background-image','url(' + imageUrl + ')');
  $('#story-header, #content-tools').addClass('with-cover');
  $("#story-header #add-cover-btn").hide();
  $("#story-header #remove-cover-btn").show();
}

function removeCover() {
  stud_deleteStoryThumbnail(story.id,function() {
    $('#story-container-and-thumbnail').css('background-image','none');
    story.thumbnail = null;
    $('#story-header, #content-tools').removeClass('with-cover');
    $("#story-header #add-cover-btn").show();
    $("#story-header #remove-cover-btn").hide();
  })
}

function populateStoryPublishPane() {
  $("#story-header #story-title").text(story.title);
  $("#story-header #story-summary").text(story.summary);
  if (story.thumbnail) {
    $('#story-container-and-thumbnail').css('background-image','url(' + story.thumbnail + ')');
    $('#story-header, #content-tools').addClass('with-cover');
    $("#story-header #add-cover-btn").hide();
    $("#story-header #remove-cover-btn").show();
  }
  var loc;
  if (story.location != null)
    loc = story.location;
  locationbanner = buildLocationBannerForPublishPane(loc);
  if (locationbanner)
    locationbanner.appendTo($("#story-header #story-location"))
  if (story.published) {
    $("#story-header #story-status").text("published");
    $("#story-header #post-btn").addClass('highlighted').text('Unpublish');
  } else {
    $("#story-header #story-status").text("draft");
  }
}

function buildLocationBannerForPublishPane(l) {
  if ($("#story-header .location-banner")[0]) return null;

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

  var map;
  var locationBanner = $('<div class="location-banner" contenteditable="false" />');
  addLocationDataAttrOnElement(locationBanner,location)
  $('<span class="location-icon glyph-icon icon-no-margins icon-15px flaticon-placeholder">').appendTo(locationBanner)
  var locationNameelem = $('<p class="location-name">' + location.name + '</p>').appendTo(locationBanner);

  // map popover
  var mapContainer = $("<div class='map-container' contenteditable='false'/>");
  var mapelem = $('<div class="map-canvas"/>').appendTo(mapContainer);
  var mapcontrols = $('<div class="map-controls"/>').appendTo(mapContainer);
  var searchboxelem = $('<input class="location-search-box" placeholder="choose location">').appendTo(mapcontrols);
  searchboxelem.val(location.name);
  var cancelLocationSelection = $('<button class="cancel-location btn btn-default btn-icon"><span class="glyph-icon icon-no-margins icon-15px flaticon-close"></button></button>').appendTo(mapcontrols);
  var confirmLocationSelection = $('<button class="confirm-location btn btn-info btn-icon"><span class="glyph-icon icon-no-margins icon-15px flaticon-check"></button></button>').appendTo(mapcontrols);
  $('<div class="map-sight"/>').appendTo(mapContainer);

  //Map popover layout
  var mapPopOverContainer = $("<div class='popover-container' contenteditable='false'/>").appendTo($("#story-header"));
  mapContainer.appendTo(mapPopOverContainer);

  locationBanner.click(function() {
    mapPopOverContainer.css('top',locationBanner.position().top + locationBanner.height());
    mapPopOverContainer.css('left',locationBanner.position().left);
    var coords;
    if (location.latitude != null) {
      coords = new Object();
      coords.position = new google.maps.LatLng(location.latitude,location.longitude);
      coords.zoom = parseFloat(location.zoom);
    }

    if (!map)
      map = initiateMap(mapelem[0],searchboxelem[0],coords);
    mapPopOverContainer.toggleClass('open');
  })

  cancelLocationSelection.click(function() {
    mapPopOverContainer.removeClass('open');
  })

  confirmLocationSelection.click(function() {
    location.latitude = map.getCenter().lat();
    location.longitude = map.getCenter().lng();
    location.name = searchboxelem.val();
    location.zoom = map.getZoom();
    location.ismain = true;
    story.location = location;
    addLocationDataAttrOnElement(locationBanner,location);
    if (!map.marker)
      map.marker = new google.maps.Marker({map: map});
    map.marker.setPosition(new google.maps.LatLng(location.latitude,location.longitude));
    locationNameelem.text(location.name)
    locationBanner.popover('hide');
  })

  return locationBanner;
}

function convertStoryContentToObject() {
  var contentObject = [];
  $('.section').each(function() {
    var sectionObj = new Object();
    var _thissection = $(this);
    sectionObj.id = parseInt(_thissection.attr('section-id'));
    if (_thissection.hasClass('location-section')) {
      sectionObj.type = LOCATION_SECTION;
      sectionObj.location = readLocationDataAttrOnElement(_thissection.find('.location-banner').first());
    } else {
      sectionObj.type = SECTION;
    }
    sectionObj.content = [];
    _thissection.children().each(function() {
      var _thischild = $(this);
      var itemObj = new Object();
      if (_thischild.hasClass('text-normal-size')) {
        itemObj.type = STORY_TEXT
        itemObj.text = _thischild.text();
      }
      if (_thischild.hasClass('text-title-size')) {
        itemObj.type = STORY_SUBTITLE
        itemObj.text = _thischild.text();
      }
      if (_thischild.hasClass('picture-container')) {
        itemObj.type = PICTURE_CONTAINER
        itemObj.link = _thischild.find('img').attr('src')
        itemObj.text = _thischild.find('.picture-caption').text();
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

function readStoryDataAndLoadOnDOM(story) {
  populateStoryPublishPane();
  var contentElement = $('#story-content');
  if (!story.content) {
    addSectionAtEnd();
    return;
  }
  $('#story-content section').remove();
  story.content.forEach(function(sectionObj) {
    if (!sectionObj.id)
      sectionObj.id = Date.now();
    if (sectionObj.type == LOCATION_SECTION) {
      var sectionElem = $("<div class='section location-section' contenteditable='true' section-id='" + sectionObj.id +"'/>").appendTo(contentElement);
      buildLocationBanner(sectionObj.location).appendTo(sectionElem)
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
              buildPictureFrame(itemObj.link,itemObj.position,itemObj.text).appendTo(sectionElem);
              break;
          }
        });
      } else {
        $('<p class="section-item story-text text-normal-size" />').appendTo(sectionElem);
      }
    } else {
      var sectionElem = $("<div class='section' contenteditable='true' section-id='" + sectionObj.id +"'/>").appendTo(contentElement);
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

function saveStoryOnServer(onFinished) {
  var storycontent = convertStoryContentToObject();
  story.title = $("#story-header #story-title").text();
  story.summary = $("#story-header #story-summary").text();
  if (story.location) {
    storycontent.push({location:story.location,type:HEADER_SECTION})
  }
  story.content = JSON.stringify(storycontent);
  story.labels = [];

  stud_updateStory(story, function(data) {
    console.log('story saved');
    console.log(data);
    updateSectionLocationIds(data);
    if (onFinished) {
      onFinished();
    }
  });
}

function publishStory() {
  if (story.published == false) {
    story.published = true;
    saveStoryOnServer(function() {
      $("#story-header #story-status").text("published");
      $("#story-header #post-btn").addClass('highlighted').text('Unpublish');
    });
  } else {
    story.published = false;
    saveStoryOnServer(function() {
      $("#story-header #story-status").text("draft");
      $("#story-header #post-btn").removeClass('highlighted').text('Publish');
    });
  }
}

function updateSectionLocationIds(st) {
  content = JSON.parse(st.content);
  content.forEach(function(section) {
    if (section.location) {
      if (section.location.ismain)
        $('#story-location .location-banner').attr('id',section.location.id);
      else
        $('.location-section[section-id=' + section.id + '] .location-banner').attr('id',section.location.id);
    }
  });
}
