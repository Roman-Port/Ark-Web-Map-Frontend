"use strict";

class DeltaTools {

    constructor() {

    }

    static async _BaseWebRequest(url, type, method, body, token) {
        if (token === undefined || token == null) {
            console.warn("WARNING: WebRequest launched without a DeltaCancellationToken!");
            token = new DeltaCancellationToken(null);
        }

        return new Promise(function (resolve, reject) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    if (token.IsValid()) {
                        resolve(this.response);
                    }
                } else if (this.readyState === 4) {
                    if (token.IsValid()) {
                        //Check if we're logged out
                        if (this.status == 401) {
                            var url = "/login/?next=" + encodeURIComponent(document.location.href);
                            window.location = url;
                        }
                        reject({
                            status: this.status
                        });
                    }
                }
            }
            xmlhttp.open(method, url, true);
            xmlhttp.responseType = type;
            xmlhttp.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("access_token"));
            xmlhttp.send(body);
        });
    }

    static async WebRequest(url, args, token) {
        /* Legacy; Launches with a JSON response */
        
        //Get type
        var type = "GET";
        if (args.type !== undefined) {
            type = args.type;
        }

        //Launch
        var r = await DeltaTools._BaseWebRequest(url, "text", type, null, token);
        return JSON.parse(r);
    }

    static async WebRequestBinary(url, token) {
        /* Responds with a DataView to use */

        //Launch
        var r = await DeltaTools._BaseWebRequest(url, "arraybuffer", "GET", null, token);
        return new DataView(r);
    }

    static CreateDom(type, classname, parent, text) {
        var e = document.createElement(type);
        e.className = classname;
        if (parent !== undefined) {
            parent.appendChild(e);
        }
        if (text !== undefined) {
            e.innerText = text;
        }
        /*if (true) {
            e.style.backgroundColor = "rgb(" + (Math.random() * 254) + ", " + (Math.random() * 254) + ", " + (Math.random() * 254) + ")";
        }*/
        return e;
    }

    static CreateNumberWithCommas (data) {
        //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        return Math.round(data).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static CreateStatusBox(status, container) {
        var e = DeltaTools.CreateDom("div", "status_box_display", container);
        var s = statics.STATUS_STATES[status];
        e.innerText = s.text;
        e.style.color = s.modal_color;

        return e;
    }

    static RemoveClassFromClassNames(container, search, target) {
        var e = container.getElementsByClassName(search);
        for (var i = 0; i < e.length; i += 1) {
            e[i].classList.remove(target);
        }
    }

}