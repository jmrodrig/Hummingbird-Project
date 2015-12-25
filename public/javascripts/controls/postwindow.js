
function PostWindow() {
	var _this = this;
	this.post = null;
	this.isOpen = false;
	this.postImageContainer = { width:300, height:350 };
	
	//---- Infobubble ----//
	this.infoBubble = new InfoBubble({
		padding:0,
		borderWidth: 1,
		borderRadius: 0,
		hideCloseButton: true,
		sidebarRetractPercent: 70,
		disableAnimation: false,
		minWidth:302,
		content: $("#postInfoWindowDOM").html()
		//sideBarContent: $("#toolBarContainer").html()
	}); 
	
	//add listeners for the Infobubble
	google.maps.event.addListener(this.infoBubble, 'domready', function() {
		//console.log('DOM is READY again');
		setTimeout(function() {
			if (!_this.post) return;
			_this.drawWindowElements();
			_this.registerWindowControls();
			_this.isOpen = true;
		},
		200
		);
	});		
}

PostWindow.prototype.open = function(post) {
	if (this.isOpen) this.close();
	this.post = post;
	if (post.initPost) {
		this.containerDiv = document.getElementById('initPostDiv');
		this.openInitPostModal();
	}
	else {
		//console.log('opening infobubble');
		this.containerDiv = this.infoBubble.bubble_;
		this.infoBubble.open(post.map, post.marker);
	}
	$(this.post.listEntry).addClass('active'); 
}

PostWindow.prototype.close = function() {
	var _this = this;
	if (!this.isOpen) return;
	
	_this.unregisterWindowControls();
	if (_this.post.initPost) {
		_this.closeInitPostModal();
	}
	else { 
		_this.infoBubble.close(); 
	}
	_this.isOpen = false;
	//_this.post = null;
	//this.post.updatePost();
	$(this.post.listEntry).removeClass('active'); 
}

PostWindow.prototype.openInitPostModal = function() {
	var _this = this;
	$('#initPostDiv').lightbox_me({
		centered: true,
		closeClick: false,
		onLoad: function() { 
			_this.drawWindowElements();
			_this.registerWindowControls();
			_this.isOpen = true;
			showHintsPanel('This is the first element of the story. Is the first element that you see when you play the story, before moving to the first location. You may see it as a prologe or an Intro.');
		},
		onClose: function(){
			_this.unregisterWindowControls();
			hideHintsPanel();
		}
	});
}

PostWindow.prototype.closeInitPostModal = function() {
	$('#initPostDiv').trigger('close');
}

PostWindow.prototype.registerWindowControls = function() {
	var _this = this;
	var post = this.post;
	var containerDiv = this.containerDiv
	var postImageContainer = this.postImageContainer;
	var postImage = post.domainPost;
	
	//----- Title Input -----//
	$(".postTitleInput",containerDiv).live('blur', function() {
		var title = $(".postTitleInput",containerDiv).val();
		post.setTitle(title);
		post.updatePost(function(post) {
			buildPostList();
		});
	});
	
	//----- Text Area -----//
	$(".postTextArea",containerDiv).live('blur', function() {
		var strText = $(".postTextArea",containerDiv).val();			
		post.setText(strText);
		post.updatePost();
	});
	
	$(".postTextArea",containerDiv).keydown(function() {
		//console.log('keydown event');
		_this.redrawScrollBar();
		//this.style.height = 0; // this is necessary to make it shrink when deleting
		//this.style.height = this.scrollHeight + 'px';
	});
	
	//----- Scroll bar -----//
	$(".postBodyContainer",containerDiv).nanoScroller({flash:true});
	// Scroll bar behaviour//
	$( ".postBodyContainer",containerDiv ).bind( 'mousewheel', function() {
		_this.flashScrollBar();
	}); 
	
	
	//----- Side bar Tools -----//
	
	// Upload Image Button //
	$("#postUploadImageImageButton",containerDiv).live('click', function() {
		// _this.post.postImage.imageUrl = "/assets/images/arrabida.jpg"; // para apagar
		// _this.drawPostImage();
		$('#uploadImage-preview').html('');
		$('#uploadImage-progress .progress-bar').css('width',0);
		$('#uploadPostImageModal').modal({
			keyboard: false,
			backdrop: 'static'
		})
	});
	
	// Delete Post Button //
	$("#postTrashButton",containerDiv).live('click', function() {
		if (post.isInitPost())
			story.resetInitPost();
		else
			story.removePostViaMap(post,function() {
				if (buildPostList) buildPostList();
			});
		post = null;
		_this.close();
	});	
	
	// Accept Post Button //
	$("#postCheckButton",containerDiv).live('click', function() {
		_this.close();
	});	
	
}

