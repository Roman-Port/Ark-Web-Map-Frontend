"use strict";

//What servers use to communicate with the manager. Accesses only the requested mods, in the load order that is specified
class PrimalPackageInterface {

    constructor(manager, packages) {
        this.manager = manager;
        this.packages = packages;
    }

    //Public API

    GetTotalEntityCount() {
        var total = 0;
        for (var i = 0; i < this.packages.length; i += 1) {
            total += this.packages[i].info.entity_count;
        }
        return total;
    }

    async DownloadContent(progress) {
        //Loop through all packages and download them all
        for (var i = 0; i < this.packages.length; i += 1) {
            await this.packages[i].DownloadContent(progress);
        }
    }

    GetContentByClassName(classname, packageType) {
        //Start looking for this, starting from the mod on top
        for (var i = 0; i < this.packages.length; i += 1) {
            //Check if the package type matches
            if (this.packages[i].info.package_type != packageType) {
                continue;
            }

            //Check if this contains this
            if (this.packages[i].GetItemByClassName(classname) != null) {
                return this.packages[i].GetItemByClassName(classname);
            }
        }

        //Not found
        return null;
    }

    GetContentByFilter(packageType, x) {
        //Start looking for this, starting from the mod on top
        for (var i = 0; i < this.packages.length; i += 1) {
            //Check if the package type matches
            if (this.packages[i].info.package_type != packageType) {
                continue;
            }

            //Search by filter
            var result = this.packages[i].GetByFilter(x);
            if (result != null) {
                return result;
            }
        }

        //Not found
        return null;
    }

}