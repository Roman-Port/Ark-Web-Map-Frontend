var cs = {};

cs.current_settings = {
    "name":"",
    "icon_token":"",
    "icon_url":"",
    "has_icon":false,
    "map_name":"",
    "map_index":0,
    "sub_server":null,
    "save_path":"",
    "subserver_port":-1
}

cs.currentSlide = -1;
cs.currentNavFlags = -1;

cs.init = function() {
    //Try and authenticate us just to check if we're logged in
    ark_users.refreshUserData(function(e) {
        //Load config
        ark_users.serverRequest("https://ark.romanport.com/config/games/0/client_config.json", {}, function(c) {
            config = c;

            //Fill the map selection form
            cs.updateMapSelectionForm(document.getElementById('server_map_form'), config.compatible_maps[0]);
            cs.current_settings.map_name = config.compatible_maps[0].internal_name;

            //Open main slide
            cs.pickNav(false, true);
        });
    }, function() {
        //Go to login
        window.location = "https://ark.romanport.com/login/?callback="+encodeURIComponent(window.location);
    });
}

cs.openiframe = function(url) {
    var e = cs.createNode("iframe", "hidden_iframe");
    e.src = url;
    document.body.appendChild(e);

    window.setTimeout(function() {
        e.remove();
    }, 1000);
}

cs.updateMapSelectionForm = function(e, mapData) {
    if(e.firstChild != null) {
        e.firstChild.remove();
    }
    e.appendChild(cs.createMapEntry(mapData, true));
    e.firstChild.addEventListener('click', function() {
        //Open map picker
        var ourPos = this.getBoundingClientRect();
        cs.openMapPicker(cs.current_settings.map_index, ourPos.left, ourPos.top, ourPos.width);
    })
}

cs.openMapPicker = function(currentMapOffset, posX, posY, width) {
    //Create element and fill it
    var e = cs.createNode("div", "servermap_picker_frame");

    //Set position
    e.style.left = posX.toString()+"px";
    e.style.top = (posY - ((30 + 5 + 5) * currentMapOffset)).toString()+"px";
    e.style.width = (width - 2).toString()+"px";

    //Fill
    for(var i = 0; i<config.compatible_maps.length; i+=1) {
        var entry = cs.createMapEntry(config.compatible_maps[i], false);
        entry.x_index = i;
        entry.x_data = config.compatible_maps[i];
        entry.addEventListener('click', function() {
            //Map selected. Update
            cs.current_settings.map_index = this.x_index;
            cs.current_settings.map_name = this.x_data.internal_name;
            cs.updateMapSelectionForm(document.getElementById('server_map_form'), this.x_data);
            cs.updateMapSelectionForm(document.getElementById('server_map_form_verify'), this.x_data);
            this.parentNode.remove();

            //Cause a refresh of the check if we're choosing a save file
            if(cs.currentSlide == 3) {
                cs.save.onType(document.getElementById('server_save_entry').value);
            }
        })
        e.appendChild(entry);
    }

    //Place in body
    document.body.appendChild(e);

    //In a moment, show 
    window.setTimeout(function() {
        e.classList.add("servermap_picker_frame_active");
    }, 10);
}

cs.pickSlide = function(index, context) {
    //Find slide
    var slide = cs.slides[index];

    //Init slide
    slide.onInit(context);
    cs.currentSlide = index;
    
    //Slide into view
    document.getElementById('dialog_slider').style.marginLeft = (-(644 * (index + 1))).toString()+"px";

    //Show new nav
    cs.pickNav(slide.defaultNav.hasBack, slide.defaultNav.hasContinue);
}

