function newStoryObj(map){
	var nStory = new Object();
	if (map) nStory.map = map;
	// Constructor

	nStory.constructor = function(){
		this.domainStory = new Object();

		this.initPost = null;
		this.defaultInitPost =  true;

		this.posts = [];
		this.transitions = [];
		this.marker = null;

		this.idPostMap = new Hashtable();
		this.markerPostMap = new Hashtable();

		this.activePostWindow = null;

		this.storyElementsLoadedEVENT = new Event('storyElementsLoaded');
	}

	nStory.constructorId = function(storyId){
		this.constructor();
		this.domainStory.id = storyId;
	}

	// Getters and Setters

	nStory.getStoryId = function(){
		return this.domainStory.id;
	}

	nStory.setArticle = function(title,description,image,link,date,source,author){
		this.domainStory.articleTitle = title;
		this.domainStory.articleDescription = description;
		this.domainStory.articleImage = image;
		this.domainStory.articleLink = link;
		this.domainStory.articleDate = date;
		this.domainStory.articleSource = source;
		this.domainStory.articleAuthor = author;
	}

	nStory.setLabels = function(labels){
		this.domainStory.labels = labels;
	}

	nStory.setTitle = function(title){
		this.domainStory.title = title;
	}

	nStory.getTitle = function(){
		return this.domainStory.title;
	}

	nStory.getAuthor = function(){
		return this.domainStory.author;
	}

	nStory.setInitPost = function(post){
		this.initPost = post;
	}

	nStory.getInitPost = function(){
		return this.initPost;
	}

	nStory.getPosts = function(){
		return this.posts;
	}

	// only suitable for use with fully sequential stories
	nStory.getOrderedPosts = function() {
		var initPost = this.getInitPost();
		var orderedPosts = [initPost];
		var nextPost = initPost.getNextPosts()[0];
		while (nextPost) {
			orderedPosts.push(nextPost)
			nextPost = nextPost.getNextPosts()[0]
		}
		return orderedPosts;
	}

	nStory.getPostFromId = function(postId){
		return this.idPostMap.get(postId);
	}

	nStory.getPostFromMarker = function(marker){
		return this.markerPostMap.get(marker);
	}

	nStory.setSummary = function(summary){
		this.domainStory.summary = summary;
	}

	nStory.getSummary = function(){
		return this.domainStory.summary;
	}

	nStory.setThumbnail = function(url){
		this.domainStory.thumbnail = url;
	}

	nStory.getThumbnail = function(){
		return this.domainStory.thumbnail;
	}

	nStory.setLocationName = function(ln){
		this.domainStory.locationName = ln;
	}

	nStory.getLocationName = function(){
		return this.domainStory.locationName;
	}

	nStory.setDomainStory = function(domainStory){
		this.domainStory = domainStory;
	}

	nStory.setActivePostWindow = function(post){
		this.activePostWindow = post;
	}

	nStory.getActivePostWindow = function(){
		return this.activePostWindow;
	}
	nStory.getMarkers = function(){
		return this.markerPostMap.keys();
	}

	nStory.isPublished = function(){
		return this.domainStory.published;
	}

	nStory.setPublished = function(published){
		this.domainStory.published = published;
	}

	nStory.getLocation = function(){
		return this.domainStory.location;
	}

	nStory.setLocation = function(location){
		this.domainStory.place = null;
		if (this.domainStory.location == null)
			this.domainStory.location = new Object();
		this.domainStory.location.name = location.name;
		this.domainStory.location.latitude = location.latitude;
		this.domainStory.location.longitude = location.longitude;
		this.domainStory.location.radius = location.radius;
		this.domainStory.location.zoom = location.zoom;
		this.domainStory.location.showpin = location.showpin;
	}

	nStory.setPlace = function(place){
		this.domainStory.location = null;
		if (this.domainStory.place == null)
			this.domainStory.place = new Object();
		this.domainStory.place.name = location.name;
		this.domainStory.place.selat = location.selat;
		this.domainStory.place.nwlat = location.nwlat;
		this.domainStory.place.nwlng = location.nwlng;
		this.domainStory.place.selng = location.selng;
	}

	//Latitude
	nStory.setLat = function(lat) {
		if (!this.domainStory.location)
			this.domainStory.location = new Object();
		this.domainStory.location.latitude = lat;
	}

	nStory.getLat = function(){
		if (this.domainStory.location){
			return this.domainStory.location.latitude;
		}
	}
	//Longitude
	nStory.setLng = function(lng) {
		if (!this.domainStory.location)
			this.domainStory.location = new Object();
		this.domainStory.location.longitude = lng;
	}

	nStory.getLng = function(){
		if (this.domainStory.location){
			return this.domainStory.location.longitude;
		}
	}
	//Radius
	nStory.setRadius = function(radius){
		if (!this.domainStory.location)
			this.domainStory.location = new Object();
		this.domainStory.location.radius = radius;
	}

	nStory.getStoryMarkerLocation = function(){
		for ( var i = 0; i < this.posts.length; i++) { 							// PROVISORIAMENTE!!!
			if (this.posts[i].isFirstPost()) 									// PROVISORIAMENTE!!!
				return this.posts[i].getLocation(); 							// PROVISORIAMENTE!!!
		} 																		// PROVISORIAMENTE!!!
	} 																			// PROVISORIAMENTE!!!

	nStory.getTransitions = function(toConsole){
		if (toConsole) {
			this.transitions.forEach(function(transition) {
				console.log(transition.getTransitionInfo());
			})
		}
		return this.transitions;
	}


	nStory.loadStoryElements = function(drawElements,markersReadOnly,transitionsReadOnly,onFinished){
		var _this = this;
		var postCount = 0;
		if (!this.domainStory.postIds)
			return;
		//console.log('domainStory postsIds ',this.domainStory.postIds);
		for ( var i = 0; i < this.domainStory.postIds.length; i++) {
			var post = newPostObj(this.map);
			post.constructorStoryPostId(this, this.domainStory.postIds[i]);
			if (i == 0){
				_this.setInitPost(post);
				post.setIsInitPost(true);
			}
			post.readPost(function(p){
				if (p.getLocation()){
					p.initializeMarker(markersReadOnly);
				}
				//console.log('read Post id ',p.getPostId(),'firstPost? ',p.isFirstPost(),'initPost? ',p.isInitPost())
				_this.addPost(p,transitionsReadOnly);

				//-- if all post have been loaded proceed
				if (_this.posts.length >= _this.domainStory.postIds.length){
					// if there are no transitions (only init post)
					if (_this.posts.length == 1) {
						if (onFinished){
							onFinished(_this);
						}
					} else {
						//-- load transitions
						var noOfTransitions = 0;
						for (var j = 0; j < _this.posts.length; j++){
							var po = _this.posts[j];
							var postTransitionIds = po.getTransitionIds();
							noOfTransitions += postTransitionIds.length;
							for (var k = 0; k < postTransitionIds.length; k++){
								var transition = newTransitionObj(_this.map);
								transition.constructorStoryStartPostTransitionId(_this, po, postTransitionIds[k]);
								transition.readTransition( function(transition) {
									transition.initializeTransitionArrow(transitionsReadOnly);
									_this.transitions.push(transition);

									//-- if all transitions have been loaded, proceed
									if (_this.posts.length >= _this.domainStory.postIds.length && _this.transitions.length >= noOfTransitions) {
										// draw elements
										if (drawElements) {
											_this.posts.forEach(function(p) { p.drawMarker() });
											_this.transitions.forEach(function(tr) { tr.drawTransitionArrow() });
										}
										if (onFinished){
											onFinished(_this);
										}
										//console.log('all posts loaded event trigger');
									}
								});
							}
						}
					}
				}
			});
		}
	}


	nStory.addPost = function(post){
		var _this = this;
		post.setStory(this);
		this.idPostMap.put(post.getPostId(), post);
		this.posts.push(post);
		////console.log(post.getPostId());


		if (post.marker){
			this.markerPostMap.put(post.marker, post);

			post.LeftClickedEvent.push( function(post) {

				var plist = []
				post.getPreviousPosts().forEach(function(p) {
					plist.push(p.getPostId());
				})
				console.log('Post Id: ' + post.getPostId());
				console.log(post.getTitle() + '\'s previous Posts Ids: ' + plist);
				var plist = []
				post.getNextPosts().forEach(function(p) {
					plist.push(p.getPostId());
				})
				console.log(post.getTitle() + '\'s next Posts Ids: ' + plist);

				if (!transitionsReadOnly) {
					var oldLeftClickedPost = leftClickedPost;
					leftClickedPost = null;

					//single click behaviour: open postWindow if closed when clicked on post marker
					if (!enableTransitionCreation && !enableTransitionSelectStartPost){
						if (post){
							if (!postWindow.isOpen)
								postWindow.open(post);
							else
								postWindow.close();
						}
					} else if (enableTransitionCreation) {
						if (connectPostsList[connectPostsList.length - 1] != post) connectPostsList.push(post);
						// //console.log(connectPostsList.length);
					}
				}
			});

			post.RightClickedEvent.push(function (post){
				//console.log("Right clicked post " + post.getPostId());
			});
		}
	}

	nStory.removePost = function(post,onFinished) {
		post.postToDestroy = true;
		post.cleanPostTransitions(false,function() {
			post.deletePost(function() {
				if (onFinished) onFinished();
			})
		})
	}

	nStory.removePostViaMap = function(post,onFinished) {
		post.postToDestroy = true;
		post.cleanPostTransitions(true,function() {
			post.deletePost(function() {
				if (onFinished) onFinished();
			})
		})
	}

	nStory.connectPosts = function(connectPostsList) {
		for (var i=1; i < connectPostsList.length; i++) {
			connectPostsList[i-1].createTransition(connectPostsList[i],false);
		}

	}

	nStory.releasePost = function(post) {
		//remove entry from idPostMap
		this.idPostMap.remove(post.getPostId());
		//remove entry from posts list
		var index = this.posts.indexOf(post);
		this.posts.splice(index,1);
		//remove entry from posts list
		if (post.marker) {
			this.markerPostMap.remove(post.marker);
		}
		//remove entry from domainStory.postIds list
		// var index = this.domainStory.postIds.indexOf(post.getPostId());
		// this.domainStory.postIds.splice(index,1);
	}

	nStory.resetInitPost = function() {
		this.defaultInitPost = true;
		this.initPost.setText('');
		this.initPost.setText('');
		this.initPost.updatePost();
	}

	nStory.loadDomainStory = function(storyData){
		this.domainStory = storyData;
	}
// draw functions

	nStory.drawElement = function(element){
		element.setMap(this.map);
	}

	nStory.drawStory = function(){
//		for ( var i = 0; i < story.drawnElements.length; i++) {
//			story.drawnElements[i].setMap(null);
//		}
		for (var i = 0; i < this.posts.length; i++){
			this.posts[i].clearMarker();
			this.posts[i].drawMarker();
		}
	}

	nStory.clearMapElements = function() {
		//clear all transitions
		for (var i = 0; i < this.transitions.length; i++){
			this.transitions[i].clearTransitionArrow();
		}
		//clear all markers
		for (var j = 0; j < this.posts.length; j++){
			this.posts[j].clearMarker();
		}
	}

	nStory.drawStoryMarker = function(onClick,onHover){
		var _this = this;

		markerTitle = this.getTitle();
		if (markerTitle == null || markerTitle.length == 0) {
			markerTitle = 'Untitled Story';
		}

		var markerLocation = _this.getStoryMarkerLocation()

		this.marker = new google.maps.Marker({
			position : new google.maps.LatLng(markerLocation.latitude, markerLocation.longitude, true),
			map : _this.map,
			title : markerTitle,
			draggable : false

		});

		this.marker.setMap(this.map);

		if (onClick) {
			google.maps.event.addListener(this.marker, 'click', function() {
				onClick(_this);
			});
		}

		if (onHover) {
			google.maps.event.addListener(this.marker, 'hover', function() {
				onHover(_this);
			});
		}
	}


	//Server functions

	nStory.createStory = function(onFinished){
		var _this = this;
		stud_createStory(this.domainStory, function(data) {
			_this.loadDomainStory(data);
			$("#result").text(JSON.stringify(data));
			if (onFinished){
				onFinished(_this);
			}
		}, processError);
	}

	nStory.readStory = function(onFinished){
		var _this = this;
		stud_readStory(this.getStoryId(), function(data) {
			console.log(data);
			_this.loadDomainStory(data);
			$("#result").text(JSON.stringify(data));
			if (onFinished){
				onFinished(_this);
			}
		}, processError);
	}

	nStory.updateStory = function(onFinished){
		var _this = this;
		stud_updateStory(this.domainStory, function(data) {
			_this.loadDomainStory(data);
			if (toggleStatusIndicator) toggleStatusIndicator();
			$("#result").text(JSON.stringify(data));
			if (onFinished){
				onFinished(_this);
			}
		}, processError);
	}

	nStory.updateThumbnail = function(thumbnailImageData, onFinished){
		var _this = this;
		stud_updateThumbnail(this.getStoryId(), thumbnailImageData, function(data) {
			if (toggleStatusIndicator) toggleStatusIndicator();
			_this.setThumbnail(data);
			if (onFinished){
				onFinished(data);
			}
		}, processError);
	}

	nStory.deleteStory = function(onFinished){
		var _this = this;
		stud_deleteStory(this.getStoryId(), function() {
				//alert("deleted");
				if (onFinished){
					onFinished(_this);
				}
			},
			function(){
				alert("failed");
			}
		);
	}

	nStory.downloadStory = function(){
		var _this = this;
		stud_downloadStory(this.getStoryId(),
			function(){
				alert("downloaded");
			},
			function(){
				alert("failed");
			}
		);
	}

	nStory.publishStory = function(publish,onFinished){
		var _this = this;
		stud_publishStory(this.getStoryId(), publish,
			function(data){
				_this.loadDomainStory(data);
				if (onFinished){
					onFinished(_this);
				}
			},
			function(){
				alert("failed");
			}
		);
	}


	// nStory.publishStory = function(onFinished){
		// var _this = this;
		// stud_notifyStorySubmission(this.getStoryId(),
			// function(data){
				// //_this.loadDomainStory(data);
				// if (onFinished){
					// onFinished(_this);
				// }
			// },
			// function(){
				// alert("submission failed");
			// }
		// );
	// }

	nStory.constructor(map);
	return nStory;
}
