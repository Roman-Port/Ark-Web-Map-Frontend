"use strict";

class DeltaRecyclerView {

    constructor(mount, scrollProxy, scrollOffset, rowHeight) {
        this.mount = mount;
        this.scrollProxy = scrollProxy; //The actual element that scrolls
        this.scrollOffset = scrollOffset; //The offset to apply to scrolling from the proxy
        this.rowHeight = rowHeight;
        this.fCreateRow = null; //Creates an empty DOM node
        this.fRenderRow = null; //Renders data to DOM
        this.nodes = []; //The DOM nodes to be recycled
        this.usedIndexes = []; //Indexes where there is already a drawn row
        this.data = []; //The data that will be rendered
        this.lastScroll = 0;

        this.scrollProxy.addEventListener("scroll", () => this._OnScroll());
    }

    SetCreateRowFunction(f) {
        this.fCreateRow = f;
        /* f() RETURNS row DOM */
    }

    SetRenderRowFunction(f) {
        this.fRenderRow = f;
        /* f(node, data) */
    }

    _GetCurrentScroll() {
        return this.scrollProxy.scrollTop;
    }

    _GetContainerHeight() {
        return this.scrollProxy.offsetHeight;
    }

    _GetRowOffsetPixels(index) {
        return index * this.rowHeight;
    }

    _CreateTemplateDOMs() {
        //Get number of DOMs needed
        var needed = Math.ceil((this._GetContainerHeight() + 100) / this.rowHeight) + 5;

        //Generate and position these many
        for (var i = 0; i < needed; i += 1) {
            var d = this.fCreateRow();
            d.style.top = this._GetRowOffsetPixels(i) + "px";
            d.style.display = "none";
            d._rindex = i;
            this.mount.appendChild(d);
            this.nodes.push(d);
        }
    }

    _RenderRow(node, index) {
        node.style.display = "";
        this.fRenderRow(node, this.data[index]);
    }

    SetData(d) {
        /* Sets new data */
        //Set height of container
        this.mount.style.height = this._GetRowOffsetPixels(d.length).toString() + "px";

        //Set data
        this.data = d;

        //Show and render all elements up this point
        for (var i = 0; i < this.nodes.length; i += 1) {
            var index = this.nodes[i]._rindex;
            if (index < this.data.length) {
                this._RenderRow(this.nodes[i], index);
            } else {
                this.nodes[i].style.display = "none";
            }
            
        }
    }

    _MoveRow(pull, push, index) {
        //Check
        if (this.usedIndexes.includes(index)) {
            return null;
        }

        //Get the row we need to pull
        var e = this.nodes.splice(pull, 1)[0];

        //Remove from indexes
        if (e._rindex != null) {
            this.usedIndexes.splice(this.usedIndexes.indexOf(e._rindex), 1);
        }

        //Move this to where we need to place it 
        this.nodes.splice(push, 0, e);

        //Move this DOMM data
        e.style.top = this._GetRowOffsetPixels(index).toString() + "px";
        e._rindex = index;
        this.usedIndexes.push(index);

        //Render
        this._RenderRow(e, index);
        return e;
    }

    _OnScroll() {
        //Get offset
        var grid = Math.min(this.data.length, Math.max(0, Math.round(this._GetCurrentScroll() / this.rowHeight) - 2));
        console.log(grid);

        //Handle scrolling by moving DOMs
        if (grid > this.lastScroll) {
            //Scrolling down
            while (grid > this.lastScroll && this.lastScroll + this.nodes.length < this.data.length) {
                this._MoveRow(0, this.nodes.length, this.lastScroll + this.nodes.length);
                this.lastScroll++;
            }
        } else if (this.lastScroll > grid) {
            //Scrolling up
            while (this.lastScroll > grid) {
                this._MoveRow(this.nodes.length - 1, 0, this.lastScroll - 1);
                this.lastScroll--;
            }
        }
        
        this.lastScroll = grid;
    }
}