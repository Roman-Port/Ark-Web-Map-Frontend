var next = "https://" + window.location.host + "/app/";
var args = delta.parseURLParams();
if (args["next"] != null) {
    next = args["next"];
}

function VerifyBetaKey() {
    var key = document.getElementById('beta_key_entry').value;
    SetBetaError("");
    delta.serverRequest(LAUNCH_CONFIG.API_ENDPOINT + "/auth/validate_beta_key?beta_key=" + encodeURIComponent(key), {}, (d) => {
        if (d.ok) {
            OpenLoginPrompt(key);
        } else {
            SetBetaError("Invalid Beta Key");
        }
    });
}

function SetBetaError(text) {
    document.getElementById('beta_key_error').innerText = text;
}

function OpenLoginPrompt(key) {
    //Create nonce
    var nonce = Math.floor(Math.random() * 999999).toString();

    //Save nonce
    localStorage.setItem("login_latest_nonce", nonce)

    //Go
    var url = LAUNCH_CONFIG.API_ENDPOINT + "/auth/steam_auth?next=" + encodeURIComponent(next) + "&type=" + LAUNCH_CONFIG.LOGIN_ENVIORNMENT_ID + "&nonce=" + nonce + "&beta_key=" + encodeURIComponent(key);
    window.location = url;
}

document.getElementById('login_box_btn').addEventListener("click", VerifyBetaKey);
document.getElementById('beta_key_entry').addEventListener("input", () => {
    SetBetaError("");
});