function newTransitionObj(map){
	var nTransition = new Object();
	nTransition.map = map;
	
	nTransition.constructor = function(){
		this.domainTransition = new Object();
	}
	
	nTransition.constructorStoryStartPostEndPost = function(story, startPost, endPost){
		this.constructor();
		this.setStory(story);
		this.setStartPost(startPost);
		this.setEndPost(endPost);
	}
	
	nTransition.constructorStoryStartPostTransitionId = function(story, startPost, transitionId){
		this.constructor();
		this.setStory(story);
		this.setStartPost(startPost);
		this.setTransitionId(transitionId);
	}
	
	nTransition.getTransitionId = function(){
		return this.domainTransition.id;
	}
	
	nTransition.setTransitionId = function(id){
		this.domainTransition.id = id;
	}
	
	nTransition.getEndPostId = function(){
		return this.domainTransition.endPostId;
	}
	
	nTransition.setStory = function(story){
		this.story = story;
	}
	
	nTransition.setStartPost = function(post){
		this.domainTransition.startPostId = post.getPostId();
		this.startPost = post;
	}
	
	nTransition.getStartPost = function(){
		return this.startPost;
	}
	
	nTransition.setEndPost = function(post){
		this.domainTransition.endPostId = post.getPostId();
		this.endPost = post;
	}
	
	nTransition.getEndPost = function(){
		return this.endPost;
	}
	
	nTransition.getTransitionInfo = function(){
		var transitionId = this.getTransitionId(),
		startPostId = this.getStartPost().getPostId(),
		startPostTitle = this.getStartPost().getTitle(),
		endPostId = this.getEndPost().getPostId(),
		endPostTitle = this.getEndPost().getTitle();
		return 'Transition id: ' + transitionId + ': ' + startPostTitle + '(' + startPostId + ') -> ' + endPostTitle + '(' + endPostId + ')';
	}
	
	nTransition.updateTransitionPosts = function(){
		this.getStartPost().addStartTransition(this);
		this.getEndPost().addEndTransition(this);
	}
	
	nTransition.deleteTransitionSimple = function(onFinished){
		var _this = this
		
		var index = this.story.transitions.indexOf(this);

		this.deleteTransition(function() {
			_this.clearTransitionArrow();
			_this.story.transitions.splice(index,1);
			if (onFinished) onFinished();
		});
	}
	
	nTransition.deleteTransitionViaMap = function() {
		var _this = this
		var index = this.story.transitions.indexOf(this);
		var startPost = this.getStartPost();
		var endPost = this.getEndPost();
		
		this.deleteTransition(function() {
			_this.clearTransitionArrow();
			_this.story.transitions.splice(index,1);
			startPost.removeStartingTransition(_this)
			startPost.updatePost();
			endPost.removeEndingTransition(_this)
			if (endPost.getPreviousPosts().length == 0) {
				endPost.story.getInitPost().createTransition(endPost,false);
				endPost.setIsFirstPost(true);
			}
			endPost.updatePost();
		});
	}
	
	nTransition.initializeTransitionArrow = function(readonly){
		var _this = this;
		
		if (this.getStartPost().isInitPost() || !this.getStartPost() || !this.getEndPost())
			return;
		
		var pathCoordinates = [
 				new google.maps.LatLng(this.getStartPost().getLat(),
 						this.getStartPost().getLng()),
 				new google.maps.LatLng(this.getEndPost().getLat(),
 						this.getEndPost().getLng()) ];

 		var lineSymbol = {
 			path : google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
			fillColor : '#4AC1FF',
			fillOpacity: 1,
			strokeColor : '#4AC1FF',
			strokeWeight : 1
			
 		};
		
 		var arrow = new google.maps.Polyline({
 			path : pathCoordinates,
 			strokeColor : '#4AC1FF',
			fillColor : '#4AC1FF',
 			strokeOpacity : 1.0,
 			strokeWeight : 3,
 			icons : [ {
 				icon : lineSymbol,
 				offset : '100%',
 			} ]
 		});

 		this.arrow = arrow;
		
		this.arrow.readonly = readonly;
	
	}
	
	nTransition.drawTransitionArrow = function(){
		if (this.arrow) {
			this.arrow.setMap(this.map);
			if (!this.arrow.readonly) this.drawTransitionDeleteButton();
		} 		
	}
	
	nTransition.clearTransitionArrow = function() {
		if (this.arrow) {
			this.arrow.setMap(null);
			this.clearTransitionDeleteButton();
		}
	}
	
	
	nTransition.updateTransition = function(){
		this.updateTransitionArrow();
		this.updateTransitionOnServer();
	}
	
	nTransition.updateTransitionArrow = function(){
		if (!this.getStartPost().isInitPost()){
			this.updateTransitionDeleteButton();
			this.arrow.getPath().setAt(0, new google.maps.LatLng(this.getStartPost().getLat(),
					this.getStartPost().getLng()));
			this.arrow.getPath().setAt(1, new google.maps.LatLng(this.getEndPost().getLat(),
					this.getEndPost().getLng()));
		}		
	}
	
	
	nTransition.drawTransitionDeleteButton = function(){
		var _this = this;
		
		var ext_radius = 12;
		var lineWidth = 4;
		var int_radius = ext_radius - lineWidth;
		var closeBullet = document.createElement('CANVAS');
		closeBullet.className = "closeBullet";
		closeBullet.height = 2 * ext_radius;
		closeBullet.width = 2 * ext_radius;
		closeBullet.style.position = 'absolute';
		closeBullet.style.top = '0px';
		closeBullet.style.left = '0px';
		
		// closeBullet format
		var ctx=closeBullet.getContext("2d");
		ctx.beginPath();
		ctx.arc(ext_radius,ext_radius,int_radius,0,2*Math.PI);
		ctx.lineWidth = lineWidth;
		// fill gradient
		var grd=ctx.createRadialGradient(ext_radius,ext_radius,0,ext_radius,ext_radius,ext_radius);
		grd.addColorStop(0,"#428bca");
		grd.addColorStop(1,"#2d6ca2");
		// stroke
		ctx.strokeStyle ="#fff"; //"#2b669a";
		ctx.stroke();
		ctx.fillStyle= grd;
		ctx.fill();
		
		// closebullet animation
		var stylesheet = document.createElement('style');
		stylesheet.setAttribute('type', 'text/css');
		var css =   ".closeBulletIcon {" +
						"-webkit-transform: scale( 0 )" +
					"}" +
					".closeBullet {" +
						"-webkit-transform: scale( 0.5 )" +
					"}" +
					".closeBullet-standout {" +
						"-webkit-animation-name: drawCloseBulletAnim;" +
						"-webkit-animation-duration: 0.5s; "	+
						"-webkit-animation-iteration-count: 1;" + 
					"}" +
				    "@-webkit-keyframes drawCloseBulletAnim {" +
						"from { -webkit-transform: scale( 0.5 )}" +
						"50% {-webkit-transform: scale( 1.2 )}" +
						"90% {-webkit-transform: scale( .95 )}" +
						"to {-webkit-transform: scale( 1 )}" +
					"}"

		stylesheet.textContent = css;
		document.getElementsByTagName('head')[0].appendChild(stylesheet);
		
  
		// closeBulletIcon
		var closeBulletIcon = document.createElement('I');
		closeBulletIcon.className = 'glyphicon glyphicon-remove closeBulletIcon';
		closeBulletIcon.style.color = '#fff';
		var fontSize = 12;
		closeBulletIcon.style.fontSize = fontSize + 'px';
		closeBulletIcon.style.position = 'absolute';
		closeBulletIcon.style.top = ext_radius - fontSize / 2 + 'px';
		closeBulletIcon.style.left = ext_radius - fontSize / 2 + 'px';
		

		var divContainer = document.createElement('DIV');
		divContainer.className = 'closeBulletContainer';
		//divContainer.style.backgroundColor = 'rgba(0,255,0,0.5)';
		divContainer.appendChild(closeBullet);
		divContainer.appendChild(closeBulletIcon);
		
		var start = new google.maps.LatLng(_this.getStartPost().getLat(),_this.getStartPost().getLng());
		var end = new google.maps.LatLng(_this.getEndPost().getLat(),_this.getEndPost().getLng());
		
		offset = new Object({x:ext_radius, y:ext_radius })

		var transitionDeleteButton_ = new SimpleMapOverlay(start,end,offset,divContainer,this.map);		
		this.transitionDeleteButton = transitionDeleteButton_;
		
		
		google.maps.event.addListener(transitionDeleteButton_, 'mouseenter', function() {
			closeBullet.className = "closeBullet-standout"; 
			closeBulletIcon.className = 'glyphicon glyphicon-remove closeBullet-standout';
		});
		
		google.maps.event.addListener(transitionDeleteButton_, 'mouseleave', function() {
			setTimeout( function() {
				closeBullet.className = "closeBullet"; 
				closeBulletIcon.className = 'glyphicon glyphicon-remove closeBulletIcon';
			}, 100);
		});
		
		google.maps.event.addListener(transitionDeleteButton_, 'click', function() {
			_this.deleteTransitionViaMap();
		});
		
	}
	
	nTransition.clearTransitionDeleteButton = function() {
		if (this.transitionDeleteButton) {
			//this.transitionDeleteButton.close(); // close with animation
			this.transitionDeleteButton.setMap(null);
		}
	}
	
	nTransition.updateTransitionDeleteButton = function(){
		var _this = this;
		
		if (!this.transitionDeleteButton) {
			return;
		}
		
		var start = new google.maps.LatLng(_this.getStartPost().getLat(),_this.getStartPost().getLng());
		var end = new google.maps.LatLng(_this.getEndPost().getLat(),_this.getEndPost().getLng());
		
		this.transitionDeleteButton.setPosition(start,end);
	
	}
	
	nTransition.cleanTransitionDeleteButton = function(){
		if (this.transitionDeleteButton) {
			this.transitionDeleteButton.close();
		}
	}
	
	nTransition.loadDomainTransition = function(transitionData){
		this.domainTransition = transitionData;
		var startPost = this.story.getPostFromId(this.domainTransition.startPostId);
		if (startPost){
			this.setStartPost(startPost);
		}
			
		var endPost = this.story.getPostFromId(this.domainTransition.endPostId);
		if (endPost){
			this.setEndPost(endPost);
		}
		
		if (startPost && endPost){
			endPost.addEndingTransition(this);
			startPost.addStartingTransition(this);
		}
		
		// if (endPost){
			// startPost.addStartingTransition(this);
		// }
			
		//this.drawTransitionArrow();
	}
	
	nTransition.readTransition = function(onFinished) {
		var _this = this;
		stud_readTransition(this.story.getStoryId(), this.startPost.getPostId(), this.getTransitionId(), 
		function(transitionData) {
			_this.loadDomainTransition(transitionData);
			if (onFinished){
				onFinished(_this);
			}
		}, processError);
	}
	
	nTransition.createTransition = function(onFinished){
		var _this = this;
		console.log('Creating ' + this.getTransitionInfo());
		stud_createTransition(this.story.getStoryId(), this.domainTransition.startPostId, this.domainTransition,
			function(transitionData) {
				console.log('Created ' + _this.getTransitionInfo());
				toggleStatusIndicator();
				_this.loadDomainTransition(transitionData);
				if (onFinished){
					onFinished(_this);
				}
			}, processError);
	}
	
	nTransition.updateTransitionOnServer = function(onFinished){
		var _this = this;
		stud_updateTransition(this.story.getStoryId(), this.domainTransition.startPostId, this.domainTransition,
			function(transitionData) {
				if (onFinished){
					onFinished(_this);
				}
			}, processError);
	}
	
	nTransition.deleteTransition = function(onFinished){
		var _this = this;
		console.log('Deleting ' + this.getTransitionInfo());
		stud_deleteTransition(this.story.getStoryId(), this.domainTransition.startPostId, this.domainTransition.id,
			function() {
				toggleStatusIndicator();
				console.log('Deleted ' + _this.getTransitionInfo());
				if (onFinished){
					onFinished();
				}
			}, processError);
	}
	
	return nTransition;
}