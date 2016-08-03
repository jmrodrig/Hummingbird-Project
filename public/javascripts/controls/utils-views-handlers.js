function buildMapContainer(location) {
  var map;
  var locationBanner = $('<div class="location-banner" contenteditable="false" />');
  addLocationDataAttrOnElement(locationBanner,location)
  $('<span class="location-icon glyph-icon icon-no-margins icon-20px flaticon-placeholder">').appendTo(locationBanner)
  var locationNameelem = $('<p class="location-name">' + location.name + '</p>').appendTo(locationBanner);
  var deleteLocationBtn = $('<button type="button" class="delete-location close"><span>&times;</span></button>').appendTo(locationBanner);

  // map popover
  var mapContainer = $("<div class='map-container' contenteditable='false'/>");
  var mapelem = $('<div class="map-canvas"/>').appendTo(mapContainer);
  var mapcontrols = $('<div class="map-controls"/>').appendTo(mapContainer);
  var searchboxelem = $('<input class="location-search-box" placeholder="choose location">').appendTo(mapcontrols);
  searchboxelem.val(location.name);
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
    location.name = searchboxelem.val();
    location.zoom = map.getZoom();
    addLocationDataAttrOnElement(locationBanner,location);
    if (!map.marker)
      map.marker = new google.maps.Marker({map: map});
    map.marker.setPosition(new google.maps.LatLng(location.latitude,location.longitude));
    locationNameelem.text(location.name)
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
  location.name = (location.name) ? location.name : "choose location";

  element.attr('lat',location.latitude);
  element.attr('lng',location.longitude);
  element.attr('radius',location.radius);
  element.attr('zoom',location.zoom);
  element.attr('locationName',location.name);
}

function readLocationDataAttrOnElement(element) {
  var location = new Object();
  location.latitude = parseFloat(element.attr('lat'));
  location.longitude = parseFloat(element.attr('lng'));
  location.radius = parseFloat(element.attr('radius'));
  location.zoom = parseFloat(element.attr('zoom'));
  location.name = element.attr('locationName');
  return location;
}