PostWindow.prototype.unregisterWindowControls = function() {
	var containerDiv = this.containerDiv;
	$(".postTitleInput", containerDiv).die();
	$(".postTitleLabel", containerDiv).die();
	$(".postTextArea", containerDiv).die();
	$(".postTextLabel", containerDiv).die();
	$("#postCheckButton",containerDiv).die();
	$("#postUploadImageImageButton",containerDiv).die();
	$("#postTrashButton",containerDiv).die();
	$("#postUploadSoundImageButton",containerDiv).die();
	this.unregisterPostImageControls();
}

PostWindow.prototype.drawWindowElements = function() {
	var post = this.post;
	var containerDiv = this.containerDiv
	
	if (!post)
		return;
	
	//---- Title Input ----//
	$(".postTitleInput", containerDiv).val(post.domainPost.title);
	
	//---- Text Area ----//	
	if (post.domainPost.text && post.domainPost.text.length > 0) {
		$(".postTextArea", containerDiv).val(post.domainPost.text);
	}
	
	$(".postTextArea",containerDiv).elastic();
	
	//---- Post Image ----//
	this.drawPostImage();
	
}

PostWindow.prototype.drawPostImage = function() {
	var _this = this;
	var post = this.post;
	var containerDiv = this.containerDiv;
	var postImageContainer = this.postImageContainer;
	var postImage = this.postImage = new Object()
		
	if (post.getImageUrl() && post.getImageUrl().length > 0) {
		
		$(".postImageContainer",containerDiv).html( $('#postImageContainerDOM').html() )
		
		//----- Load image -----//
	
		$(".postImage", containerDiv).load(function() {
			postImage.imageOriginalSize = { width : this.width, height : this.height };
			postImage.imageAR = postImage.imageOriginalSize.width / postImage.imageOriginalSize.height;
			
			//SIZE PICTURE
			if ( postImage.imageAR < 1 ) {
				postImage.imageMinSize = { 
					width : postImageContainer.width, 
					height : postImageContainer.width / postImage.imageAR
				};
				postImage.imageMinScale = postImage.imageMinSize.width / postImage.imageOriginalSize.width;
			} else {
				postImage.imageMinSize = { 
					width : postImageContainer.height * postImage.imageAR, 
					height : postImageContainer.height 
				};
				postImage.imageMinScale = postImage.imageMinSize.height / postImage.imageOriginalSize.height;
			}
			
			if (!post.getImageWidth() || post.getImageWidth() == 0) {
				postImage.imageSize = { width : postImage.imageMinSize.width, height : postImage.imageMinSize.height };
				post.setImageWidth(postImage.imageSize.width);
				post.setImageHeight(postImage.imageSize.height);
				postImage.imageScale = postImage.imageMinSize.width / postImage.imageOriginalSize.width;
			}
			else {
				postImage.imageScale = post.getImageWidth() / postImage.imageOriginalSize.width;
				postImage.imageAR = post.getImageWidth() / post.getImageHeight();
				postImage.imageSize = { width : post.getImageWidth(), height : post.getImageHeight() };
			}
			
			//POSITION PICTURE
			if (post.getImageLeft() == null) {
				//center image
				var left = (postImageContainer.width - postImage.imageSize.width) / 2;
				var top = (postImageContainer.height - postImage.imageSize.height) / 2; 					
				postImage.imagePosition = { left : left, top : top };
				post.setImageLeft(postImage.imagePosition.left);
				post.setImageTop(postImage.imagePosition.top);
			}
			else {
				postImage.imagePosition = { left : post.getImageLeft(), top : post.getImageTop() };
			}

			$(".postImage",containerDiv).width( postImage.imageSize.width );
			$(".postImage",containerDiv).height( postImage.imageSize.height );
			$(".postImage",containerDiv).css( 'left', postImage.imagePosition.left + 'px' );
			$(".postImage",containerDiv).css( 'top', postImage.imagePosition.top + 'px' );
			
			_this.redrawScrollBar();
			_this.registerPostImageControls();
		});
	
	
		$(".postImage",containerDiv).attr("src", post.getImageUrl() );
		$(".postImageContainer",containerDiv).height(postImageContainer.height);
		$(".postImageContainer",containerDiv).width(postImageContainer.width);
		
	}
	else{
		$(".postImageContainer",containerDiv).html('');
	}
		
}

