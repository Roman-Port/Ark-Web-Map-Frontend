var status_report = {};

status_report.begin = function(failCallback, headerCallback, statusCallback, finishCallback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.lastChunkIndex = 0;
    xmlhttp.hasFailed = false;
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //We finished. Restart it
            finishCallback();
            status_report.begin(failCallback, headerCallback, statusCallback, finishCallback);
        } else if(this.readyState == 4) {
            if(!this.hasFailed) {
                this.hasFailed = true;
                failCallback();
            }
        }
    }
    xmlhttp.onprogress = function () {
        //Get this chunk
        var data = this.responseText.substr(this.lastChunkIndex);
        var isFirstChunk = this.lastChunkIndex == 0;
        this.lastChunkIndex = this.responseText.length;
        
        //Parse each chunk inside of this. For unknown reasons, there are multiple sometimes
        var offset = 0;
        while(offset + 8 < data.length) {
            //Get length
            var len = parseInt(data.substr(offset, 8));
            if(isNaN(len)) {
                if(!this.hasFailed) {
                    this.hasFailed = true;
                    failCallback();
                }
                this.abort();
            }

            //Get payload
            var payload = data.substr(offset + 8, len);
            offset += 8 + len;
            
            //Handle this
            var decodedPayload = JSON.parse(payload);
            if(isFirstChunk) {
                headerCallback(decodedPayload);
            } else {
                statusCallback(decodedPayload);
            }
        }
    }
    xmlhttp.open("GET", "https://deltamap.net/api/status", true);
    xmlhttp.send();
    return xmlhttp.abort;
}

status_report.services = {};
status_report.ready = false;

status_report.create = function() {
    //Find area
    var a = document.getElementById('status_area');
    status_report.services = {};

    //Start
    status_report.begin(function() {
        status_report.setDisconnectMsg();
        status_report.tryReconnect();
    }, function(h) {
        //Create list
        a.innerHTML = "";
        for(var i = 0; i<h.length; i+=1) {
            var s = h[i];
            var e = status_report.createElement(s);
            status_report.services[s.id] = e;
            a.appendChild(e);
        }
        status_report.ready = true;
    }, function(d) {
        //Update
        var e = status_report.services[d.id];
        e._status_pearl.classList.remove("status_pearl_ok");
        e._status_pearl.classList.remove("status_pearl_bad");
        if(d.ok) {
            e._status_text.innerText = d.ping;
            e._status_pearl.classList.add("status_pearl_ok");
        } else {
            e._status_text.innerText = "--";
            e._status_pearl.classList.add("status_pearl_bad");
        }
        status_report.hideDisconnectMsg();
    }, function() {
        console.log("[Status] Resending request...");
    });
}

status_report.setDisconnectMsg = function() {
    var msg = "Can't connect. We will continue to retry.";
    if(status_report.ready) {
        msg = "Disconnected. Retrying...";
    }
    var b = document.getElementById('status_warning');
    b.classList.add("status_warning_shown");
    b.innerText = msg;
}

status_report.tryReconnect = function() {
    window.setTimeout(status_report.create, 1000);
}

status_report.hideDisconnectMsg = function() {
    var b = document.getElementById('status_warning');
    b.classList.remove("status_warning_shown");
    b.innerText = "";
}

status_report.createElement = function(d) {
    //Creates element and returns it.
    var e = delta.createDom("div", "service_box");
    delta.createDom("div", "service_title", e).innerText = d.name;
    delta.createDom("div", "service_description", e).innerText = d.description;
    var s = delta.createDom("div", "service_side", e);
    var status_container = delta.createDom("div", "service_status", s);
    e._status_pearl = delta.createDom("div", "status_pearl", status_container);
    e._status_text = delta.createDom("span", "serivce_status_ping", status_container);
    e._status_text.innerText = "--";
    delta.createDom("span", "serivce_status_ms", status_container).innerText = "ms";

    return e;
}