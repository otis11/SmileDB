# Change Log

## [0.2.5] 24.07.2024
- Fixed a bug which caused scrollbars to appear on each table column with to much content making these unreadable

## [0.2.4] 17.03.2024
- Improve Readme and extension description
    - Make it more clear which database system are supported
    - Make it clear that this extension is currently not actively maintained
    - Make it more clear which features are available
- Readonly Mode
    - Small style changes
    - Disable queries
    - Disable table right click context menu multiple data changing options
    - Disable pushing anything from the client
## [0.2.3] 02.03.2024
- Fixed a bug which caused `MongoDB` to convert a `null` value into the string `"null"`

## [0.2.2] 02.03.2024
- Fixed a bug which caused the table view to convert an empty string into `null` which resulted in a wrong type check when updating or deleting the value
- Fixed a bug which caused wrong `NULL` where conditions in `MySQL`, `PostgreSQL`, `MariaDB` and `MSSQL` (e.g could not update data where `NULL` was involved)
- Fixed a bug which caused on table selection to select the wrong columns when the filter method has been changed
- Rename configuration option `SmileDB.tree.expandTablesInstant` to `SmileDB.tree.expandTablesInstantly`
- Improve the naming and item order of the table right click menu

## [0.2.1] 24.02.2024

- Add inspect code view for procedures and functions
- Database Tree
  - Make description for multiple tree items copyable
  - If loading the database stats fails for any sql connection inside the tree
    view, catch the error and show no count next to each folder and make the
    toggable (`tables`, `functions`, `views`, `procedures`). This will not
    hinder the user to load a specific folder if some tables, for example
    mysql.proc, are corrupted
    (https://github.com/antares-sql/antares/issues/159).
  - add option to expand tables instant (`tree.expandTablesInstant`)
- Table
  - Close Popup when the `esc` key is pressed
- Code Improvements
  - Make getDatabaseTreeItems shared between SQLPoolConnections
  - Reduce code duplication inside specific PoolConnections and improve return
    types

## [0.2.0] 04.02.2024

- Settings
  - Make setting changes take effect without reloading vscode
    [#11](https://github.com/otis11/SmileDB/pull/11)
  - add `defaults.stayAliveInSeconds`
    [#10](https://github.com/otis11/SmileDB/pull/10)
  - add `defaults.saveAuthentication`
    [#10](https://github.com/otis11/SmileDB/pull/10)
  - add `defaults.trustServerCertificate`
    [#10](https://github.com/otis11/SmileDB/pull/10)
- Database Tree
  - List `tables` and `views` inside the tree view under extra folders for:
    `MariaDB`, `MySQL`, `PostgreSQL` and `MSSQL`
  - List `procedures` and `functions` inside the tree view under extra folders
    for: `MariaDB`, `MySQL`, `PostgreSQL` and `MSSQL` (Just list them, no
    interaction yet)
    [4c6c5db](https://github.com/otis11/SmileDB/commit/4c6c5db5a6b65b18173a7660ba1d4943dfd50088)
  - List `collections` and `views` inside the tree view under extra folders for:
    `MongoDB`
    [26f407b](https://github.com/otis11/SmileDB/commit/26f407b593f776b8c752a4ab0820c2ef394f4f8d)
  - Add the count of total `collections`, `tables` or `views` to each folder. If
    the count is 0, make the TreeItem not expandable.
    [2e713ad](https://github.com/otis11/SmileDB/commit/2e713ada91e393abfd0264382493c5561d290fbb)
- Theme
  - improve the background colors adopted from VSCode Color Theme (before some
    were transparent which caused visual issues)
- Table View
  - Increase the min height for the query input field
- Code Improvements
  - Use `MySQLPoolConnection` and `getDatabaseTreeChildren` from `MySQL` for
    `MariaDB` as the `MariaDBPoolConnection` and `getDatabaseTreeChildren` was
    exactly the same. (They are removed)
    [c2f3de3](https://github.com/otis11/SmileDB/commit/c2f3de3fdca973497a4e027221da8b0b72869741)
  - Refactor: make extension context and storage global available (`global.ts`)
    [#7](https://github.com/otis11/SmileDB/pull/7)
  - Refactor: add a global.css to share variables and styles across webviews.
    [fdd81f2](https://github.com/otis11/SmileDB/commit/fdd81f2fd0512a441b62c1fc382d5e57f4d8d58b)
  - Improve eslint config

## [0.1.5] 21.01.2024

- Update README (replace preview image with gif, add mssql as supported database
  system)

## [0.1.4] 09.01.2024

- Theme: improve the colors that are adopted from the active VSCode Color Theme.
- Fixed a bug which caused the command
  `SmileDB Open Active Database Connections` to not display any open connection.

## [0.1.3] 05.01.2024

- Table: fix a bug which didn't allow copying selected text
- Table right click context menu improvements:
  - add selection options:`Select All`, `Select Row` and `Select Column`
  - add `Set NULL` to set a column NULL
  - seperate `Delete Rows` and `Clear: Delete Rows` into `Delete Row`,
    `Clear: Delete Row` and `Selected Delete Rows`,
    `Clear: Selected Delete Rows`
  - group options by adding multiple horizontal dividers

## [0.1.2] 01.01.2024

- Redis support the following data types when retrieving data: `String`, `List`,
  `Set`, `Hash`, `Sorted Set`
  [582bc50](https://github.com/otis11/SmileDB/commit/582bc504acf157ecfc0ac3134f2a10ba46758372)
- Redis support updating the following data types: `String`, `List`, `Set`,
  `Hash`, `Sorted Set`
  [5e73f97](https://github.com/otis11/SmileDB/commit/5e73f972324fdf17a1b144bf4997bfa5c4a067c2)
- Redis improve the feedback when running queries by returning the result in the
  value field with the key field just containing `result`
  [582bc50](https://github.com/otis11/SmileDB/commit/582bc504acf157ecfc0ac3134f2a10ba46758372)
- Redis support querying multiple queries at once: e.g. `SET x y SET a b`
  [582bc50](https://github.com/otis11/SmileDB/commit/582bc504acf157ecfc0ac3134f2a10ba46758372)

## [0.1.1] 16.11.2023

- Export Table Data [#1](https://github.com/otis11/SmileDB/pull/1)
  - Add export data icon to table view header to open a popup and export table
    data
  - Add copy to clipboard into the export data popup
  - Add save to file into the export data popup
  - Add select data table scope (current selection, full database) into the
    export data popup
  - Add 2 Checkboxes to optionally add the column header and row numbers to the
    exported data
  - Add select data export format into the export data popup
  - Add `TXT` as supported data export format
  - Add `CSV` as supported data export
- Sanitize html values in missing locations
  [84a4597](https://github.com/otis11/SmileDB/commit/84a4597d301dd3641a7d149f3e7abaab7139c2f4)
- Add copy label option to tree view items
  [52fef56](https://github.com/otis11/SmileDB/commit/52fef56e1d1950eff8a029b5e8e3e2a95dcbee1e)
- Add copy selected columns to clipboard support `Ctrl + c` (format: `CSV`)
  [de71fcc](https://github.com/otis11/SmileDB/commit/de71fcc40c1a0367c5ed07351049451df6dc5655)

## [0.1.0]

- Initial Release
