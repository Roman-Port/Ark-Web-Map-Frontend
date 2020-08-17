"use strict";

class DeltaSimpleTableView {

    constructor(container, tableClassname, primaryKey, labels, createItemsFunction) {
        //container (dom): Where this will be placed
        //tableClassname (string): Classname to create the table with
        //primaryKey (string): The key to use in the dataset to uniquely ID each element
        //labels (string[]): The labels at the top of the table
        //createItemsFunction (function(item)): Returns an array of DOM elements to use in each column
        this.container = container;
        this.tableClassname = tableClassname;
        this.primaryKey = primaryKey;
        this.labels = labels;
        this.createItemsFunction = createItemsFunction;

        this.customClasses = {};
        this.customContextMenu = null;

        //Create
        this._CreateTable();
    }

    _CreateTable() {
        //Create table
        this.table = DeltaTools.CreateDom("table", "tableview_table", this.container);
        if (this.tableClassname != null) {
            this.table.classList.add(this.tableClassname);
        }

        //Create header
        this._CreateRow("th", null, this.labels);
    }

    _CreateRow(tag, className, items) {
        var r = DeltaTools.CreateDom("tr", className, this.table);
        for (var i = 0; i < items.length; i += 1) {
            var c = DeltaTools.CreateDom(tag, this.customClasses[i], r);
            if (typeof (items[i]) == "string") {
                //Attach string
                c.innerText = items[i];
            } else {
                //Attach DOM
                c.appendChild(items[i]);
            }
        }
        return r;
    }

    SetCustomColumnClassName(index, className) {
        this.customClasses[index] = className;
    }

    SetCustomContextMenu(menu) {
        this.customContextMenu = menu;
    }

    AddContent(content) {
        //content (object[]): Content to add
        for (var i = 0; i < content.length; i += 1) {
            //Read
            var c = this.createItemsFunction(content[i]);

            //Add
            var r = this._CreateRow("td", "tableview_table_element", c);

            //Add context menu
            if (this.customContextMenu != null) {
                DeltaContextMenu.AddContextMenu(r, content[i], this.customContextMenu);
            }
        }
    }

}