"use strict";

class PopoutPartStats extends PopoutPart {

    /* Represents the title of something */

    /* Adapter requirements: 
        maxStats [FLOAT[]]
            Maximum stats as an array
        currentStats [FLOAT[]]
            Current stats as an array
        status [STRING]
            Status of the dino
     */

    constructor() {
        super();
    }

    Generate(e, server, data) {
        e.classList.add("popout_content");
        this.GenerateStatsBox(DeltaTools.CreateDom("div", "", e), data);
        this.GenerateMiniStatsBox(e, data);
    }

    GenerateStatsBox(container, data) {
        this.GenerateStatsBar(container, statics.ARK_DINO_STAT.Health, data.maxStats, data.currentStats);
        this.GenerateStatsBar(container, statics.ARK_DINO_STAT.Stamina, data.maxStats, data.currentStats);
        this.GenerateStatsBar(container, statics.ARK_DINO_STAT.Weight, data.maxStats, data.currentStats);
        this.GenerateStatsBar(container, statics.ARK_DINO_STAT.Food, data.maxStats, data.currentStats);
    }

    GenerateMiniStatsBox(container, data) {
        var e = DeltaTools.CreateDom("ul", "popout_staticstats_container", container);

        this.GenerateMiniStatsBar(e, statics.ARK_DINO_STAT.MeleeDamageMultiplier, data.maxStats);
        DeltaTools.CreateDom("li", "popout_staticstats_break", e);
        this.GenerateMiniStatsBar(e, statics.ARK_DINO_STAT.Oxygen, data.maxStats);
        DeltaTools.CreateDom("li", "popout_staticstats_break", e);
        this.GenerateMiniStatsBar(e, statics.ARK_DINO_STAT.SpeedMultiplier, data.maxStats);

        DeltaTools.CreateStatusBox(data.status, e).classList.add("status_box_display_statbox");
    }

    GenerateStatsBar(container, index, maxStatsArray, currentStatsArray) {
        var e = DeltaTools.CreateDom("div", "stats_item stats_item_tweaked", container);

        //Get data
        var data = statics.STATUS_ENTRIES[index];
        var max = maxStatsArray[index];
        var value = currentStatsArray[index];

        //Create the var
        DeltaTools.CreateDom("div", "stats_item_bar", e).style.width = ((value / max) * 100).toString() + "%";

        //Create content
        var content = DeltaTools.CreateDom("div", "stats_item_content", e);
        DeltaTools.CreateDom("img", "", content).src = data.icon;
        DeltaTools.CreateDom("div", "title", content).innerText = data.name;
        DeltaTools.CreateDom("div", "amount", content).innerText = DeltaTools.CreateNumberWithCommas(value) + " / " + DeltaTools.CreateNumberWithCommas(max);
    }

    GenerateMiniStatsBar(container, index, dataArray) {
        var e = DeltaTools.CreateDom("li", "popout_staticstats_s", container);
        e.innerText = statics.STATUS_ENTRIES[index].formatString(dataArray[index]);
        DeltaTools.CreateDom("img", "popout_staticstats_s_icon", e).src = statics.STATUS_ENTRIES[index].icon;
    }

}