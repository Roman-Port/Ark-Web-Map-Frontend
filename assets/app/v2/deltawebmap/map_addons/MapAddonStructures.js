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

        this.session = new DeltaStructureSession(this.map.server.app.structureTool, this.map.map, this.map.server);
        this.map.server.db.structures.OnFilteredDatasetUpdated.Subscribe("deltawebmap.tabs.map.addons.structures.session", (d) => {
            this.session.SetNewDataset(d);
        });
        this.session.SetNewDataset(this.map.server.db.structures.GetFilteredDataset());
    }

    async OnUnload(container) {
        
    }

    
}