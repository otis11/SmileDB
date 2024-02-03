import { TreeItem } from "vscode"
import { getDatabaseTreeChildren as getMysqlChildren } from "../mysql/getDatabaseTreeChildren"

export async function getDatabaseTreeChildren(item: TreeItem): Promise<TreeItem[]> {
    return getMysqlChildren(item)
}


