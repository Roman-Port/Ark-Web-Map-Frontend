"use strict";

class DeltaPopoutModuleStatBars extends DeltaPopoutModuleCollapsable {

	constructor(dino) {
		super("Stats", true);
		this.dino = dino;
	}

	BuildCollapseArea(ctx, rootHolder) {
		var b = DeltaTools.CreateDom("div", "popoutm2_statbars");
		b.appendChild(this.CreateBar(0, this.dino.current_stats, this.dino.max_stats));
		b.appendChild(this.CreateBar(1, this.dino.current_stats, this.dino.max_stats));
		b.appendChild(this.CreateBar(4, this.dino.current_stats, this.dino.max_stats));
		b.appendChild(this.CreateBar(7, this.dino.current_stats, this.dino.max_stats));
		return b;
	}

	CreateBar(stat, currentValues, maxValues) {
		var b = DeltaTools.CreateDom("div", "popoutm2_statbars_bar");
		DeltaTools.CreateDom("div", "popoutm2_statbars_bar_progress", b).style.width = ((currentValues[stat] / maxValues[stat]) * 100).toString() + "%";
		DeltaTools.CreateDom("div", "popoutm2_statbars_bar_left", b, statics.STATUS_ENTRIES[stat].name);
		DeltaTools.CreateDom("div", "popoutm2_statbars_bar_right", b, statics.STATUS_ENTRIES[stat].formatString(currentValues[stat]) + " / " + statics.STATUS_ENTRIES[stat].formatString(maxValues[stat]));
		return b;
	}

}