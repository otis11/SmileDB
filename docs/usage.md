# SmileDB Docs
- [Commands](#commands)
- [Table View Shortcuts](#table-view-shortcuts)
- [Query Examples](#query-examples)

### Commands
| Command | Description  |
|---|---|
| SmileDB: Help | Open Help  |
| SmileDB: New Connection | Create a new connection config. This can be also achieved by clicking on the plus icon inside the tree view  |
| SmileDB: Edit Connection | Select a connection config to edit. This can be also achieved by mouse right click on a connection config inside the tree view.  |
| SmileDB: Delete Connection | Select a connection config to delete. This can be also achieved by mouse right click on a connection config inside the tree view. |
| SmileDB: Refresh Connections | Refreshes the connections inside the tree view. This can be also achieved by clicking on the refresh icon in the top right corner inside the tree view. |
| SmileDB: Refresh Connections Silent | Refreshes the connections inside the tree view. This can be also achieved by clicking on the refresh icon in the top right corner inside the tree view. |
| SmileDB: Open Active Database Connections | Open all active database connections by SmileDB |
| SmileDB: Open Table | Only available by clicking on a table inside the tree view. |
| SmileDB: Reset Connections | Careful. Deletes all stored connection configs. This can be helpful if the extension has a broken state. |

### Table View Shortcuts
| Shortcut | Description  |
|---|---|
| Ctrl + Enter |  Push all changes. |
| Ctrl + Shift + r |  Reload the table view. |
| Ctrl + f |  Activate the client side filter and focus it. |
| Alt + d |  Activate the database side filter and focus it. |
| Alt + q |  Activate the query input and focus it. |
| Ctrl + s |  Switch between Edit and Select Mode. |
| Ctrl + c |  Copy selected columns in `CSV` format. |

### Query Examples
Some implementations need to improve a lot until they are more usable.

**MongoDB**
```javascript
// All connections are global so db and collection need to be specified. and toArray() is needed to see the result at the end.
// a normal query would look like this:
// db.users.find({})
// but needs to look like this:
db("test").collection("users").find({}).toArray()

// count or stats
db("test").collection("users").countDocuments()
db("test").collection("users").stats()
```
