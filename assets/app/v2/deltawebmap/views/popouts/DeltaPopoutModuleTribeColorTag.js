"use strict";

class DeltaPopoutModuleTribeColorTag extends DeltaPopoutModuleCollapsable {

	constructor(dino, server) {
		super("Tribe Tag", true);
		this.dino = dino;
		this.server = server;
	}

	BuildCollapseArea(ctx, rootHolder) {
		var b = DeltaTools.CreateDom("div", "popoutm2_colortag_holder");
		b.appendChild(this.CreateTag("#252629", this.dino.tribe_prefs.color_tag, true));
		for (var i = 0; i < statics.COLOR_TAGS.length; i += 1) {
			b.appendChild(this.CreateTag(statics.COLOR_TAGS[i], this.dino.tribe_prefs.color_tag, false));
        }
		return b;
	}

	CreateTag(colorCode, currentColor, isClear) {
		var b = DeltaTools.CreateDom("div", "popoutm2_colortag_tag");
		b.style.backgroundColor = colorCode;
		b._value = colorCode;

		//Set flags
		if (isClear) {
			//Is special
			b.classList.add("popoutm2_colortag_tag_clear");
			b._value = null;
        }
		if (currentColor == colorCode || (currentColor == null && isClear)) {
			//Checked
			b.classList.add("popoutm2_colortag_tag_selected");
		}

		//Add event
		b.addEventListener("click", (e) => {
			//Set
			this.dino.tribe_prefs.color_tag = e.target._value;

			//Apply
			this.server.PushDinoPrefs(this.dino);
		});

		return b;
	}

}