PostWindow.prototype.registerPostImageControls = function() {
	var _this = this;
	var post = this.post;
	var postImage = this.postImage;
	var containerDiv = this.containerDiv
			
	//---- show control elements ----//
	$(".image-controls",containerDiv).addClass('image-controls-active');
	setTimeout(function() {
		$(".image-controls",containerDiv).removeClass('image-controls-active');
	}, 1500);
	
	//---- add slider ----//
	$(".postImage-scale-slider",containerDiv).slider({
		orientation: "horizontal",
		range: "min",
		min: postImage.imageMinScale,
		max: 1,
		value: postImage.imageScale,
		step: ( 1 - postImage.imageMinScale ) / 100,
		slide: function(e, ui) { _this.scalePostImage(ui, postImage) }
	});
	
	//---- add draggable functionality ----//			
	$(".postImage",containerDiv).draggable({
		drag: function(e, ui) { _this.dragPostImage(ui, postImage) }
	});	
	
	//---- add delete Post Image button ----//		
	$(".postImage-delete-icon",containerDiv).click(function() {
		_this.deletePostImage();
		_this.unregisterPostImageControls();
	});
}	

PostWindow.prototype.unregisterPostImageControls = function() {
	var containerDiv = this.containerDiv
	$(".postImage",containerDiv).off();
	$(".postImage-delete-icon",containerDiv).off();
	$(".postImage-scale-slider",containerDiv).off();
	$(".postImage",containerDiv).off();
}
	
	
PostWindow.prototype.scalePostImage = function(ui,postImage) {
	var containerDiv = this.containerDiv,
	containerWidth = this.postImageContainer.width,
	containerHeight = this.postImageContainer.height,
	//resize image
	imageWidth = postImage.imageSize.width = postImage.imageOriginalSize.width * ui.value,
	imageHeight = postImage.imageSize.height = postImage.imageOriginalSize.height * ui.value,
	//reposition image
	left = postImage.imagePosition.left,
	top = postImage.imagePosition.top;
	postImage.imageScale = ui.value;
	$(".postImage",containerDiv).width( postImage.imageSize.width );
	$(".postImage",containerDiv).height( postImage.imageSize.height );
	if ( left < containerWidth - imageWidth ) {
		left = postImage.imagePosition.left = containerWidth - imageWidth;
		$(".postImage",containerDiv).css( 'left', left + 'px' );
	}
	if ( top < containerHeight - imageHeight ) {
		top = postImage.imagePosition.top = containerHeight - imageHeight;
		$(".postImage",containerDiv).css( 'top', top + 'px' );
	}
	
	this.post.setImageWidth(Math.round(postImage.imageSize.width));
	this.post.setImageHeight(Math.round(postImage.imageSize.height));
	this.post.setImageLeft(Math.round(postImage.imagePosition.left));
	this.post.setImageTop(Math.round(postImage.imagePosition.top));
}

PostWindow.prototype.dragPostImage = function(ui,postImage) {
	var containerDiv = this.containerDiv,
	imageWidth = $(".postImage",containerDiv).width(),
	imageHeight = $(".postImage",containerDiv).height();
	containerWidth = this.postImageContainer.width,
	containerHeight = this.postImageContainer.height;
	if ( ui.position.top > 0 ) ui.position.top = 0;
	if ( ui.position.left > 0 ) ui.position.left = 0;
	if ( ui.position.top < containerHeight - imageHeight ) ui.position.top = containerHeight - imageHeight;
	if ( ui.position.left < containerWidth - imageWidth ) ui.position.left = containerWidth - imageWidth;
	postImage.imagePosition.left = ui.position.left;
	postImage.imagePosition.top = ui.position.top;
	
	this.post.setImageLeft(Math.round(postImage.imagePosition.left));
	this.post.setImageTop(Math.round(postImage.imagePosition.top));
}

PostWindow.prototype.deletePostImage = function() {
	var containerDiv = this.containerDiv;
	$(".postImage",containerDiv).attr("src",'');
	$(".postImageContainer",containerDiv).html('');
	$(".postImageContainer",containerDiv).height(0);
	this.redrawScrollBar();
	this.post.resetImageDomainPost();
}

PostWindow.prototype.redrawScrollBar = function() {
	var containerDiv = this.containerDiv;
	$(".postBodyContainer",containerDiv).nanoScroller();
	this.flashScrollBar();
}

PostWindow.prototype.flashScrollBar = function() {
	var _this = this;
	var containerDiv = this.containerDiv;
	if (this.timeout) clearTimeout(this.timeout);
	$(' .pane ',containerDiv ).addClass( 'active' );
	this.timeout = setTimeout( function() {
		$('.pane',containerDiv ).removeClass( 'active' )
		_this.timeout = null;
		},1500);
}