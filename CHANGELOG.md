# Change Log

## [0.1.6] Unreleased
- Database Tree
    - List `tables` and `views` inside the tree view under extra folders for: `MariaDB`, `MySQL`, `PostgreSQL` and `MSSQL`
    - List `collections` and `views` inside the tree view under extra folders for: `MongoDB`
    - Add the count of total `collections`, `tables` or `views` to each folder. If the count is 0, make the TreeItem not expandable.
- Theme
    - improve the background colors adopted from VSCode Color Theme (before some were transparent which caused visual issues)
- Table View
    - Increase the min height for the query input field
- Code Improvements
    - Use `MySQLPoolConnection` and `getDatabaseTreeChildren` from `MySQL` for `MariaDB` as the `MariaDBPoolConnection` and `getDatabaseTreeChildren` was exactly the same. (They are removed)
    - Refactor: make extension context and storage global available (`global.ts`)
    - Refactor: add a global.css to share variables and styles across webviews.
    - Improve eslint config

## [0.1.5] 21.01.2024
- Update README (replace preview image with gif, add mssql as supported database system)

## [0.1.4] 09.01.2024
- Theme: improve the colors that are adopted from the active VSCode Color Theme.
- Fixed a bug which caused the command `SmileDB Open Active Database Connections` to not display any open connection.

## [0.1.3] 05.01.2024
- Table: fix a bug which didn't allow copying selected text
- Table right click context menu improvements:
    - add selection options:`Select All`, `Select Row` and `Select Column`
    - add `Set NULL` to set a column NULL
    - seperate `Delete Rows` and `Clear: Delete Rows` into `Delete Row`, `Clear: Delete Row` and `Selected Delete Rows `, `Clear: Selected Delete Rows`
    - group options by adding multiple horizontal dividers

## [0.1.2] 01.01.2024
- Redis support the following data types when retrieving data: `String`, `List`, `Set`, `Hash`, `Sorted Set` [582bc50](https://github.com/otis11/SmileDB/commit/582bc504acf157ecfc0ac3134f2a10ba46758372)
- Redis support updating the following data types: `String`, `List`, `Set`, `Hash`, `Sorted Set` [5e73f97](https://github.com/otis11/SmileDB/commit/5e73f972324fdf17a1b144bf4997bfa5c4a067c2)
- Redis improve the feedback when running queries by returning the result  in the value field with the key field just containing `result` [582bc50](https://github.com/otis11/SmileDB/commit/582bc504acf157ecfc0ac3134f2a10ba46758372)
- Redis support querying multiple queries at once: e.g. `SET x y SET a b` [582bc50](https://github.com/otis11/SmileDB/commit/582bc504acf157ecfc0ac3134f2a10ba46758372)

## [0.1.1] 16.11.2023
- Export Table Data [#1](https://github.com/otis11/SmileDB/pull/1)
    - Add export data icon to table view header to open a popup and export table data
    - Add copy to clipboard into the export data popup
    - Add save to file into the export data popup
    - Add select data table scope (current selection, full database) into the export data popup
    - Add 2 Checkboxes to optionally add the column header and row numbers to the exported data
    - Add select data export format into the export data popup
    - Add `TXT` as supported data export format
    - Add `CSV` as supported data export
- Sanitize html values in missing locations [84a4597](https://github.com/otis11/SmileDB/commit/84a4597d301dd3641a7d149f3e7abaab7139c2f4)
- Add copy label option to tree view items [52fef56](https://github.com/otis11/SmileDB/commit/52fef56e1d1950eff8a029b5e8e3e2a95dcbee1e)
- Add copy selected columns to clipboard support `Ctrl + c` (format: `CSV`) [de71fcc](https://github.com/otis11/SmileDB/commit/de71fcc40c1a0367c5ed07351049451df6dc5655)

## [0.1.0] Unreleased
- Initial Release
