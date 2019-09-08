var form = {};

form.ANIMATION_TIME_MS = 70;

form.stack = [];

form.area = document.getElementById('xform_area');

form.add = function(title, bodyOptions, options, style, extra) { //String, Array, Array, Object
    //Ensure we have focus. Style should either be xform_area_interrupt or xform_area_dim
    form._show(style);

    //Make sure extras is added
    if(extra == null) {
        extra = {};
    }

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
        btn.x_container = container;
        btn.x_do_hide = o.do_hide; //If false, do not remove this from the stack. Default true
        btn.addEventListener("click", form._onBtnPressed);
    }

    //Add options
    main.createDom("div", "xform_e_title", body).innerText = title;
    var pack = {};
    for(var i = 0; i<bodyOptions.length; i+=1) {
        var ele = form._makeElement(body, bodyOptions[i]);
        if(bodyOptions[i].id != null) {
            pack[bodyOptions[i].id] = ele;
        }
    }
    container.x_pack = pack;

    //Now, push to stack
    if(extra.pop_under == true) {
        //Push it under this one
        form.stack.splice(form.stack.length - 1, 0, container);
    } else {
        //Go now
        form._push(container);
    }
}

form.pop = function() {
    //Pops the latest element
    //Hide
    form._hideStackIndex(form.stack.length - 1);
    form.stack.splice(form.stack.length - 1, 1);
    
    //Hide all, or show the one under this
    if(form.stack.length == 0) {
        form._hide();
    } else {
        form._showStackIndex(form.stack.length - 1);
    }
}

form._onBtnPressed = function() {
    if(this.x_do_hide == null || this.x_do_hide == true) {
        form.pop();
    }
    this.x_callback(this.x_container.x_pack);
}

form._show = function(style) {
    //Shows the form area
    main.setClass(form.area, "xform_area_interrupt", false);
    main.setClass(form.area, "xform_area_dim", false);

    main.setClass(form.area, "xform_area_active", true);
    main.setClass(form.area, style, true);
    form.area.x_style = style;
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

form._e_text = function(e, options) {
    //text: Text to be displayed
    var a = main.createDom("div", "xform_e_text", e);
    a.innerText = options.text;
    return a;
}

form._e_html = function(e, options) {
    //text: Text to be displayed
    var a = main.createDom("div", "xform_e_text", e);
    a.innerHTML = options.html;
    return a;
}

form._e_server_list = function(e, options) {
    //include_add: Should include add button? (Bool)
    var onClick = function() {
        var id = this.x_id;
        form.pop();
        var status = ark.initAndVerify(ark.getServerDataById(id), false, function() {
            ark.showServerPicker();
        });
    };
    var a = main.createDom("div", "xform_e_serverpicker", e);
    var okServers = 0;
    for(var i = 0; i<main.me.servers.length; i+=1) {
        var s = main.me.servers[i];
        if(ark.verify(s, false, false, null)) {
            main.makeServerEntry(a, s.id, s.display_name, s.map_name, s.image_url, onClick);
            okServers+=1;
        }
    }
    if(main.me.servers.length == 0) {
        main.createDom("div", "xform_e_serverpicker_none", a).innerText = "No servers on account. Join an Ark server!";
    } else if (okServers == 0) {
        //We have servers, but none of them are compatible
        var msg = main.createDom("div", "xform_e_serverpicker_none", a);
        msg.innerText = "No compatible, up to date, servers. ";
        main.createLink(msg, "More info.", "/"); //TODO
    }
    if(options.include_add) {
        var add = main.createDom("div", "xform_e_serverpicker_add", a);
        add.innerText = "Add ARK Server";
        add.addEventListener("click", main.createServer);
    }
    return a;
}

form._e_input = function(e, options) {
    var a = main.createDom("input", "xform_e_input", e);
    a.type = "text";
    a.placeholder = options.placeholder;
    return a;
}

form._e_input = function(e, options) {
    var t = main.createDom("div", "xform_e_input_text", e);
    t.innerText = options.name;
    var a = main.createDom("input", "xform_e_input", e);
    a.type = "text";
    a.placeholder = options.placeholder;
    return a;
}

form._e_select = function(e, options) {
    var t = main.createDom("div", "xform_e_input_text", e);
    t.innerText = options.name;
    var a = main.createDom("select", "xform_e_input", e);
    for(var i = 0; i<options.options.length; i+=1) {
        var o = main.createDom("option", "", a);
        o.innerText = options.options[i].name;
        o.value = options.options[i].value;
    }
    return a;
}

form._e_big_input = function(e, options) {
    var t = main.createDom("div", "xform_e_input_text", e);
    t.innerText = options.name;
    var a = main.createDom("textarea", "xform_e_big_input", e);
    a.placeholder = options.placeholder;
    return a;
}

form._e_img = function(e, options) {
    var a = main.createDom("img", "xform_e_img", e);
    a.src = options.src;
    return a;
}

form._ELEMENTS = {
    "text":form._e_text,
    "html":form._e_html,
    "server_list":form._e_server_list,
    "input":form._e_input,
    "big_input":form._e_big_input,
    "img":form._e_img,
    "select":form._e_select
};

form._makeElement = function(e, options) {
    return form._ELEMENTS[options.type](e, options);
}