cs.pickNav = function(hasBack, hasContinue) {
    //Create flags
    var flags = 0;
    if(hasBack) { flags += 1; }
    if(hasContinue) { flags += 2; }

    //Check if this is already the active nav bar
    if(cs.currentNavFlags == flags) {
        return;
    }

    //Dismiss the current nav and replace it
    var footer = document.getElementsByClassName('dialog_footer_content')[0];
    var onDismissed = function() {
        //Create a new element and add options
        var n = document.createElement('div');
        n.classList.add("dialog_footer_content");
        if(hasBack) {
            var b = cs.createNode("div", "master_btn master_btn_blue dialog_footer_btn dialog_footer_btn_back", n);
            b.innerText = "Back";
            cs.createNode("img", "dialog_footer_btn_back_img", b).src = "assets/back_step.svg";
            b.addEventListener('click', function() {
                cs.chooseDir(false);
            });
        }
        if(hasContinue) {
            var b = cs.createNode("div", "master_btn master_btn_blue dialog_footer_btn", n);
            b.innerText = "Continue";
            b.addEventListener('click', function() {
                cs.chooseDir(true);
            });
        }

        //Update
        footer.replaceWith(n);

        //Update flags
        cs.currentNavFlags = flags;

        //Show
        window.setTimeout(function() {
            n.classList.add("dialog_footer_content_shown");
        }, 20);
    }

    //If the nav currently isn't shown, do it now. Else, open
    if(cs.currentNavFlags == -1) {
        onDismissed();
    } else {
        footer.classList.remove("dialog_footer_content_shown");
        window.setTimeout(onDismissed, 180);
    }
}

cs.createNode = function(type, classname, parent) {
    var e = document.createElement(type);
    e.className = classname;
    if(parent != null) {
        parent.appendChild(e);
    }
    return e;
}

cs.chooseDir = function(isContinue) {
    var status;
    var slide = cs.slides[cs.currentSlide];
    if(slide != null) {
        if(isContinue) {
            status = slide.onContinue();
        } else {
            status = slide.onBack();
        }
    } else {
        status = true;
    }

    //If the returned status was true, continue, else don't do anything
    if(status) {
        if(isContinue) {
            cs.pickSlide(cs.currentSlide + 1);
        } else {
            cs.pickSlide(cs.currentSlide - 1);
        }
    } else {
        //Ignore.
        console.log("Ignoring nav key because the function returned false.");
    }
}

cs.createMapEntry = function(mapData, hasFrame) {
    var cn = "servermap_content";
    if(hasFrame) {
        cn += " servermap_frame";
    }
    var e = cs.createNode("div", cn);
    e.innerText = mapData.friendly_name;
    cs.createNode("img", "servermap_icon", e).src = mapData.icon_url;
    return e;
}

cs.toggleFormErr = function(id, text) {
    var e = document.getElementById(id);
    if(text == null) {
        e.classList.remove("form_entry_warn");
    } else {
        e.classList.add("form_entry_warn");
        //Set
        var a = e.getElementsByClassName('form_entry_title_warn')[0];
        a.innerText = "- "+text;
    }
}

cs.onSubmitStep1 = function() {
    //On submitted server name, map, and icon
    //Verify name
    var ok = true;
    var name = document.getElementById('server_name_entry').value;
    if(name.length > 24) {
        cs.toggleFormErr("server_name_entry_form", "Too long");
        ok = false;
    } else if(name.length < 2) {
        cs.toggleFormErr("server_name_entry_form", "Fill this form");
        ok = false;
    } else {
        //OK
        cs.toggleFormErr("server_name_entry_form", null);
        cs.current_settings.name = name;
    }

    //Verify map
    var map = config.compatible_maps[cs.current_settings.map_index];
    if(map.tiles_supported) {
        //OK
        cs.toggleFormErr("server_map_entry_form", null);
    } else {
        //Problem
        cs.toggleFormErr("server_map_entry_form", "Map not available yet");
        ok = false;
    }

    //OK
    return ok;
}

cs.onSubmitServerIcon = function() {
    console.log("Chose server image. Uploading...");

    //Create form data
    var formData = new FormData();
    formData.append("f", document.getElementById('image_picker').files[0]);

    //Send
    ark_users.serverRequest("https://user-content.romanport.com/upload?application_id=Pc2Pk44XevX6C42m6Xu3Ag6J", {
        "method":"post",
        "body":formData,
        "nocreds":true
    }, function(f) {
        //Update the image here
        var e = document.getElementById('servername_img');
        if(e.firstChild != null) {
            e.firstChild.remove();
        }
        e.classList.remove("servername_img_noimg");
        e.style.backgroundImage = "url('"+f.url+"')";
        cs.current_settings.icon_token = f.token;
        cs.current_settings.icon_url = f.url;
        cs.current_settings.has_icon = true;
    });
}

