var pform = {};

pform.show = function(items, title, okText, okCallback, cancelCallback) {
    //Create
    var e = ark.createDom("div", "pform_body");
    var content = ark.createDom("div", "pform_content", e);
    var bottom = ark.createDom("div", "pform_bottom", e);
    ark.createDom("div", "pform_title", content).innerText = title;

    //Create bottom
    var okBtn = ark.createDom("div", "master_btn master_btn_blue master_btn_rtl pform_bottom_btn_ok", bottom);
    var noBtn = ark.createDom("div", "pform_bottom_btn_cancel", bottom);
    okBtn.innerText = okText;
    noBtn.innerText = "Cancel";
    okBtn.addEventListener("click", function() {
        var result = okCallback(e);
        //If the result is null, close. If not, there is a problem.
        if(result == null) {
            pform.dismiss();
        } else {
            //Remove existing errors
            var errs = document.getElementsByClassName('pform_err');
            for(var i = 0; i<errs.length; i+=1) {
                errs.remove();
            }
            //Add errors
            for(var i = 0; i<result.length; i+=1) {
                pform.processReturnedProblem(result[i]);
            }
        }
    });
    noBtn.addEventListener("click", function() {
        cancelCallback(e);
        pform.dismiss();
    });

    //Add elements
    for(var i = 0; i<items.length; i+=1) {
        var u = items[i];
        pform.typeMap[u.type](u, content, e);
    }

    //Show it on the screen
    var linkArea = document.getElementById('pform_area_link');
    ark.removeAllChildren(linkArea);
    linkArea.appendChild(e);
    document.getElementById('pform_area').classList.add("pform_area_active");
}

pform.dismiss = function() {
    //Hide it on the screen
    document.getElementById('pform_area').classList.remove("pform_area_active");
}

pform.processReturnedProblem = function(p) {
    //Add an alert after some id
    var id = p.id;
    var errid = id+"_err";
    var e = ark.createDom("div", "pform_err");
    e.innerText = p.text;
    var r = document.getElementById(id);
    var n = r.nextSibling;
    if(n == null) {
        r.parentElement.appendChild(e);
    } else {
        r.parentElement.insertBefore(e, n);
    }
}

pform.t_input = function(attrib, area, f) {
    ark.createDom("div", "pform_input_title", area).innerText = attrib.name;
    var i = ark.createDom("input", "pform_input_input", area);
    i.type = "text";
    i.id = attrib.id;
}

pform.t_bottomsub = function(attrib, area, f) {
    ark.createDom("div", "pform_bottomsubtext", area).innerText = attrib.text;
}

pform.typeMap = {
    "input":pform.t_input,
    "bottom":pform.t_bottomsub
}