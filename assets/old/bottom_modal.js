var bottom_modal = {};
bottom_modal.bottomModalQueue = [];
bottom_modal.bottomModalActive = false;

bottom_modal.showBottomModal = function(text, callback, className, overrideTime) {
    var i = {};
    i.type = 0;
    i.callback = callback;
    i.text = text;
    i.className = className;
    i.overrideTime = overrideTime;
	//If it's already active, push it the the queue.
	if(bottom_modal.bottomModalActive) {
		bottom_modal.bottomModalQueue.unshift(i);
	} else {
		//Display now.
		bottom_modal.forceShowBottomModal(i);
	}
};

bottom_modal.reportError = function(text) {
	bottom_modal.showBottomModal(text, null, "bottom_modal_error");
}

bottom_modal.reportDone = function(text) {
    bottom_modal.showBottomModal(text, null, "bottom_modal_good");
}

bottom_modal.forceHideBottomModal = function(request) {
    var node = document.getElementById('bottom_modal_rpws');
    //Hide.
    node.className = "bottom_modal_rpws font "+request.className;
    window.setTimeout(function() {
        //Call callback
        if(request.callback != null) {
            request.callback();
        }
        //Completely hide the classname
        node.className = "bottom_modal_rpws font ";
        //Toggle flag
        bottom_modal.bottomModalActive = false;
        //If there is an item in the queue, show it.
        if(bottom_modal.bottomModalQueue.length >= 1) {
            var o = bottom_modal.bottomModalQueue.pop();
            bottom_modal.forceShowBottomModal(o);
        }
    }, 300);
}

bottom_modal.forceHideBottomModalNoArgs = function() {
    bottom_modal.forceHideBottomModal({
        "callback":null,
        "className":""
    });
}

bottom_modal.forceShowBottomModal = function(request) {
    var node = document.getElementById('bottom_modal_rpws');
    node.innerHTML = "";

    var text_node = document.createElement('div');
    text_node.innerText = request.text;
    text_node.className = "bottom_modal_text";
    node.appendChild(text_node);
    
	node.className = "bottom_modal_rpws bottom_modal_active_rpws font "+request.className;
    bottom_modal.bottomModalActive = true;
    
    //Called when it is time to dismiss this.
    var onDoneShowCallback = function() {
        bottom_modal.forceHideBottomModal(request);
    };

	if(request.type == 0) {
        //Standard wait. 
        if(request.overrideTime != null) {
            if(request.overrideTime == 0) {
                //Stay until told to close. Do not add a callback
            } else {
                window.setTimeout(onDoneShowCallback, request.overrideTime);
            }
        } else {
            //Calculate wait
            window.setTimeout(onDoneShowCallback, 1600 + ((request.text.length / 12) * 1000));
        }
        
    } else if(request.type == 1) {
        
    }
}

bottom_modal.isBlowing = false;
bottom_modal.blow = function() {
    if(bottom_modal.isBlowing == false) {
        //Apply animation
        var node = document.getElementById('bottom_modal_rpws');

        //Add class
        bottom_modal.isBlowing = true;
        node.classList.add("bottom_modal_rpws_blow");

        //Add delay
        window.setTimeout(function() {
            bottom_modal.isBlowing = false;
            node.classList.remove("bottom_modal_rpws_blow");
        }, 500);
    }
}