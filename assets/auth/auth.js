async function WebPost(url, method, body) {
    return new Promise(function (resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                resolve(JSON.parse(this.response));
            } else if (this.readyState === 4) {
                reject({
                    status: this.status
                });
            }
        }
        xmlhttp.open(method, url, true);
        xmlhttp.send(body);
    });
}

function CreateDom(type, classname, parent, text) {
    var e = document.createElement(type);
    if (classname != null) {
        e.className = classname;
    }
    if (parent != null) {
        parent.appendChild(e);
    }
    if (text != null) {
        e.innerText = text;
    }
    return e;
}

function ParseURLParams() {
    try {
        var query = window.location.search;
        var objects = String(query).trim("?").split("&");
        var i = 0;
        var keys = [];
        var obj = {};
        while (i < objects.length) {
            try {
                var o = objects[i];
                //Trim beginning
                o = o.replace("?", "").replace("&", "");
                //Split by equals.
                var oo = o.split("=");
                keys.push(oo[0]);
                //Uri decode both of these
                var key = decodeURIComponent(oo[0]);
                var value = decodeURIComponent(oo[1]);
                obj[key] = value;
            } catch (e) {

            }
            i += 1;
        }
        return obj;
    } catch (ex) {
        return {};
    }
}

function RemoveLoader() {
    document.getElementById('loader').remove();
}

async function Init() {
    //Fetch config
    var config = null;
    try {
        config = await WebPost(window.LAUNCH_CONFIG.CONFIG_API_ENDPOINT + "/" + window.LAUNCH_CONFIG.CONFIG_ENV + "/frontend/config.json", "GET", null);
    } catch (e) {
        Reject("Couldn't fetch config file from the server.");
        return;
    }

    //Decode URL params
    var params = ParseURLParams();

    //Create nonce
    var nonce = "";
    for (var i = 0; i < 24; i += 1) {
        nonce += String.fromCharCode(Math.round(Math.random() * 25) + 65);
    }
    localStorage.setItem("delta_logon_nonce", nonce);

    //Fetch data
    var response = null;
    try {
        response = await WebPost(window.LAUNCH_CONFIG.API_ENDPOINT + "/auth/begin", "POST", JSON.stringify({
            "nonce": nonce,
            "referrer": document.referrer,
            "application_id": params.client_id,
            "custom": params.payload,
            "scope": params.scope
        }));
    } catch (e) {
        Reject("Couldn't fetch oauth data from the server.");
        return;
    }

    //Check if it failed
    if (!response.ok) {
        Reject(response.fail_reason);
        return;
    }
    var data = response.session;

    //Create the area
    RemoveLoader();
    var a = CreateDom("div", "content auth_content", document.body);

    //Change based on if this is official or not
    if (data.app.is_official) {
        //Create official title and description
        CreateDom("div", "auth_title_official", a, "Sign into Delta Web Map");
        CreateDom("div", "official_description", a, "To connect you to the ARK servers you've joined, we need to verify your Steam account.");
    } else {
        //Create title
        var title = CreateDom("div", "auth_area", a);
        CreateDom("div", "auth_title_sub", title, "Sign in with Delta Web Map to");
        CreateDom("div", "auth_title_app", title, data.app.title);

        //Create third-party permissions screen
        var perms = CreateDom("div", "auth_area", a);
        var permsText = CreateDom("span", null, perms);
        CreateDom("span", null, permsText, "You'll be giving this ");
        CreateDom("u", null, permsText, "third-party");
        CreateDom("span", null, permsText, " application access to the following permissions on your Delta Web Map account. You can revoke it at any time.");

        //Permissions
        var permsList = CreateDom("ul", null, perms);
        for (var i = 0; i < 31; i += 1) {
            if (((data.scope >> i) & 1) == 1) {
                CreateDom("li", null, permsList, config.oauth_scopes[i].name);
            }
        }

        //App ownership
        var owner = CreateDom("div", "auth_owner_container", perms);
        CreateDom("div", "verified_badge", owner, "VERIFIED"); //Verifed badge
        CreateDom("img", "app_owner_img", owner).src = data.app.author_icon;
        var ownerText = CreateDom("span", null, owner, "Application created " + moment(data.app.creation_date).fromNow() + " by ");
        CreateDom("span", "app_owner_name", ownerText, data.app.author_name);
    }
    
    //Create signin button
    var actions = CreateDom("div", null, a);

    var signinBtn = CreateDom("a", "nounderline", actions);
    CreateDom("div", "accept_btn", signinBtn, "Sign in with Steam");
    signinBtn.href = data.next_url;

    var tos = CreateDom("div", "accept_tos", actions, "By signing in, you agree to our ");
    var tosBtn = CreateDom("a", null, tos, "Privacy Policy");
    tosBtn.href = "/privacy/";
    tosBtn.target = "_blank";
}

function Reject(message) {
    //Create the area
    RemoveLoader();
    var a = CreateDom("div", "content auth_content", document.body);
    CreateDom("div", "auth_fail_title", a, "There was an error");
    CreateDom("div", null, a, message);
}

Init();