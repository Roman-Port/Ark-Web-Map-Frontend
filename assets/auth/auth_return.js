async function FinishLogon() {
    try {
        //Finalize login
        var auth = await WebPost(window.LAUNCH_CONFIG.API_ENDPOINT + "/auth/validate", {
            "oauth_token": ParseURLParams().oauth_token,
            "client_id": window.LAUNCH_CONFIG.AUTH.AUTH_CLIENT_ID,
            "client_secret": window.LAUNCH_CONFIG.AUTH.AUTH_CLIENT_SECRET
        });

        //Make sure that the scope is correct
        if (auth.scope != 4294967295) {
            Reject("Scope error. Please sign in again.");
            return;
        }

        //Set token
        localStorage.setItem("access_token", auth.token);

        //Redirect
        window.location = "/app/";
    } catch (e) {
        Reject("Auth error. Please sign in again.");
    }
}

function Reject(msg) {
    RemoveLoader();
    var a = CreateDom("div", "content auth_content", document.body);
    CreateDom("div", "auth_fail_title", a, "There was an error");
    CreateDom("div", null, a, message);
    CreateDom("div", "accept_btn", a, "Try Again").addEventListener("click", () => {
        window.location = "/auth/?client_id=" + window.LAUNCH_CONFIG.AUTH.AUTH_CLIENT_ID;
    });
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

async function WebPost(url, body) {
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
        xmlhttp.open("POST", url, true);
        xmlhttp.send(JSON.stringify(body));
    });
}

FinishLogon();