"use struct";

class MapAddonStructures extends TabMapAddon {

    constructor(map) {
        super(map);
    }

    BindEvents(container) {
        /* Used when we bind events to the map container */

    }

    async OnLoad(container) {
        /* Called when we load the map */

        //Create
        this.session = new DeltaStructureSession(this.map.server.app.structureTool, this.map.map, this.map.server);

        //Subscribe
        this.map.server.structures.OnContentUpdated.Subscribe("deltawebmap.tabs.map.addon.structures.onload", () => {
            //New content
            this.session.SetNewDataset(this.map.server.structures.content);
        });
        this.session.SetNewDataset(this.map.server.structures.content);
    }

    async OnUnload(container) {
        
    }

    
}