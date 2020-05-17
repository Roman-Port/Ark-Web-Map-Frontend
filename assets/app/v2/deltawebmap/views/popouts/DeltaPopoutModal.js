"use strict";

class DeltaPopoutModal {

	/* Represents a popout with modules, usually for a dino or structure */

	constructor(app, targetPosition, modules, server) {
		this.app = app;
		this.targetPosition = targetPosition;
		this.modules = modules;
		this.view = null;
		this.server = server;
	}

	async Build() {
		//Create the DOM element
		var b = DeltaTools.CreateDom("div", "popoutm2_container", this.app.mainHolder);
		this.view = b;

		//Add event listener
		this.dismissedEvent = (evt) => { this.OnDismissEvent(evt); };
		this.app.mainHolder.addEventListener("mousedown", this.dismissedEvent);
		this.app.mainHolder.addEventListener("wheel", this.dismissedEvent);

		//Add each module and build them
		for (var i = 0; i < this.modules.length; i += 1) {
			b.appendChild(this.modules[i].Build(this, b));
		}

		//Await an animation frame so we can measure the height
		await DeltaTools.AwaitAnimationFrame();
		
		//Update pos
		this.UpdatePos();
	}

	OnDismissEvent(evt) {
		//Check if this was an event inside of this modal
		var target = evt.target;
		while (target != null) {
			if (target == this.view) {
				return; //Ignore events on us
			}
			target = target.parentElement;
		}

		//Dismiss this
		this.OnDismissed();
	}

	OnDismissed() {
		//Remove events
		this.app.mainHolder.removeEventListener("mousedown", this.dismissedEvent);
		this.app.mainHolder.removeEventListener("wheel", this.dismissedEvent);

		//Remove element
		this.view.remove();
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
		//Lookup entry
		var entry = app.GetSpeciesByClassName(data.classname);

		//Get name
		var name = data.tamed_name;
		if (name.length == 0) {
			name = entry.screen_name;
		}

		//Add modules
		var modules = [
			new DeltaPopoutModuleTitle(entry.icon.image_url, name, entry.screen_name),
			new DeltaPopoutModuleStatus(data),
			new DeltaPopoutModuleStatBars(data),
			new DeltaPopoutModuleInventory(0, data.dino_id, 2)
		];
		var modal = new DeltaPopoutModal(app, pos, modules, server);
		await modal.Build();
	}

	static async ShowStructureModal(app, data, pos, server) {
		//Get defaults
		var name = data.classname;
		var icon = "https://icon-assets.deltamap.net/unknown_dino.png";

		//Lookup entry
		var item = await app.GetItemEntryByStructureClassNameAsync(data.classname);
		if (item != null) {
			name = item.name;
			icon = item.icon.image_url;
		}

		//Add modules
		var modules = [
			new DeltaPopoutModuleTitle(icon, name, "Structure"),
			new DeltaPopoutModuleInventory(1, data.structure_id, 4)
		];
		var modal = new DeltaPopoutModal(app, pos, modules, server);
		await modal.Build();
	}

}