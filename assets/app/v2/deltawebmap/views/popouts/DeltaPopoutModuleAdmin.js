"use strict";

class DeltaPopoutModuleAdmin extends DeltaPopoutModuleCollapsable {

	constructor(entity, server) {
		super("Admin Panel", true);
		this.entity = entity;
		this.server = server;
	}

	BuildCollapseArea(ctx, rootHolder) {
		//Get info
		var tribe = this.server.GetTribeByIdSafe(this.entity.tribe_id);

		var b = DeltaTools.CreateDom("div", "popoutm2_admin");

		//Create values
		this.CreateKeyValue(b, "Tribe Name", tribe.tribe_name);
		this.CreateKeyValue(b, "Tribe ID", tribe.tribe_id);
		this.CreateKeyValue(b, "Tribe Last Seen", new moment(tribe.last_seen).format('MM/DD/YYYY h:mm A '));

		//Create buttons
		var btnHolderTop = DeltaTools.CreateDom("div", "popoutm2_admin_btn_area popoutm2_admin_btn_area_top", b);
		var btnHolder = DeltaTools.CreateDom("div", "popoutm2_admin_btn_area", b);
		this.CreateAdminButton(btnHolderTop, "Copy Teleport Command", "/assets/app/icons/modal_popout/admin/copy.svg", () => {
			DeltaTools.CopyToClipboard("admincheat fly | admincheat SetPlayerPos " + this.entity.location.x + " " + this.entity.location.y + " " + this.entity.location.z);
		});
		this.CreateAdminButton(btnHolder, "Transfer...", "/assets/app/icons/modal_popout/admin/transfer.svg", () => {

		});
		this.CreateAdminButton(btnHolder, "Teleport...", "/assets/app/icons/modal_popout/admin/teleport.svg", () => {

		});

		return b;
	}

	CreateKeyValue(parent, key, value) {
		var b = DeltaTools.CreateDom("div", "popoutm2_admin_keyvalue", parent);
		DeltaTools.CreateDom("div", "popoutm2_admin_key", b).innerText = key;
		DeltaTools.CreateDom("span", null, b).innerText = value;
		return b;
	}

	CreateAdminButton(parent, text, icon, action) {
		var b = DeltaTools.CreateDom("div", "popoutm2_admin_btn", parent);
		DeltaTools.CreateDom("img", null, b).src = icon;
		DeltaTools.CreateDom("span", null, b, text);
		b.addEventListener("click", action);
    }

	ShouldDisplay() {
		return this.server.adminEnabled;
	}

}