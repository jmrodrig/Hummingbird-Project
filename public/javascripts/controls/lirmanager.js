
function newLirManagerObj() {
	var lirmanager = new Object();
	lirmanager.publicStories = [];
	
	lirmanager.getStories = function(){
		return this.publicStories;
	}
	
	lirmanager.loadPublishedStories = function(publishedStories){
		
		if (!publishedStories){
			return;
		}
		
		this.stories = [];
		
		for ( var i = 0; i < publishedStories.length; i++) {
			var story = new newStoryObj(map);
			story.constructor();
			story.setDomainStory(publishedStories[i]);
			this.stories.push(story);
		}
	}
	
	lirmanager.readPublishedStories = function(onFinished) {
		var _this = this;
		stud_readPublishedStories( 
			function(publishedStories) {
				_this.publicStories = publishedStories;
				if (onFinished){
					onFinished(_this);
				}
			}, processError);
	}
	
	
	return lirmanager;
}