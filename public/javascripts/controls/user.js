function newUserObj(map){
	var nUser = new Object();
	nUser.map = map;
	
	nUser.constructor = function(){
		this.domainUser = new Object();
		this.stories = [];
	}
	
	nUser.getFirstName = function(){
		return this.domainUser.firstName;
	}

	nUser.getLastName = function(){
		return this.domainUser.lastName;
	}

	nUser.getFullName = function(){
		return this.domainUser.fullName;
	}

	nUser.getEmail = function(){
		return this.domainUser.email;
	}

	nUser.getAvatarUrl = function(){
		return this.domainUser.avatarUrl;
	}

	nUser.getStories = function(){
		return this.stories;
	}
	
	nUser.deleteStory = function(story){
		this.stories.splice(story,1);
		story.deleteStory();
	}
	
	nUser.loadDomainUser = function(userData){
		this.domainUser = userData;
	}
	
	nUser.loadUserStories = function(userStories){
		
		if (!userStories){
			return;
		}
		
		this.stories = [];
		
		for ( var i = 0; i < userStories.length; i++) {
			var story = new newStoryObj(map);
			story.constructor();
			story.setDomainStory(userStories[i]);
			this.stories.push(story);
		}
	}
	
	nUser.readLoggedUser = function(onRead,onFail) {
		var _this = this;
		stud_readLoggedUser( 
			function(UserData) {
				_this.loadDomainUser(UserData);
				if (onRead){
					onRead(_this);
				}
			},
			function() {
				if (onFail){
					onFail(_this);
				}
				processError;
			}
		);
	}
	
	nUser.logout = function(onFinished) {
		var _this = this;
		stud_logoutUser( 
			function(UserData) {
				if (onFinished){
					onFinished(_this);
				}
			}, processError);
	}
	
	
	
	nUser.readStories = function(onFinished) {
		var _this = this;
		stud_readUserStories( 
			function(userStories) {
				_this.stories = userStories;
				// _this.loadUserStories(userStories);
				if (onFinished){
					onFinished(_this);
				}
			}, processError);
	}
	
	
	return nUser;
}