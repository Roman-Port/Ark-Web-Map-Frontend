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
		this.CreateKeyValue(b, "Tribe Name", tribe.tribe_name);
		this.CreateKeyValue(b, "Tribe ID", tribe.tribe_id);
		this.CreateKeyValue(b, "Tribe Last Seen", new moment(tribe.last_seen).format('MMMM Do, YYYY - h:mm A '));
		return b;
	}

	CreateKeyValue(parent, key, value) {
		var b = DeltaTools.CreateDom("div", "popoutm2_admin_keyvalue", parent);
		DeltaTools.CreateDom("div", "popoutm2_admin_key", b).innerText = key;
		DeltaTools.CreateDom("span", null, b).innerText = value;
		return b;
	}

	ShouldDisplay() {
		return this.server.adminEnabled;
	}

}