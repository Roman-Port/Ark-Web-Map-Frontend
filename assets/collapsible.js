var collap = {};

collap.items = {
    "right_sidebar": {
        "is_open":true,
        "element":document.getElementById('dino_sidebar_container'),
        "open_class":"dino_sidebar_open",
        "effected_elements":[
        ]
    },
    "left_sidebar": {
        "is_open":true,
        "element":document.getElementById('sidebar_part'),
        "open_class":"sidebar_part_active",
        "effected_elements":[
            {
                "element":document.getElementById('map_part'),
                "open_class":"map_part_active_leftsidebar"
            },
            {
                "element":document.getElementById('bottom_modal'),
                "open_class":"map_part_active_leftsidebar"
            }
        ]
    },
    "dino_modal": {
        "is_open":false,
        "element":document.getElementById('bottom_modal'),
        "open_class":"bottom_modal_active",
        "effected_elements":[
            {
                "element":document.getElementById('map_part'),
                "open_class":"map_modal"
            }
        ],
        "openCallback":function() {
            //Move nav
            var nav = document.getElementsByClassName('leaflet-top');
            if(nav.length > 0) {
                nav[0].classList.add("nav_offset");
            }
        },
        "closeCallback":function() {
            //Move nav
            var nav = document.getElementsByClassName('leaflet-top');
            if(nav.length > 0) {
                nav[0].classList.remove("nav_offset");
            }
        }
    },
    "warning_banner": {
        "is_open":false,
        "element":document.getElementById('warning_top'),
        "open_class":"warning_top_active",
        "effected_elements":[
            {
                "element":document.getElementById('main_view'),
                "open_class":"main_view_warningbar"
            }
        ]
    },
    "fs_popup": {
        "is_open":false,
        "element":document.getElementById('fs_popup'),
        "open_class":"fs_popup_active",
        "effected_elements":[
            {
                "element":document.getElementById('main_view'),
                "open_class":"fs_popup_active_bg"
            }
        ]
    },
    "ui_hub": {
        "is_open":true,
        "element":document.getElementById('ui_hub'),
        "open_class":"fs_popup_active",
        "effected_elements":[
            {
                "element":document.getElementById('main_view'),
                "open_class":"fs_popup_active_bg"
            }
        ]
    }
}

collap.onResizeFunctions = [
    map_menu.resizeMenu
]

collap.setOrRemoveClassname = function(ele, className, isActive) {
    if(isActive) {
        ele.classList.add(className);
    } else {
        ele.classList.remove(className);
    }
}

collap.setState = function(tagName, isOpen) {
    //Get the item
    var item = collap.items[tagName];

    //Apply or remove open class
    collap.setOrRemoveClassname(item.element, item.open_class, isOpen);

    //Apply to items effected by this
    for(var i = 0; i<item.effected_elements.length; i+=1) {
        var effect = item.effected_elements[i];

        //Apply or remove open class
        collap.setOrRemoveClassname(effect.element, effect.open_class, isOpen);
    }

    //Set some timers
    for(var i = 0; i<6; i+=1) {
        window.setTimeout(collap.triggerResizeFunctionEvents, 50 * (i + 1));
    }

    //Call callbacks
    if(isOpen && item.openCallback != null) {
        item.openCallback();
    }
    if(!isOpen && item.closeCallback != null) {
        item.closeCallback();
    }

    //Set state
    collap.items[tagName].is_open = isOpen;
}

collap.triggerResizeFunctionEvents = function() {
    for(var i = 0; i<collap.onResizeFunctions.length; i+=1) {
        collap.onResizeFunctions[i]();
    }
}

collap.toggle = function(tagName) {
    //Set state
    collap.setState(tagName, !collap.items[tagName].is_open);
}