"use strict";

class PopoutPartTitle extends PopoutPart {

    /* Represents the title of something */

    /* Adapter requirements: 
        title [STRING]
            The title displayed
        subtitle [STRING]
            The subtitle
        icon [URL]
            URL to the icon
     */

    constructor() {
        super();
    }

    Generate(e, server, data) {
        e.classList.add("popout_name");
        DeltaTools.CreateDom("div", "popout_name_title", e).innerText = data.title;
        DeltaTools.CreateDom("div", "popout_name_sub", e).innerText = data.subtitle;
        DeltaTools.CreateDom("div", "popout_icon_v2", e).style.backgroundImage = "url('"+data.icon+"')";
    }

}