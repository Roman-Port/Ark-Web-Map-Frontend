"use strict";

class DeltaRecyclerView {

    constructor(mount, scrollProxy, scrollOffset, rowHeight) {
        this.mount = mount;
        this.scrollProxy = scrollProxy; //The actual element that scrolls
        this.scrollOffset = scrollOffset; //The offset to apply to scrolling from the proxy
        this.rowHeight = rowHeight;
        this.fCreateRow = null; //Creates an empty DOM node
        this.fRenderRow = null; //Renders data to DOM
        this.fSortFunction = null; //Sorts a,b
        this.fGetUniqueKey = null; //Given data, returns a unique ID for it
        this.fSearch = (a) => {
            return true;
        };
        this.nodes = []; //The DOM nodes to be recycled
        this.usedIndexes = []; //Indexes where there is already a drawn row
        this.data = []; //The data that will be rendered
        this.dataMap = []; //Maps indexes to the data. Used for searching
        this.lastScroll = 0;

        this.events = [];

        this.addCollateTimeout = null;
        this.addCollateQueue = [];
        this.removeCollateTimeout = null;
        this.removeCollateQueue = [];

        this.scrollProxy.addEventListener("scroll", () => this._OnScroll());

        this._OnDatasetUpdated();
    }

    AddEventListener(type, callback) {
        this.events.push({
            "type": type,
            "callback": callback
        });
    }

    AddFixedElement(d) {
        this.mount.appendChild(d);
    }

    SetCreateRowFunction(f) {
        this.fCreateRow = f;
        /* f() RETURNS row DOM */
    }

    SetRenderRowFunction(f) {
        this.fRenderRow = f;
        /* f(node, data) */
    }

    SetSortFunction(f) {
        this.fSortFunction = f;
        this._OnDatasetUpdated();
        /* f(a, b) */
    }

    SetGetUniqueKeyFunction(f) {
        this.fGetUniqueKey = f;
        /* f(a) */
    }

    _GetCurrentScroll() {
        return this.scrollProxy.scrollTop - this.scrollOffset;
    }

    _GetContainerHeight() {
        return this.scrollProxy.offsetHeight;
    }

    _ScrollToTop() {
        this.scrollProxy.scrollTop = 0;
    }

    _GetRowOffsetPixels(index) {
        return (index * this.rowHeight) + this.scrollOffset;
    }

    _GetDataLength() {
        return this.dataMap.length;
    }
    
    _GetDataElement(i) {
        return this.data[this.dataMap[i]];
    }

    _SortDataElementIndexes(i1, i2) {
        return this.fSortFunction(this._GetDataElement(i1), this._GetDataElement(i2));
    }

    _SortElements(a, b) {
        return this.fSortFunction(a, b);
    }

    _GetDataKey(a) {
        return this.fGetUniqueKey(a);
    }

    _GetDataIndexByKey(key) {
        //Searches for an item by it's ID and returns it's index
        for (var i = 0; i < this.data.length; i += 1) {
            if (this._GetDataKey(this.data[i]) == key) {
                return i;
            }
        }
        return null;
    }

    _OnDatasetUpdated() {
        //Sort elements
        if (this.fSortFunction != null) {
            this.data.sort((a, b) => {
                return this._SortElements(a, b);
            });
        }

        //Remap elements
        this._Remap();

        //Make sure the height of the DOM matches
        this.mount.style.height = ((this._GetDataLength() * this.rowHeight) + this.scrollOffset).toString() + "px";

        //Update all
        this.RefreshAllItemsInView();
    }

    _CallEvent(type, evt) {
        var target = evt.currentTarget;
        var data = this.data[target._rindex];
        for (var i = 0; i < this.events.length; i += 1) {
            var e = this.events[i];
            if (e.type == type) {
                e.callback(data, evt, target);
            }
        }
    }

    _CreateTemplateDOMs() {
        //Get number of DOMs needed
        var needed = Math.ceil((this._GetContainerHeight()) / this.rowHeight) + 5;
        console.log(needed + " nodes created");

        //Generate and position these many
        for (var i = 0; i < needed; i += 1) {
            var d = this.fCreateRow();
            d.style.position = "absolute";

            d.style.display = "none";
            d._rindex = i;
            d._startindex = i;

            d.addEventListener("click", (evt) => {
                this._CallEvent("click", evt);
            });

            this.mount.appendChild(d);
            this.nodes.push(d);
            this._RenderRow(d, i);
        }
    }

    _RenderRow(node, index) {
        //Move row
        node.style.top = this._GetRowOffsetPixels(index) + "px";
        node._rindex = index;

        //Check if index is in bounds
        if (index < 0 || index >= this._GetDataLength()) {
            node.style.display = "none";
            return;
        } else {
            node.style.display = "";
            this.fRenderRow(node, this._GetDataElement(index));
        }
    }

    _Remap() {
        //Remaps the data according to the search function
        this.dataMap = [];
        for (var i = 0; i < this.data.length; i += 1) {
            if (this.fSearch(this.data[i])) {
                this.dataMap.push(i);
            }
        }
    }

