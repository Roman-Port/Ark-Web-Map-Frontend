"use strict";

class DeltaPopoutModal {

	/* Represents a popout with modules, usually for a dino or structure */

	constructor(app, targetPosition, server, serverDatabase, databaseId, modulesCallback) {
		this.app = app;
		this.targetPosition = targetPosition;
		this.modules = [];
		this.modulesCallback = modulesCallback; //Callback to create this. Accepts (app, data, server)
		this.view = null;
		this.server = server;
		this.serverDatabase = serverDatabase; //The database used on the server, like "dinos"
		this.databaseId = databaseId; //The ID to check for from updates. Would be the dino id, for example

		//Create the DOM element
		this.view = DeltaTools.CreateDom("div", "popoutm2_container", this.app.mainHolder);
	}

	async Refresh(data) {
		//Subscribe
		this.serverDatabase.OnContentAddRemoved.Subscribe("deltawebmap.framework.views.popouts.DeltaPopoutModal.main", (p) => {
			for (var i = 0; i < p.adds.length; i += 1) {
				if (this.serverDatabase.GetContentUniqueKey(p.adds[i]) == this.databaseId) {
					this.Refresh(p.adds[i]);
				}
			}
		});

		//Get modules
		this.modules = this.modulesCallback(this.app, data, this.server);

		//Prepare view
		var b = this.view;

		//Clear
		while (b.firstChild != null) {
			b.firstChild.remove();
		}

		//Add event listener
		this.app.mainHolder._modal = this;
		this.app.mainHolder.addEventListener("mousedown", DeltaPopoutModal.OnDismissEvent);
		this.app.mainHolder.addEventListener("wheel", DeltaPopoutModal.OnDismissEvent);

		//Add each module and build them
		for (var i = 0; i < this.modules.length; i += 1) {
			if (this.modules[i].ShouldDisplay()) {
				b.appendChild(this.modules[i].Build(this, b));
			}
		}

		//Await an animation frame so we can measure the height
		await DeltaTools.AwaitAnimationFrame();
		
		//Update pos
		this.UpdatePos();
	}

	static OnDismissEvent(evt) {
		//Get this
		var ctx = evt.currentTarget._modal;

		//Check if this was an event inside of this modal
		var target = evt.target;
		while (target != null) {
			if (target == ctx.view) {
				return; //Ignore events on us
			}
			target = target.parentElement;
		}

		//Dismiss this
		ctx.OnDismissed();
	}

	OnDismissed() {
		//Remove events
		this.app.mainHolder.removeEventListener("mousedown", DeltaPopoutModal.OnDismissEvent);
		this.app.mainHolder.removeEventListener("wheel", DeltaPopoutModal.OnDismissEvent);

		//Remove element
		this.view.remove();

		//Unsubscribe
		this.serverDatabase.OnContentAddRemoved.Unsubscribe("deltawebmap.framework.views.popouts.DeltaPopoutModal.main");
	}

	OnResize() {
		DeltaTools.AwaitAnimationFrame().then(() => {
			this.UpdatePos();
		});
	}

	UpdatePos() {
		//Measure
		var height = this.view.offsetHeight;
		var width = this.view.offsetWidth;

		//Determine the location to render this so we make sure it is on-screen
		var x = Math.min(this.targetPosition.x + width, window.innerWidth) - width;
		var y = Math.min(this.targetPosition.y + height, window.innerHeight) - height;

		//Move the modal
		this.view.style.top = y.toString() + "px";
		this.view.style.left = x.toString() + "px";
	}

	static async ShowDinoModal(app, data, pos, server) {
		var modal = new DeltaPopoutModal(app, pos, server, server.dinos, data.dino_id, DeltaPopoutModal.CreateDinoModalData);
		await modal.Refresh(data);
	}

	static CreateDinoModalData(app, data, server) {
		//Lookup entry
		var entry = server.GetEntrySpecies(data.classname);

		//Get name
		var name = data.tamed_name;
		if (name.length == 0) {
			name = entry.screen_name;
		}

		//Add modules
		var modules = [
			new DeltaPopoutModuleTitle(entry.icon.image_url, name, entry.screen_name, data.dino_id),
			new DeltaPopoutModuleStatus(data),
			new DeltaPopoutModuleStatBars(data),
			new DeltaPopoutModuleAdmin(data, server),
			new DeltaPopoutModuleTribeColorTag(data, server),
			new DeltaPopoutModuleInventory(0, data.dino_id, 2),
			new DeltaPopoutModuleUpdated(data.last_sync_time, () => {
				server.ForceUpdateDino(data.dino_id);
			})
		];

		return modules;
    }

	static async ShowStructureModal(app, data, pos, server) {
		var modal = new DeltaPopoutModal(app, pos, server, server.structures, data.structure_id, DeltaPopoutModal.CreateStructureModalData);
		await modal.Refresh(data);
	}

	static CreateStructureModalData(app, data, server) {
		//Get defaults
		var name = data.classname;
		var icon = "https://icon-assets.deltamap.net/unknown_dino.png";

		//Lookup entry
		var item = server.GetEntryItemByStructureClassName(data.classname);
		if (item != null) {
			name = item.name;
			icon = item.icon.image_url;
		}

		//Add modules
		var modules = [
			new DeltaPopoutModuleTitle(icon, name, "Structure", data.structure_id.toString()),
			new DeltaPopoutModuleAdmin(data, server),
			new DeltaPopoutModuleInventory(1, data.structure_id, 4),
			new DeltaPopoutModuleUpdated(data.last_sync_time, null)
		];

		return modules;
	}

}