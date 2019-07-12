var login = {};

login.isSignUp = false;
login.imageToken = null;

login.serverRequest = function(url, body, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var reply = JSON.parse(this.responseText);
            callback(reply);
        } else if(this.readyState == 4) {
            alert("Failed to connect to server.");
        }
    }
    xmlhttp.open("post", url, true);
    xmlhttp.send(body);
}

login.toggleSignUp = function() {

    login.isSignUp = !login.isSignUp;
    if(login.isSignUp) {
        document.getElementById('sign_in_btn').innerText = "Sign Up";
        document.getElementById('create_btn').innerText = "Existing Account";
        document.getElementById('create_area').classList.remove("hidden");
        document.getElementById('login_subtext').innerText = "Create a provider account to manage multiple DeltaWebMap servers via our interface or API.";
    } else {
        document.getElementById('sign_in_btn').innerText = "Sign In";
        document.getElementById('create_btn').innerText = "Create Account";
        document.getElementById('create_area').classList.add("hidden");
        document.getElementById('login_subtext').innerText = "Sign in with your provider username and password, or create an account.";
    }

}

login.clearFormErrors = function() {
    var d = document.getElementsByClassName("form_err");
    for(var i = 0; i<d.length; i+=1) {
        d[i].innerText = "";
    }
}

login.submit = function() {
    //Create body
    var body = {
        "email":document.getElementById('username').value,
        "password":document.getElementById('password').value,
        "name":document.getElementById('name').value,
        "img_token":login.imageToken
    };

    //Find URL
    var url = "https://ark.romanport.com/api/auth/providers/";
    if(login.isSignUp) {
        url+="signup";
    } else {
        url+="signin";
    }

    //Hide errors
    login.clearFormErrors();

    //Submit
    login.serverRequest(url, JSON.stringify(body), function(c) {
        if(c.ok) {
            //Set auth header
            localStorage.setItem("provider_access_token", c.token);

            //Go
            window.location = "/manage/";
        } else {
            //Show error
            document.getElementById(c.element+'_err').innerText = c.msg;
        }
    });
}