    SetData(d) {
        /* OLD */
        console.warn("[RecyclerView] Called SetData! This is not recommended, as it causes more slowdowns than needed. Use AddItem and RemoveItem next time.");
        this.data = d;
        this._OnDatasetUpdated();
    }

    _OnScroll() {
        //Get the index of the topmost element
        var top = this._GetTopElementIndex();
        var bottom = this._GetBottomElementIndex();
        var count = bottom - top;

        //Find elements that have not been moved to a location on-screen. Start off by finding what we need to update
        var elements = {};
        for (var i = 0; i < this.nodes.length; i += 1) {
            elements[this.nodes[i]._rindex - top] = this.nodes[i];
        }
        for (var i = 0; i < count; i += 1) {
            if (elements[i] == null || elements[i] == undefined) {
                //Move an element to here
                var node = this._GetNextElementOutOfBounds(top, bottom);
                this._RenderRow(node, i + top);
            }
        }
    }

    _GetNextElementOutOfBounds(top, bottom) {
        //Gets the first element we can find that is out of bounds of the index
        for (var i = 0; i < this.nodes.length; i += 1) {
            if (this.nodes[i]._rindex < bottom && this.nodes[i]._rindex > top) {
                continue;
            }
            return this.nodes[i];
        }
    }

    RefreshAllItemsInView() {
        //Loop through these and update
        for (var i = 0; i < this.nodes.length; i += 1) {
            this._RenderRow(this.nodes[i], this.nodes[i]._rindex);
        }
    }

    _GetTopElementIndex() {
        return Math.floor(this._GetCurrentScroll() / this.rowHeight) - 1; //Smaller, top end
    }

    _GetBottomElementIndex() {
        return Math.ceil((this._GetCurrentScroll() + this._GetContainerHeight()) / this.rowHeight); //Larger, bottom end
    }

    _TryQuickModifyElementData(data) {
        //ATTEMPTS to quickly modify the element data. Returns true if it was OK, returns false if a slow refresh is needed
        var index = this._GetDataIndexByKey(this._GetDataKey(data));
        if (index == null) {
            //We don't have this, it must be added!
            return false;
        }

        //Check to see if the sorting has changed
        if (index > 0) {
            if (this._SortElements(this._GetDataElement(index - 1), data) > 0) {
                return false; //Sort would have been changed!
            }
        }
        if (index < this._GetDataLength() - 1) {
            if (this._SortElements(data, this._GetDataElement(index + 1)) > 0) {
                return false; //Sort would have been changed!
            }
        }

        //Update data
        this.data[index] = data;

        //Update onscreen
        for (var i = 0; i < this.nodes.length; i += 1) {
            if (this.nodes[i]._rindex == index) {
                this._RenderRow(this.nodes[i], this.nodes[i]._rindex);
            }
        }

        return true;
    }

    Reset() {
        //Clears all items
        this.data = [];

        //Refresh
        this._OnDatasetUpdated();
    }

    _PushAdds(updates) {
        //First, try to update all of these using a quick modify
        for (var i = 0; i < updates.length; i += 1) {
            if (this._TryQuickModifyElementData(updates[i])) {
                //Quick update OK!
                i--;
                updates.splice(i, 1);
            }
        }

        //Check if quick updates were enough
        if (updates.length == 0) {
            return 0;
        }

        //Add or modify all of these
        for (var i = 0; i < updates.length; i += 1) {
            var index = this._GetDataIndexByKey(this._GetDataKey(updates[i]));
            if (index != null) {
                this.data[index] = updates[i];
            } else {
                this.data.push(updates[i]);
            }
        }

        //Trigger updates
        this._OnDatasetUpdated();
        return 1;
    }

    _PushRemoves(updates) {
        //Removes all of the elements specified
        for (var i = 0; i < updates.length; i += 1) {
            var index = this._GetDataIndexByKey(this._GetDataKey(updates[i]));
            if (index != null) {
                this.data.splice(index, 1);
            }
        }

        //Trigger updates
        this._OnDatasetUpdated();
    }

    AddItem(item) {
        this.addCollateQueue.push(item);
        if (this.addCollateTimeout == null) {
            this.addCollateTimeout = window.setTimeout(() => {
                this.addCollateTimeout = null;
                this._PushAdds(this.addCollateQueue);
                this.addCollateQueue = [];
            }, 500);
        }
    }

    RemoveItem(item) {
        this.removeCollateQueue.push(item);
        if (this.removeCollateTimeout == null) {
            this.removeCollateTimeout = window.setTimeout(() => {
                this.removeCollateTimeout = null;
                this._PushRemoves(this.removeCollateQueue);
                this.removeCollateQueue = [];
            }, 500);
        }
    }

    BulkAddItems(items) {
        this._PushAdds(items);
    }

    BulkRemoveItems(items) {
        this._PushRemoves(items);
    }

    SetNewSearchQuery(f) {
        this.fSearch = f;
        this.RefreshSearch();
    }

    RefreshSearch() {
        this._Remap();
        this.RefreshAllItemsInView();
        this._ScrollToTop();
    }
}