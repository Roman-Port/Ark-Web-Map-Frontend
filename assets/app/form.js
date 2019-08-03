var form = {};

form.ANIMATION_TIME_MS = 200;

form.stack = [];

form.area = document.getElementById('xform_area');

form.add = function(title, bodyOptions, options, style) { //String, Array, Array, Object
    //Ensure we have focus
    form._show();

    //Create a form element
    var container = main.createDom("div", "xform_element", form.area);
    var box = main.createDom("div", "xform_element_box", container);
    var nav = main.createDom("div", "xform_element_nav", box);
    var body = main.createDom("div", "xform_element_body", box);

    //Add nav
    for(var i = 0; i<options.length; i+=1) {
        var o = options[i]; //{Name, Type, Callback}
        var classname = "master_btn master_btn_blue master_btn_rtl pform_bottom_btn_ok";
        if(o.type == 1) {
            classname = "pform_bottom_btn_cancel";
        }
        var btn = main.createDom("div", classname, nav);
        btn.innerText = o.name;
        btn.x_callback = o.callback;
        btn.x_name = o.name;
        btn.addEventListener("click", form._onBtnPressed);
    }

    //Add options
    body.innerText = title;

    //Now, push to stack
    form._push(container);
}

form._onBtnPressed = function() {
    console.log("pressed");
}

form._show = function() {
    //Shows the form area
    main.setClass(form.area, "xform_area_active", true);
}

form._hide = function() {
    //Hides the form area
    main.setClass(form.area, "xform_area_active", false);
}

form._push = function(e) {
    //Pushes an element on the stack
    //Check if we should hide the element before us
    if(form.stack.length > 0) {
        form._hideStackIndex(form.stack.length - 1);
    }

    var after = function() {
        //Push this to stack and show it
        form.stack.push(e);
        form._showStackIndex(form.stack.length - 1);
    };

    //Check if we should wait to continue or go now
    if(form.stack.length > 0) {
        window.setTimeout(after, form.ANIMATION_TIME_MS);
    } else {
        after();
    }
}

form._hideStackIndex = function(index) {
    //Hides an element on the stack
    form.stack[index].classList.remove("xform_element_shown");
    form.stack[index].classList.add("xform_element_hidden");
}

form._showStackIndex = function(index) {
    //Hides an element on the stack
    form.stack[index].classList.remove("xform_element_hidden");
    form.stack[index].classList.add("xform_element_shown");
}