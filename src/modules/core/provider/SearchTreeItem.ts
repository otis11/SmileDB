import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode"

export class SearchTreeItem extends TreeItem {
    constructor() {
        super('Search', TreeItemCollapsibleState.None)
        this.tooltip = 'Search'
        this.contextValue = "search"

        this.iconPath = new ThemeIcon('search')

        this.command = {
            command: 'SmileDB.openSearch',
            title: 'Open Search',
            arguments: []
        }
    }
}
