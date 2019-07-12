var pform = {};

pform.show = function(items, title, okText, okCallback, cancelCallback, customClass) {
    //Create
    var e = main.createDom("div", "pform_body");
    if(customClass != null) {
        e.classList.add(customClass);
    }
    var content = main.createDom("div", "pform_content", e);
    var bottom = main.createDom("div", "pform_bottom", e);
    main.createDom("div", "pform_title", content).innerText = title;

    //Create bottom
    var okBtn = main.createDom("div", "master_btn master_btn_blue master_btn_rtl pform_bottom_btn_ok", bottom);
    var noBtn = main.createDom("div", "pform_bottom_btn_cancel", bottom);
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
                errs[i].remove();
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
    main.removeAllChildren(linkArea);
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
    var e = main.createDom("div", "pform_err");
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
    main.createDom("div", "pform_input_title", area).innerText = attrib.name;
    var i = main.createDom("input", "pform_input_input", area);
    i.type = "text";
    i.id = attrib.id;
}

pform.t_select = function(attrib, area, f) {
    main.createDom("div", "pform_input_title", area).innerText = attrib.name;
    var e = main.createDom("select", "pform_input_input pform_select", area);
    e.id = attrib.id;
    for(var i = 0; i<attrib.options.length; i+=1) {
        var o = attrib.options[i];
        var ee = main.createDom("option", "", e);
        ee.innerText = o.name;
        ee.value = o.value;
    }
}

pform.t_bottomsub = function(attrib, area, f) {
    main.createDom("div", "pform_bottomsubtext", area).innerText = attrib.text;
}

pform.typeMap = {
    "input":pform.t_input,
    "bottom":pform.t_bottomsub,
    "select":pform.t_select
}