cs.downloadBinary = function(platform) {
    var release = config.latest_release.binaries[platform];
    var url = release.url;
    window.open(url, "_blank");
}

cs.pendingCodeSubmit = null;
cs.isCodeSubmitProcessing = false;
cs.onCodeEdited = function(code) {
    //Create server data payload
    var payload = {
        "name":cs.current_settings.name
    };
    if(cs.current_settings.has_icon) {
        payload.iconToken = cs.current_settings.icon_token;
    }

    //If the code is long enough to be valid, submit
    if(code.length == 6) {
        //If something is already working, queue it
        if(cs.isCodeSubmitProcessing) {
            cs.pendingCodeSubmit = code;
            return;
        }
        cs.isCodeSubmitProcessing = true;

        //Try and check the code.
        ark_users.serverRequest("https://ark.romanport.com/api/users/@me/server_wizard/start?session_id="+encodeURIComponent(code), {
            "method":"post",
            "body":JSON.stringify(payload)
        }, function(f) {
            if(f.ok) {
                //Ok!
                cs.current_settings.sub_server = f.server;
                cs.onOkCode(f);
            } else {
                //Try next code if needed.
                cs.isCodeSubmitProcessing = false;
                if(cs.pendingCodeSubmit != null) {
                    cs.onCodeEdited(cs.pendingCodeSubmit);
                    cs.pendingCodeSubmit = null;
                }
            }
        });
    }
}

cs.onOkCode = function(reply) {
    //First, go to the next page
    cs.pickSlide(2);

    //Open communications via the proxy
    comms.open(reply.request_url);
}

//Network connection test
cs.nct = {};
cs.nct.showMsg = function(text, isError) {
    var e = document.getElementById('nct_msg');
    e.style.display = "inline-block";
    document.getElementById('nct_port').style.display = "none";
    if(isError) {
        e.classList.add("nct_error");
    } else {
        e.classList.remove("nct_error");
    }
    e.innerText = text;
}

cs.nct.showBox = function() {
    //document.getElementById('nct_msg').style.display = "none";
    document.getElementById('nct_port').style.display = "inline-block";
}

cs.nct.isWorking = false;
cs.nct.doTest = function() {
    //If already working, stop
    if(cs.nct.isWorking) {
        return false;
    }
    cs.nct.isWorking = true;

    //Hide nav
    cs.pickNav(false, false);

    //Update msg
    cs.nct.showMsg("Verifying, please wait...", false);

    //Send message
    comms.tx(2, {
        "port":document.getElementById('nct_port').value
    });
}

cs.nct.onFail = function(reason) {
    cs.nct.showMsg(reason, true);
    cs.nct.showBox();
    cs.nct.isWorking = false;
    cs.pickNav(false, true);
}

cs.nct.onGetOpenReply = function(msg, msgType, fromIp) {
    //Check if we failed to even open on that port
    if(msg.ok != "true") {
        cs.nct.onFail("Failed to open that port. Is it already used, or do you need admin?");
        return;
    }

    //Try to test the port
    ark_users.serverRequest("https://ark.romanport.com/api/users/@me/server_wizard/test_tcp_connection?ip="+fromIp+"&port="+encodeURIComponent(document.getElementById('nct_port').value), {}, function(e) {
        if(e.ok) {
            //Ok!
            cs.current_settings.subserver_port = parseInt(document.getElementById('nct_port').value);
            cs.nct.showMsg("Connection test passed!", false);
            cs.pickSlide(3);
        } else {
            //Failed.
            cs.nct.onFail("Couldn't reach server. Is a firewall or router blocking the port?");
        }
    });
}

