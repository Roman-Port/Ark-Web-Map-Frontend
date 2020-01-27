"use strict";

class DeltaTools {

    constructor() {

    }

    static async WebRequest(url, args) {
        return new Promise(function (resolve, reject) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    //Get reply
                    var reply = this.responseText;
                    if (args.isJson === undefined || args.isJson === true) {
                        reply = JSON.parse(this.responseText);
                    }

                    //Callback
                    resolve(reply);
                } else if (this.readyState === 4) {
                    reject({
                        status: this.status
                    });
                }
            }
            if (args.type === undefined) {
                args.type = "GET";
            }
            xmlhttp.open(args.type, url, true);
            if (args.nocreds === undefined || !args.nocreds) {
                //Include auth
                xmlhttp.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("access_token"));
            }
            if (args.headers !== undefined) {
                var keys = Object.keys(args.headers);
                for (var i = 0; i < keys.length; i += 1) {
                    xmlhttp.setRequestHeader(keys[i], args.headers[keys[i]]);
                }
            }
            xmlhttp.send(args.body);
        });
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