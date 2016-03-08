//Simple Map Overlay


SimpleMapOverlay.prototype = new google.maps.OverlayView();

function SimpleMapOverlay(position1,position2,offset,content,map,rotate) {

  // Initialize all properties.
  this.position1_ = position1;
  this.position2_ = position2;
  this.offset_ = offset
  this.content_ = content;
  this.map_ = map;
  this.rotate_ = rotate;

  // Define a property to hold the image's div. We'll
  // actually create this div upon receipt of the onAdd()
  // method so we'll leave it null for now.
  this.div_ = null;

  // Explicitly call setMap on this overlay.
  this.setMap(map);
}

SimpleMapOverlay.prototype.onAdd = function() {

  var div = document.createElement('div');
  div.style.borderStyle = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';
  div.style.cursor = 'default';
  div.style.zIndex = '100';

  // Create the img element and attach it to the div.
  var content = this.content_;
  // content.style.width = '100%';
  // content.style.height = '100%';
  content.style.position = 'absolute';
  div.appendChild(this.content_);

  this.div_ = div;
  var _this = this;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.overlayMouseTarget.appendChild(div);

  google.maps.event.addDomListener(div, 'mouseenter', function() {
    google.maps.event.trigger(_this, 'mouseenter');
  });

  google.maps.event.addDomListener(div, 'mouseleave', function() {
    google.maps.event.trigger(_this, 'mouseleave');
  });

  google.maps.event.addDomListener(div, 'click', function() {
    google.maps.event.trigger(_this, 'click');
  });

};

SimpleMapOverlay.prototype.draw = function() {

  if (this.position1_ == null || !this.position2_ == null ) {
    this.hide();
    return;
  }

  var overlayProjection = this.getProjection();

  var pos1 = overlayProjection.fromLatLngToDivPixel( this.position1_ );
  var pos2 = overlayProjection.fromLatLngToDivPixel( this.position2_ );

  if (!this.rotate_) {
    var offset = this.offset_;
    var dx = ( pos1.x + pos2.x ) / 2 - offset.x;
    var dy = ( pos1.y + pos2.y ) / 2 - offset.y;

    var div = this.div_;
    div.style.left = dx + 'px';
    div.style.top = dy + 'px';
    div.style.width = offset.x * 2 + 'px';
    div.style.height = offset.y * 2 + 'px';
    return;
  }

  var dx = ( pos2.x - pos1.x ),
  dy = ( pos2.y - pos1.y ),
  deg = Math.atan(dy/dx)* 180/Math.PI,
  div = this.div_;

  div.style.left = pos1.x + 'px';
  div.style.top = pos1.y + 'px';

  div.style.webkitTransform = 'rotate('+deg+'deg)';
  div.style.mozTransform    = 'rotate('+deg+'deg)';
  div.style.msTransform     = 'rotate('+deg+'deg)';
  div.style.oTransform      = 'rotate('+deg+'deg)';
  div.style.transform       = 'rotate('+deg+'deg)';

};

SimpleMapOverlay.prototype.setPosition = function(position1,position2,show) {
  this.position1_ = position1;
  this.position2_ = position2;

  this.draw();
  if (show)
    this.show();
}

SimpleMapOverlay.prototype.getPosition = function() {
  if (this.position1_ == this.position2_)
    return this.position1_;
}

SimpleMapOverlay.prototype.setColor = function(color) {
  return this.content_.style.backgroundColor = color;
}

SimpleMapOverlay.prototype.addClass = function(classname) {
  if (this.content_.className[-1] != " ")
    this.content_.className = this.content_.className + " "
  this.content_.className = this.content_.className + classname;
}

SimpleMapOverlay.prototype.removeClass = function(classname) {
  var pattern = classname,
  re = new RegExp(pattern, "g");
  this.content_.className = this.content_.className.replace(re,"");
}

SimpleMapOverlay.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);
  this.div_ = null;
};

// Set the visibility to 'hidden' or 'visible'.
SimpleMapOverlay.prototype.hide = function() {
  if (this.div_) {
    // The visibility property must be a string enclosed in quotes.
    this.div_.style.visibility = 'hidden';
  }
};

SimpleMapOverlay.prototype.show = function() {
  if (this.div_) {
    this.div_.style.visibility = 'visible';
  }
};

SimpleMapOverlay.prototype.toggle = function() {
  if (this.div_) {
    if (this.div_.style.visibility == 'hidden') {
      this.show();
    } else {
      this.hide();
    }
  }
};

// Detach the map from the DOM via toggleDOM().
// Note that if we later reattach the map, it will be visible again,
// because the containing <div> is recreated in the overlay's onAdd() method.
SimpleMapOverlay.prototype.toggleDOM = function() {
  if (this.getMap()) {
    // Note: setMap(null) calls OverlayView.onRemove()
    this.setMap(null);
  } else {
    this.setMap(this.map_);
  }
};
