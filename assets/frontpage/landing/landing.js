function OnClickStartBtn() {
    //Show the frame
    document.body.classList.add("welcome_popup_active");
}

function OnClickInsideWelcomePopup(c) {
    //Identify if one of the buttons were pressed
    var target;
    for(var i = 0; i<c.path.length; i+=1) {
        target = c.path[i];
        if(target.classList == null) {
            continue;
        }
        if(target.classList.contains("welcome_popup_option_add")) {
            window.location = "/me/servers/create/";
            return;
        } else if (target.classList.contains("welcome_popup_option_join")) {
            window.location = "/app/";
            return;
        } else if (target.classList.contains("welcome_popup")) {
            return;
        }
    }

    //Hide the box
    document.body.classList.remove("welcome_popup_active");
    return;
}

function DoPreRegister() {
    var email = document.getElementById('preregister_email').value;
    if(email.length < 3) {
        return;
    }
    document.getElementById('preregister_email_box').remove();
    delta.serverRequest("https://deltamap.net/api/preregister", {
        "type":"POST",
        "body":JSON.stringify({
            "email":email
        })
    }, function(d) {
        document.getElementById('preregister_content').remove();
    });
}

//Add events
document.getElementsByClassName("welcome_popup_container")[0].addEventListener("click", OnClickInsideWelcomePopup);