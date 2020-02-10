var next = "https://" + window.location.host + "/app/";
var args = delta.parseURLParams();
if (args["next"] != null) {
    next = args["next"];
}

function OpenLoginPrompt() {
    //Create nonce
    var nonce = Math.floor(Math.random() * 999999).toString();

    //Save nonce
    localStorage.setItem("login_latest_nonce", nonce)

    //Go
    var url = LAUNCH_CONFIG.API_ENDPOINT + "/auth/steam_auth?next=" + encodeURIComponent(next) + "&type=" + LAUNCH_CONFIG.LOGIN_ENVIORNMENT_ID + "&nonce=" + nonce;
    window.location = url;
}

document.getElementById('login_box_btn').addEventListener("click", OpenLoginPrompt);