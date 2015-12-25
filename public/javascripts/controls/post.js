var INSERT_TITLE = "Insert title";
var INSERT_TEXT = "Insert text";

function newPostObj(map) {
	var nPost = new Object();
	nPost.map = map;

	nPost.constructor = function(){
		this.domainPost = new Object();
		this.drawElements = [];

		this.marker = null;
		this.story = null;

		this.startingTransitionsMap = new Hashtable();
		this.endingTransitionsMap = new Hashtable();

		this.LeftClickedEvent = [];
		this.RightClickedEvent = [];


		this.initPost = false;

		this.postToDestroy = false;

		this.postImage = new Object();

		this.listEntry = null;

	}

	nPost.constructorStory = function(story){
		this.constructor();

		this.setStory(story);
		//this.setTitle("post title");
		//this.setTitle('ZE');
		//this.setText("XICOPAC");

	}

	nPost.constructorStoryPostId = function(story, postId){
		this.constructor();

		this.setPostId(postId);
		this.setStory(story);
	}

	nPost.constructorStoryLatLngRadius = function(story, lat, lng, radius){
		this.constructorStory(story);

		this.setLat(lat);
		this.setLng(lng);
		this.setRadius(radius);
		this.initializeMarker();
	}

	// Getters and Setter

	nPost.getTransitionIds = function(){
		return this.domainPost.transitionIds;
	}

	nPost.getTransitions = function(){
		return this.endingTransitionsMap.values().concat(this.startingTransitionsMap.values())
	}

	nPost.getNextPosts = function() {
		return this.startingTransitionsMap.keys()
	}

	nPost.getPreviousPosts = function() {
		return this.endingTransitionsMap.keys()
	}

	nPost.getTransitionByEndPost = function(endPost) {
		return this.startingTransitionsMap.get(endPost)
	}

	nPost.getTransitionByStartPost = function(startPost) {
		return this.endingTransitionsMap.get(startPost)
	}

	nPost.setPostId = function(id){
		this.domainPost.id = id;
	}

	nPost.getPostId = function(){
		return this.domainPost.id;
	}

	nPost.isInitPost = function(){
		return this.initPost;
	}

	nPost.setIsInitPost = function(ip){
		this.initPost = ip;
	}

	nPost.setStory = function(story){
		this.story = story;
	}

	nPost.getStory = function(){
		return this.story;
	}

	nPost.getMarker = function(){
		if(this.marker) return this.marker;
	}

	nPost.isFirstPost = function(){
		return this.domainPost.isFirstPost;
	}

	nPost.setIsFirstPost = function(isFirstPost){
		this.domainPost.isFirstPost = isFirstPost;

		if (this.marker){
			if (isFirstPost){
				this.marker.setIcon('/assets/images/green-dot.png');
			}else{
				this.marker.setIcon('/assets/images/red-dot.png');
			}
		}
	}

		/* Domain Post */

	//Title
	nPost.setTitle = function(title) {
		this.domainPost.title = title;
	}

	nPost.getTitle = function() {
		return this.domainPost.title;
	}

	//Text
	nPost.setText = function(text) {
		this.domainPost.text = text;
	}
	nPost.getText = function() {
		return this.domainPost.text;
	}

	//ImageUrl
	nPost.setImageUrl = function(imageUrl) {
		if (!this.domainPost.image)
			this.domainPost.image = new Object();
		this.domainPost.image.imageUrl = imageUrl;
	}
	nPost.getImageUrl = function(imageUrl) {
		if (this.domainPost.image) return this.domainPost.image.imageUrl;
	}

	//ImageSize
	nPost.setImageWidth = function(width) {
		if (this.domainPost.image) this.domainPost.image.width = Math.round(width);
	}
	nPost.getImageWidth = function() {
		if (this.domainPost.image) return this.domainPost.image.width;
	}
	nPost.setImageHeight = function(height) {
		if (this.domainPost.image) this.domainPost.image.height = Math.round(height);
	}
	nPost.getImageHeight = function() {
		if (this.domainPost.image) return this.domainPost.image.height;
	}

	//ImagePosition
	nPost.setImageLeft = function(left) {
		if (this.domainPost.image) this.domainPost.image.x = Math.round(left);
	}
	nPost.getImageLeft = function() {
		if (this.domainPost.image) return this.domainPost.image.x;
	}
	nPost.setImageTop = function(top) {
		if (this.domainPost.image) this.domainPost.image.y = Math.round(top);
	}
	nPost.getImageTop = function() {
		if (this.domainPost.image) return this.domainPost.image.y;
	}

	//Reset Image Parameters
	nPost.resetImageDomainPost = function() {
		if (this.domainPost.image) this.domainPost.image = null;
	}

	//Location
	nPost.setLocation = function(location) {
		this.domainPost.location = location;
	}

	nPost.getLocation = function(){
		return this.domainPost.location;
	}

	//Latitude
	nPost.setLat = function(lat) {
		if (!this.domainPost.location)
			this.domainPost.location = new Object();
		this.domainPost.location.latitude = lat;
	}

	nPost.getLat = function(){
		if (this.domainPost.location){
			return this.domainPost.location.latitude;
		}
	}
	//Longitude
	nPost.setLng = function(lng) {
		if (!this.domainPost.location)
			this.domainPost.location = new Object();
		this.domainPost.location.longitude = lng;
	}

	nPost.getLng = function(){
		if (this.domainPost.location){
			return this.domainPost.location.longitude;
		}
	}
	//Radius
	nPost.setRadius = function(radius){
		if (!this.domainPost.location)
			this.domainPost.location = new Object();
		this.domainPost.location.radius = radius;
	}

	/* end Domain Post */

	nPost.addStartingTransition = function(transition){
		if (!this.startingTransitionsMap.get(transition.getEndPost()))
			this.startingTransitionsMap.put(transition.getEndPost(), transition);
	}

	nPost.addEndingTransition = function(transition){
		if (!this.endingTransitionsMap.get(transition.getStartPost()))
			this.endingTransitionsMap.put(transition.getStartPost(), transition);
		if (this.endingTransitionsMap.get(this.story.getInitPost()))
			this.setIsFirstPost(true);
		else
			this.setIsFirstPost(false);
	}

	nPost.removeStartingTransition = function(transition){
		if (this.startingTransitionsMap.get(transition.getEndPost()))
			this.startingTransitionsMap.remove(transition.getEndPost());
	}

	nPost.removeEndingTransition = function(transition){
		if (this.endingTransitionsMap.get(transition.getStartPost()))
			this.endingTransitionsMap.remove(transition.getStartPost());
	}

	nPost.createTransition = function(endPost,readonly,onFinished){
		var _this = this;

		var transition = newTransitionObj(this.map);
		transition.constructorStoryStartPostEndPost(this.story, this, endPost);
		transition.createTransition( function(tr) {
			// Enter if this is not a initPost transition
			if (!_this.isInitPost()) {
				// Enter if the endPost was a first Post
				var initPostTransition = endPost.endingTransitionsMap.get(_this.story.getInitPost())
				if (initPostTransition) {
					initPostTransition.deleteTransitionSimple(function() {
						endPost.removeEndingTransition(initPostTransition);
						endPost.setIsFirstPost(false);
						_this.story.getInitPost().removeStartingTransition(initPostTransition)
					});

				}
			}
			_this.story.transitions.push(tr);
			if (readonly != null) tr.initializeTransitionArrow(readonly);
			tr.drawTransitionArrow();
			if (onFinished) onFinished;
		});
	}

	nPost.clearInitPostTransitions = function(){
		for ( var i = 0; i < this.endingTransitionsMap.entries().length; i++) {
			if (this.endingTransitionsMap.entries()[i][0].isInitPost())
				this.endingTransitionsMap.entries()[i][1].deleteTransitionSimple();
				this.setIsFirstPost(false);
		}
	}

	nPost.cleanPostTransitions = function(autoConnectoToInitPost,onFinished) {
		var _this = this;

		//close Post window
		//this.closeWindow();

		//release attached posts from deleting post transitions
		var endingTransitions = this.endingTransitionsMap.values();
		var startingTransitions = this.startingTransitionsMap.values();
		var noOfTransitions = endingTransitions.length;
		// if there are no transitions to and from this post, finish
		if (!noOfTransitions) if (onFinished) onFinished();
		endingTransitions.forEach(function(endTransition) {
			endTransition.deleteTransitionSimple(function() {
				noOfTransitions -= 1
				var startPost = endTransition.getStartPost();
				if (startPost != _this) startPost.removeStartingTransition(endTransition);
				//As soon as all ending transitions are deleted, delete the starting transitions clear marker and delete the post
				if (!noOfTransitions) {
					noOfTransitions = startingTransitions.length;
					// if this is an ending Post (no starting transitions), finish
					if (!noOfTransitions) if (onFinished) onFinished();
					startingTransitions.forEach(function(startTransition) {
						startTransition.deleteTransitionSimple(function() {
							noOfTransitions -= 1
							var endPost = startTransition.getEndPost();
							if (endPost != _this)
								endPost.removeEndingTransition(startTransition);
							if (autoConnectoToInitPost)
								_this.story.getInitPost().createTransition(endPost,false)
								endPost.setIsFirstPost(true);
							//As soon as all starting transitions are deleted, finish
							if (!noOfTransitions) if (onFinished) onFinished();
						});
					});
				}
			});
		});
	}

	nPost.deletePost = function(onFinished) {
		var _this = this;
		//delete marker
		this.clearMarker();
		//delete post from story post list
		this.story.releasePost(_this);
		//delete post on server
		this.deletePostOnServer(function(post) {
			_this.story.updateStory(function(story) {
				if (onFinished) onFinished();
			});
		});
	}

	// draw functions

	nPost.initializeMarker = function(readonly) {
		var _this = this;
		markerTitle = this.getTitle();
		if (markerTitle == null || markerTitle.length == 0) {
			markerTitle = 'New Location';
		}

		this.marker = new google.maps.Marker({
			position : new google.maps.LatLng(_this.domainPost.location.latitude, _this.domainPost.location.longitude, true),
			//map : _this.map,
			title : markerTitle,
			draggable : !readonly

		});


		if (this.isFirstPost()){
			this.marker.setIcon('/assets/images/green-dot.png');
		}else{
			this.marker.setIcon('/assets/images/red-dot.png');
		}

		//this.marker.setMap(this.map);

		google.maps.event.addListener(this.marker, 'click', function() {
			//console.log(this.position);
			for ( var i = 0; i < _this.LeftClickedEvent.length; i++) {
				_this.LeftClickedEvent[i](_this);
			}
		});

		google.maps.event.addListener(this.marker, 'rightclick', function() {
			for ( var i = 0; i < _this.RightClickedEvent.length; i++) {
				_this.RightClickedEvent[i](_this);
			}
		});

		_this.debouncedOnDrag = _this.onMarkerDragEnd.debounce(50, false);

		google.maps.event.addListener(this.marker, 'dragend', function() {
			_this.onMarkerDragEnd();
		});

		google.maps.event.addListener(this.marker, 'drag', function() {
			_this.debouncedOnDrag();
		});

	}

	nPost.drawMarker = function() {
		if(this.marker) this.marker.setMap(this.map);

	}

	nPost.updateMarkerTitle = function() {
		markerTitle = this.getTitle();
		if (markerTitle == null || markerTitle.length == 0) {
			markerTitle = 'Untitled Location';
		}
		if(this.marker) this.marker.setTitle(markerTitle);
	}

	nPost.clearMarker = function() {
		if (this.marker) this.marker.setMap(null);
	}

	nPost.redrawMarker = function() {
		this.clearMarker();
		this.drawMarker();
	}

	nPost.updateTransitions = function(){
		for ( var i = 0; i < this.startingTransitionsMap.values().length; i++) {
			this.startingTransitionsMap.values()[i].updateTransition();
		}
		for ( var i = 0; i < this.endingTransitionsMap.values().length; i++) {
			this.endingTransitionsMap.values()[i].updateTransition();
		}
	}

	// Events

	nPost.onMarkerDragEnd = function() {
		//console.log("Post onMarkerDragEnd");
		this.setLat(this.marker.position.lat());
		this.setLng(this.marker.position.lng());

		this.updateTransitions();
		this.updatePost();
	}

	// Server functions

	nPost.createPost = function(onFinished) {
		var _this = this;
		stud_createPost(this.story.getStoryId(), this.domainPost, function(
				postData) {
			_this.domainPost = postData;  ////// ATENÇÃO: ESTÁ A ALTERAR O OBJECTO nPOST: esta a alterar o nPost.domainPost.isFirstPost para false
			$("#result").text(JSON.stringify(postData));
			if (onFinished){
				onFinished(_this);
				//document.dispatchEvent(_this.story.updatedEvent);
			}
		}, processError);
	}

	nPost.updatePost = function(onFinished) {
		var _this = this;
		stud_updatePost(this.story.getStoryId(), this.domainPost, function() {
			//document.dispatchEvent(_this.story.updatedEvent);
			_this.updateMarkerTitle();
			if (toggleStatusIndicator) toggleStatusIndicator();
			//console.log("Post updated successfully");
			if (onFinished){
				onFinished(_this);
			}
		}, function() {
			console.log("Error updating post");
			_this.readPost();
		});
	}

	nPost.readPost = function(onFinished) {
		var _this = this;
		stud_readPost(this.story.getStoryId(), this.domainPost.id, function(postData) {
			_this.domainPost = postData;
			$("#result").text(JSON.stringify(postData));
			if (onFinished){
				onFinished(_this);
			}
		}, processError);
	}

	nPost.deletePostOnServer = function(onFinished) {
		var _this = this;
		stud_deletePost(this.story.getStoryId(), this.getPostId(), function() {
			//document.dispatchEvent(_this.story.updatedEvent);
			//console.log("Post delete successfully");
			if (onFinished){
				onFinished(_this);
			}
		}, function() {
			console.log("Error deleting post");
			//_this.readPost();
		});
	}

	return nPost;
}