//Save file finder
cs.save = {};
cs.save.latestId = 0;
cs.save.cooldown = null;
cs.save.queuedValue = null;
cs.save.onType = function(value) {
    //Check if the server map is even correct
    var map = config.compatible_maps[cs.current_settings.map_index];
    if(map.tiles_supported) {
        //OK
        cs.toggleFormErr("server_save_map_entry_form", null);
    } else {
        //Problem
        cs.toggleFormErr("server_save_map_entry_form", "Map not available yet");
        return;
    }

    //Remove nav
    cs.pickNav(false, false);

    //Show waiting
    cs.save.setWaiting(true);

    //Remove error
    cs.toggleFormErr("server_save_entry_form", null);

    //Queue the check so we have a cooldown
    cs.save.queuedValue = value;
    cs.current_settings.save_path = value;
    if(cs.save.cooldown != null) {
        //Restart the cooldown
        clearTimeout(cs.save.cooldown);
    }
    cs.save.cooldown = window.setTimeout(cs.save.submitOnType, 1000);
}

cs.save.submitOnType = function() {
    var value = cs.save.queuedValue;
    var map = config.compatible_maps[cs.current_settings.map_index];
    cs.save.cooldown = null;

    //Produce full testing path
    var path = document.getElementById('server_save_entry').value;
    if(path.substr(path.length-1) != "/" && path.substr(path.length-1) != "\\") {
        path += "/";
    }
    path += map.internal_name+".ark";

    //Send this request
    cs.save.latestId++;
    var id = cs.save.latestId;
    comms.tx(4, {
        "path":path,
        "rid":id.toString()
    });
}

cs.save.setWaiting = function(isWaiting) {
    var e = document.getElementById('server_save_entry_form_waiting');
    if(isWaiting) {
        e.style.display = "inline-block";
    } else {
        e.style.display = "none";
    }
}

cs.save.onTypeReply = function(msg) {
    //Check if this is the latest
    if(msg.rid != cs.save.latestId) {
        return;
    }

    //Hide waiting
    cs.save.setWaiting(false);

    //Check if ok
    var exists = msg.exists == "true";
    var isValid = msg.isValidArk == "true";
    if(exists && isValid) {
        //Ok!
        cs.pickNav(false, true);
    } else {
        //Show respective error
        if(exists) {
            cs.toggleFormErr("server_save_entry_form", "Exists, Invalid ARK file");
        } else {
            cs.toggleFormErr("server_save_entry_form", "File not Found");
        }
        
    }
}

//Final
cs.generateFinalConfig = function() {
    var conf = {
        "web_port":cs.current_settings.subserver_port,
        "debug_mode":false,
        "child_config":{
            "resources_url":"https://ark.romanport.com/resources",
            "save_map":config.compatible_maps[cs.current_settings.map_index].internal_name,
            "save_location":cs.current_settings.save_path,
            "base_permissions":[  
                "allowViewTamedTribeDinoStats",
                "allowSearchTamedTribeDinoInventories",
                "allowHeatmap",
                "allowHeatmapDinoFilter"
            ],
            "permissions_version":0
        },
        "auth":{  
            "creds":cs.current_settings.sub_server.server_creds,
            "id":cs.current_settings.sub_server.id
        }
    }
    return conf;
}

cs.submitFinal = function() {
    //Generate the final config
    var confString = JSON.stringify(cs.generateFinalConfig());

    //Upload this
    comms.tx(6, {
        "config":confString
    });
}

cs.finalRefreshLoop = null;
cs.onFinishSubmittingFinal = function() {
    //Shut down the connection to the sub-server
    comms.close();

    //Await the new server to appear in our users list by reloading our user data
    cs.finalRefreshLoop = window.setInterval(cs.finishSubmittingRefreshLoopFunc, 1500);
}

cs.finishSubmittingRefreshLoopFunc = function() {
    //Reload user data
    ark_users.refreshUserData(function(e) {
        //Check if our server exists here
        for(var i = 0; i<e.servers.length; i+=1) {
            var s = e.servers[i];
            if(s.id == cs.current_settings.sub_server.id) {
                //Finished.
                clearInterval(cs.finalRefreshLoop);
                window.location = "/app/#"+cs.current_settings.sub_server.id;
                break;
            }
        }
    }, function() {
    
    });
}

window.addEventListener('click', function(evt) {
	if(evt.path.length <= 3) {
        //Close. Send to parent
        window.parent.postMessage('message');
    }
});