var ROOT_URL = "https://deltamap.net";
var oauth = {};
oauth.mountpoint = document.getElementById('mountpoint');

oauth.parseURLParams = function() { 
	try {	
		var query = window.location.search;
		var objects = String(query).trim("?").split("&");
		var i = 0;
		var keys = [];
		var obj = {};
		while(i<objects.length) {
			try {
				var o = objects[i];
				//Trim beginning
				o = o.replace("?","").replace("&","");
				//Split by equals.
				var oo = o.split("=");
				keys.push(oo[0]);
				//Uri decode both of these
				var key = decodeURIComponent(oo[0]);
				var value = decodeURIComponent(oo[1]);
				obj[key] = value;
			} catch (e) {

			}
			i+=1;
		}
		return obj;
	} catch (ex) {
		return {};
	}
}

oauth.createDOM = function(data) {
    var e = delta.createDom("div", "inner_box", oauth.mountpoint);

    //Add top
    var top = delta.createDom("div", "consent_top", e);
    delta.createDom("div", "consent_top_subtitle", top).innerText = "ALLOW ACCESS TO";
    delta.createDom("div", "consent_top_application", top).innerText = data.name;

    //Add midsection
    var mid = delta.createDom("div", "consent_mid", e);
    delta.createDom("span", "", mid).innerText = "This will give ";
    delta.createDom("span", "consent_mid_accent", mid).innerText = data.name;
    delta.createDom("span", "", mid).innerText = " access to your Delta Web Map account:";
    var scopes = delta.createDom("ul", "", mid);
    for(var i = 0; i<data.scopes.length; i+=1) {
        delta.createDom("li", "", scopes).innerText = data.scopes[i].name;
    }
    delta.createDom("li", "", scopes).innerText = "Permenent access, unless you revoke it manually.";

    //Add bottom and nav
    var bottom = delta.createDom("div", "consent_bottom", e);
    delta.createDom("div", "consent_bottom_reminder", bottom).innerText = "You can revoke access to this application at any time";
    var nav = delta.createDom("div", "consent_bottom_nav", bottom);
    
    //Add accept button
    var btnAccept = delta.createDom("div", "consent_bottom_nav_btn", nav);
    btnAccept.innerText = "Authorize";
    btnAccept.x_data = data;
    btnAccept.addEventListener("click", function() {
        window.location = this.x_data.endpoints.authorize;
    });

    //Add flag button
    var btnFlag = delta.createDom("div", "consent_bottom_nav_flag", nav);
    btnFlag.innerText = "Report";
}

oauth.showConsent = function(data) {
    oauth.createDOM(data);
}

//Shows a full screen error
oauth.showError = function(msg) {
    delta.createDom("div", "error_text", oauth.mountpoint).innerText = msg;
}

oauth.init = function() {
    //Get URL data
    var params = oauth.parseURLParams();

    //Get the client ID
    var clientId = params["client_id"];
    if(clientId == null) {
        oauth.showError("No application was requested");
        return;
    }

    //Get requested scopes
    if(params["scopes"] == null) {
        oauth.showError("No application scopes were requested");
        return;
    }
    var scopes = params["scopes"].split(',');

    //Request the application data
    delta.serverRequest(ROOT_URL+"/api/auth/oauth/query", {
        "type":"POST",
        "body":JSON.stringify({
            "client_id":clientId,
            "scopes": scopes
        }),
        "failOverride":function() {
            oauth.showError("This application was removed, or it never existed");
            return;
        }
    }, oauth.showConsent);
}

oauth.init();