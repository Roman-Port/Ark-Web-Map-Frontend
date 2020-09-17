"use strict";

class DeltaRecyclerView {

    constructor(mount, options) {
        //Set vars
        this.mount = mount;
        this.rowHeight = options.rowHeight;
        this.createView = options.createView; //()
        this.setViewContent = options.setViewContent; //(row, data)
        this.getDataPrimaryKey = options.getDataPrimaryKey; //(data)
        this.extraContainerClass = options.extraContainerClass; //not required
        this.onClickElementEvent = options.onClickElementEvent; //not required; (data, row)
        this.doSort = options.doSort;
        this.doFilter = options.doFilter;
        this.dataset = [];
        this.filteredDataset = [];
        this.lastHeight = 0;

        //Make sure required options are set
        if (this.rowHeight == null || this.createView == null || this.setViewContent == null || this.getDataPrimaryKey == null || this.doSort == null || this.doFilter == null) {
            throw "Required options are missing.";
        }

        //Create views
        this.container = DeltaTools.CreateDom("div", this.extraContainerClass, this.mount);
        this.container.style.overflowY = "scroll";
        this.content = DeltaTools.CreateDom("div", null, this.container);
        this.content.style.position = "relative";

        //Create
        this.CreateRows();
        this.OnDatasetUpdated();

        //Add events
        this.container.addEventListener("scroll", () => this.OnScroll());
    }

    //Sets a new sort
    SetSortFunction(f) {
        this.doSort = f;
        this.ReloadAll();
    }

    //Forces a refresh of all entries
    ReloadAll() {
        //Sort
        this.SortDataset();

        //Refresh
        this.OnDatasetUpdated();
    }

    //Adds entries and updates
    AddEntries(entries) {
        //Add each
        for (var i = 0; i < entries.length; i += 1) {
            this.UpsertDatasetItem(entries[i]);
        }

        //Sort
        this.SortDataset();

        //Update
        this.OnDatasetUpdated();
    }

    //Removes entries and updates
    RemoveEntries(entries) {
        //Remove each
        for (var i = 0; i < entries.length; i += 1) {
            //Search to see if this already exists
            var key = this.getDataPrimaryKey(entries[i]);
            for (var j = 0; j < this.dataset.length; j += 1) {
                if (this.dataset[j].__recyclerKey == key) {
                    this.dataset.splice(j, 1);
                    j--;
                }
            }
        }

        //Sort
        this.SortDataset();

        //Update
        this.OnDatasetUpdated();
    }

    //Called when we update the dataset
    OnDatasetUpdated() {
        //Set height
        this.content.style.height = (this.GetDatasetLength() * this.rowHeight).toString() + "px";

        //Update
        this.OnScroll();
    }

    //Called when the area is scrolled
    OnScroll() {
        //Create rows in case something got updated
        this.CreateRows();

        //Get elements
        var topElement = Math.floor(this.container.scrollTop / this.rowHeight);
        var bottomElement = Math.ceil((this.container.scrollTop + this.container.clientHeight) / this.rowHeight);

        //Update
        for (var i = topElement; i < bottomElement; i += 1) {
            this.UpdateRow(i, topElement, bottomElement);
        }
    }

    //Resorts the database
    SortDataset() {
        //Sort
        this.dataset.sort((a, b) => {
            return this.doSort(a, b);
        });

        //Refilter
        this.filteredDataset = [];
        for (var i = 0; i < this.dataset.length; i += 1) {
            if (this.doFilter(this.dataset[i])) {
                this.filteredDataset.push(this.dataset[i]);
            }
        }
    }

    //Returns the length of the dataset
    GetDatasetLength() {
        return this.filteredDataset.length;
    }

    //Returns the item by the index
    GetDatasetItem(index) {
        return this.filteredDataset[index];
    }

    //Adds an item to the dataset if it's new, else updates an existing one. Does NOT fire events
    UpsertDatasetItem(item) {
        //Get key
        var key = this.getDataPrimaryKey(item);

        //Set
        item.__recyclerKey = key;
        item.__recyclerVersion = Math.round(Math.random() * 10000);

        //Search to see if this already exists
        for (var i = 0; i < this.dataset.length; i += 1) {
            if (this.dataset[i].__recyclerKey == key) {
                this.dataset[i] = item;
                return;
            }
        }

        //Add
        this.dataset.push(item);
    }

    //Updates a row. The index is the index from the top of the view
    UpdateRow(index, topElementIndex, bottomElementIndex) {
        //Find an unused row to use
        var row = null;

        //Look to see if we already have an element at the correct location
        for (var i = 0; i < this.content.children.length; i += 1) {
            if (this.content.children[i]._recyclerIndex == index) {
                row = this.content.children[i];
                break;
            }
        }

        //We'll need to get an unused row
        if (row == null) {
            row = this.FindUnusedRow(topElementIndex, bottomElementIndex);
        }

        //Check if we somehow still haven't found a row to use
        if (row == null) {
            throw "Could not find a row to use!";
        }

        //Update internal data
        row.style.top = (index * this.rowHeight).toString() + "px";
        row._recyclerIndex = index;

        //Update if this is valid
        if (index < this.GetDatasetLength()) {
            //Valid
            row.style.display = null;

            //Get data
            var data = this.GetDatasetItem(index);

            //Check if the data is the same
            var update = true;
            if (data == row._recyclerData) {
                //This is the same data. However, check if it has been modified since
                //When it's modified this version is changed
                update = row._recyclerVersion != data.__recyclerVersion;
            }
            if (update) {
                row._recyclerData = data;
                this.setViewContent(row, data);
                row._recyclerVersion = data.__recyclerVersion;
            }
        } else {
            //Invalid
            row.style.display = "none";
        }
    }

    //Returns a row that we can use freely
    FindUnusedRow(topElementIndex, bottomElementIndex) {
        //Loop through rows and find one outside of this range
        for (var i = 0; i < this.content.children.length; i += 1) {
            if (this.content.children[i]._recyclerIndex > bottomElementIndex || this.content.children[i]._recyclerIndex < topElementIndex) {
                return this.content.children[i];
            }
        }
        return null;
    }

    //Returns the number of rows needed in view
    GetRowsInViewCount() {
        return Math.ceil(this.container.clientHeight / this.rowHeight) + 2;
    }

    //Creates all of the required rows, but does not set their content
    CreateRows() {
        //Determine the number of rows required
        var required = this.GetRowsInViewCount();

        //Create rows
        for (var i = this.content.children.length; i < required; i += 1) {
            //Make
            var d = this.createView();

            //Set data
            d._recyclerIndex = i;
            d.style.top = (i * this.rowHeight).toString() + "px";
            d.style.display = "none";

            //Add event
            if (this.onClickElementEvent != null) {
                d.addEventListener("click", (evt) => {
                    this.onClickElementEvent(evt.currentTarget._recyclerData, evt.currentTarget);
                });
            }

            //Add
            this.content.appendChild(d);
        }
    }

}