var analytics = {};

var APP_VERSION_NAME = "dev-1";

analytics.send_payload = function(url, type, payload, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var reply = JSON.parse(this.responseText);
            callback(reply);
        } else if(this.readyState == 4) {
            //Failed...
        }
    }
    xmlhttp.open(type, url, true);
    xmlhttp.send(payload);
}

analytics.get_base = function(view) {
    return {
        "access_token":localStorage.getItem("access_token"),
        "client_name":"web-portable",
        "client_version":APP_VERSION_NAME,
        "client_view":view,
        "client_details":navigator.userAgent
    }
}

analytics.action = function(topic, view, extras, callback) {
    var p = analytics.get_base(view);
    p.topic = topic;
    p.server_id = null;
    p.server_online = false;
    p.extras = extras;

    if(ark != null) {
        p.server_id = ark.currentServerId;
        p.server_online = ark.isCurrentServerOnline;
    }

    analytics.send_payload("https://web-analytics.deltamap.net/v1/action", "POST", JSON.stringify(p), function(d) {
        if(callback != null) {
            callback(d);
        }
    });
}