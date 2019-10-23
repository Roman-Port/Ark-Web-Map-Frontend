var app = {};

app.ParseURLParams = function() { 
	try {	
		var query = window.location.search;
		var objects = String(query).trim("?").split("&");
		//Create keys and objects.
		var i =0;
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

app.IsSignedIn = function() {
    return localStorage.getItem("access_token") != null;
}

app.SendMachineApiCall = function(url, args, callback) {
    if(args.headers == null) {
        args.headers = {
            "X-Machine-Token":machine_token
        };
    } else {
        args.headers["X-Machine-Token"] = machine_token;
    }

    //Send
    delta.serverRequest(url, args, callback);
}

app.GenerateRandomCode = function(len) {
    var chars = "ABCDEF1234567890";
    var output = "";
    for(var i = 0; i<len; i+=1) {
        output += chars[Math.floor(Math.random() * chars.length)];
    }
    return output;
}

var marea = document.getElementById('main');
var AREA_ANIMATION_TIME = 100;
var hasInit = false;
var activeArea = null;

/* Runtime vars */
var machine_token = null;
var machine_map_name = null;
var machine_path_save = null;
var machine_path_config = null;

var slides = {
    "intro":{
        "template":document.getElementById('slide_intro'),
        "init":function(e, context, next){next();}
    },
    "unsupported_platform":{
        "template":document.getElementById('slide_err_unsupported_platform'),
        "init":function(e, context, next){next();}
    },
    "choose_map":{
        "template":document.getElementById('slide_choose_map'),
        "init":function(e, context, next){next();}
    },
    "hosting_provider":{
        "template":document.getElementById('slide_choose_hosting'),
        "init":function(e, context, next){next();}
    },
    "hosting_provider_unsupported":{
        "template":document.getElementById('slide_err_unsupported_hosting'),
        "init":function(e, context, next){next();}
    },
    "login_prompt":{
        "template":document.getElementById('slide_prompt_login'),
        "init":function(e, context, next){next();}
    },
    /* Self-hosted */
    "self_setup":{
        "template":document.getElementById('slide_self_setup'),
        "init":function(e, context, next){
            //Create machine
            var b = {"name":"Machine-"+app.GenerateRandomCode(8)};
            delta.serverRequest("https://deltamap.net/api/users/@me/create_machine", {"type":"POST", "body":JSON.stringify(b)}, function(d) {
                //Set
                machine_token = d.token;

                //Wait for machine activation
                app.AwaitMachineActivation(function() {
                    app.ShowSaveFilepicker(function() {
                        /* Callback hell */
                    });
                });

                //Next
                next();
            });
        }
    },
    "self_filepicker":{
        "template":document.getElementById('slide_filepicker'),
        "init":function(e, context, next){
            //CONTEXT SHOULD BE:
            /* "title", "sub", "checkCallback", "acceptCallback" */
            e.getElementsByClassName("s_title")[0].innerText = context.title;
            e.getElementsByClassName("s_sub")[0].innerText = context.sub;
            app.filepicker.checkFunction = context.checkCallback;
            app.filepicker.acceptFunction = context.acceptCallback;
            app.filepicker.Reload(e);
            next();
        }
    },
    "self_finish":{
        "template":document.getElementById('slide_self_finish'),
        "init":function(e, context, next){next();}
    },
};

app.ShowSlide = function(id, context, skipHide) {
    //Get the slide data
    var d = slides[id];

    //Get time
    var time = AREA_ANIMATION_TIME;
    if(hasInit) {
        //Hide current slide
        marea.classList.add("hidden_slide_area");
    } else {
        //Show now
        time = 1;
        hasInit = true;
    }
    if(skipHide != null && skipHide == true) {
        time = 1;
    }

    //Wait
    window.setTimeout(function() {
        //Erase and show
        var content = document.importNode(d.template.content.firstElementChild, true);
        activeArea = content;
        
        //Run init. If we return anything, assume it is a slide ID to load instead
        d.init(content, context, function(status, ncontext) {
            //Check if we need something else
            if(status != null) {
                ShowSlide(status, ncontext, true);
                return;
            }

            //Show
            if(marea.firstChild != null) {
                marea.firstChild.remove();
            }
            marea.appendChild(content);
            marea.classList.remove("hidden_slide_area");
        });
    }, time);
}

app.ShowSaveFilepicker = function() {
    app.ShowSlide("self_filepicker", {
        "title":"Choose Save Game",
        "sub":"Find the folder containing your ARK save file. This folder is typically at Ark/ShooterGame/Saved/SavedArks/ and contains a .ark file.",
        "checkCallback":function(files) {
            for(var i = 0; i<files.length; i+=1) {
                var f = files[i];
                if(f.type == "FILE" && f.name == machine_map_name+".ark") {
                    return true;
                }
            }
            return false;
        },
        "acceptCallback":function(pathname) {
            machine_path_save = pathname;
            app.ShowConfigFilepicker();
        }
    });
}

app.ShowConfigFilepicker = function() {
    app.ShowSlide("self_filepicker", {
        "title":"Choose Config Folder",
        "sub":"Find the folder containing your ARK config file. This folder is typically at Ark/ShooterGame/Saved/Config/WindowsServer/ and contains a GameUserSettings.ini file.",
        "checkCallback":function(files) {
            for(var i = 0; i<files.length; i+=1) {
                var f = files[i];
                if(f.type == "FILE" && f.name == "GameUserSettings.ini") {
                    return true;
                }
            }
            return false;
        },
        "acceptCallback":function(pathname) {
            machine_path_config = pathname;
            app.ShowSlide("self_finish", null);
        }
    });
}

app.PromptLoginReturn = function(slide) {
    //Prompts login return to a slide ID

    //If we're already signed in, go to that slide instead
    if(app.IsSignedIn()) {
        app.ShowSlide(slide, null);
        return;
    }

    //Go
    document.x_temp_return_slide = slide;
    app.ShowSlide("login_prompt", null);
}

app.DoLoginReturn = function(slide) {
    //Goes to login and returns to a slide after

    //Create a URL to return to
    var url = window.location.protocol+"//"+window.location.host+window.location.pathname+"?mode="+encodeURIComponent("RETURN_LOGIN")+"&r_slide="+encodeURIComponent(slide)+"&r_map="+encodeURIComponent(machine_map_name);

    //Go to login
    window.location = "/api/auth/steam_auth/?next="+encodeURIComponent(url);
}

app.AwaitMachineActivation = function(callback) {
    app.SendMachineApiCall("https://deltamap.net/api/machines/await_activation", {}, function(d) {
        if(d.ok) {
            callback();
        } else {
            app.AwaitMachineActivation(callback);
        }
    });
}

app.Boot = function() {
    //Startup. First, read args in URL
    var args = app.ParseURLParams();

    //If mode is set, follow it
    if(args.mode != null) {
        if(args.mode == "RETURN_LOGIN") {
            //Go to the slide specified
            machine_map_name = args.r_map;
            app.ShowSlide(args.r_slide, null);
        } else if (args.mode == "ATTACH_SERVER_SELF") {
            //Add a server to a self-hosted machine
            machine_token = args.machine_token;
            app.ShowSlide("choose_map", null);
        } else {
            //Unexpected!
            alert("Unexpected MODE: "+args.mode);
        }
        return;
    }

    //Continue as normal. Show default if the user is not signed in
    if(!app.IsSignedIn()) {
        app.ShowSlide("intro", null);
        return;
    } else {
        //TODO!
        app.ShowSlide("intro", null);
    }
}

/* Filepicker stuffs */
app.filepicker = {};
app.filepicker.area = null;
app.filepicker.last_path = "";
app.filepicker.last_path_accepted = false;
app.filepicker.token = 0;
app.filepicker.checkFunction = null;
app.filepicker.acceptFunction = null;
app.filepicker.FetchData = function(pathname, callback) {
    var rep = {
        "path":pathname
    };
    app.SendMachineApiCall("https://deltamap.net/api/machines/files", {
        "type":"POST",
        "body":JSON.stringify(rep)
    }, callback);
}

app.filepicker.RefreshDrives = function(e) {
    var a = e.getElementsByClassName("filepicker_drive_select")[0];
    app.filepicker.FetchData("", function(d) {
        app.filepicker.MakeResponseDom(d, a);
    });
}

app.filepicker.MakeResponseDom = function(data, parent) {
    parent.innerHTML = "";
    if(data.children == null) {
        delta.createDom("div", "filepicker_text", parent).innerText = "Sorry, we can't seem to access this folder.\nTry restarting the client with administrator privileges.";
        return;
    }
    for(var i = 0; i<data.children.length; i+=1) {
        var c = data.children[i];
        app.filepicker.MakeObjectDom(c, parent);
    }
}

app.filepicker.MakeObjectDom = function(data, parent) {
    //Parent not required.
    var e = delta.createDom("div", "filepicker_item", parent);
    var type_map = {
        "DRIVE":"icon_drive",
        "FILE":"icon_file",
        "DIRECTORY":"icon_folder"
    };
    e.classList.add(type_map[data.type]);
    e.innerText = data.name;
    e.x_data = data;
    e.x_pathname = data.pathname;
    if(data.type != "FILE") {
        e.addEventListener("click", function() {
            app.filepicker.LoadDir(this.x_pathname, this.x_data);
        });
    }
    return e;
}

app.filepicker.Reload = function(e) {
    app.filepicker.area = e;
    app.filepicker.RefreshDrives(e);
    if(app.filepicker.last_path.length > 0) {
        app.filepicker.GoToDir(app.filepicker.last_path);
    }
}

app.filepicker.LoadDir = function(pathname, data) {
    //Data is a children object and can be null.
    var e = app.filepicker.area.getElementsByClassName("filepicker_content")[0];
    e.innerHTML = "";
    e.scrollTo(0, 0);
    app.filepicker.last_path = pathname;
    while(app.filepicker.last_path.includes('\\')) {
        app.filepicker.last_path = app.filepicker.last_path.replace('\\', '/');
    }
    if(!app.filepicker.last_path.endsWith("/")) {
        app.filepicker.last_path += "/";
    }
    app.filepicker.area.getElementsByClassName("filepicker_dir_input")[0].value = app.filepicker.last_path;
    var btn = app.filepicker.area.getElementsByClassName("filepicker_confirm_btn")[0];
    btn.innerText = "Incorrect Folder";
    btn.classList.remove("filepicker_confirm_btn_ok");
    app.filepicker.last_path_accepted = false;

    //If we have data already, show this now
    if(data != null) {
        if(data.children != null) {
            app.filepicker.MakeResponseDom(data, e);
            app.filepicker.CheckDir(data);
        }
    }

    //Fetch updated data
    app.filepicker.token++;
    var t = app.filepicker.token;
    app.filepicker.FetchData(pathname, function(d) {
        if(t == app.filepicker.token) {
            var scroll = e.scrollTop;
            app.filepicker.MakeResponseDom(d, e);
            app.filepicker.CheckDir(d);
            e.scrollTo(0, scroll);
        } else {
            console.log("dropping");
        }
    });
}

app.filepicker.CheckDir = function(data) {
    var ok = app.filepicker.checkFunction(data.children);
    var btn = app.filepicker.area.getElementsByClassName("filepicker_confirm_btn")[0];
    app.filepicker.last_path_accepted = ok;
    if(ok) {
        btn.innerText = "Choose";
        btn.classList.add("filepicker_confirm_btn_ok");
    } else {
        btn.innerText = "Incorrect Folder";
        btn.classList.remove("filepicker_confirm_btn_ok");
    }
}

app.filepicker.GoToDir = function(pathname) {
    app.filepicker.LoadDir(pathname, null);
}

app.filepicker.GoUp = function() {
    //Get up path. Replace \ with / for Windows systems.
    var path = app.filepicker.last_path.replace('\\', '/').split('/');
    if(path.length <= 1) {
        //Do nothing.
        return;
    }

    //Make path above
    var next = "";
    for(var i = 0; i<path.length-2; i+=1) {
        next += path[i]+"/";
    }

    //Go
    app.filepicker.GoToDir(next);
}

app.filepicker.OnHitAcceptBtn = function() {
    if(app.filepicker.last_path_accepted) {
        app.filepicker.acceptFunction(app.filepicker.last_path);
    }
}

/* Misc */
app.OnPickMap = function(id) {
    machine_map_name = id;
    if(machine_token == null) {
        //Go onto setup
        app.ShowSlide('hosting_provider', null, false);
    } else {
        //We already know our machine token. We'll need to set up. Open file browser
        app.ShowSaveFilepicker(function() {
            /* Callback hell */
        });
    }
}