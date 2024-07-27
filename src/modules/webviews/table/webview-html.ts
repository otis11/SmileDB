import { PoolConnectionConfig } from "../../../shared/types"

export function getTableWebviewHtmlBody(connectionConfig: PoolConnectionConfig): string {
    return /*html*/`
        <div id="header">
            <div class="header-row">
                <div class="pagination">
                    <div id="pagination-prev-skip" class="icon-small" title="First"><i class="codicon codicon-triangle-left"></i></div>
                    <div id="pagination-prev" title="Previous"><i class="codicon codicon-chevron-left"></i></div>
                    <div class="pagination-input">
                    <div id="pagination-rows-select" class="select" tabindex="9" title="Rows per page"></div>
                </select>
                <div id="pagination-rows-select-after" title="Total rows"></div>
                </div>
                <div id="pagination-next" title="Next"><i class="codicon codicon-chevron-right"></i></div>
                <div id="pagination-next-skip" class="icon-small" title="Last"><i class="codicon codicon-triangle-right"></i></div>
                </div>

                <div class="vertical-divider"></div>
                <div id="reload" title="Reload [Ctrl + Shift + r]"><i class="codicon codicon-refresh"></i></div>

                <div class="vertical-divider"></div>
                <div id="add-row" title="Add Row"><i class="codicon codicon-plus"></i></div>
                <div id="delete-rows" title="Delete Rows"><i class="codicon codicon-remove"></i></div>
                <div id="push-changes-preview" title="Preview Queries"><i class="codicon codicon-eye"></i></div>
                <div id="push-changes" class="success disabled" title="Push changes [Ctrl + Enter]"><i class="codicon codicon-arrow-up"></i></div>
                <div id="push-changes-loading" class="d-none">Loading...</div>

                <div class="vertical-divider"></div>
                <div id="selection-mode" title="Switch between Selection and Edit Mode [Ctrl + s]"><i class="codicon codicon-inspect"></i></div>

                <div class="vertical-divider"></div>
                <div id="export-data" title="Export data to a file or clipboard"><i class="codicon codicon-export"></i></div>

                <div class="vertical-divider"></div>
                <div class="spacer"></div>

                <div id="query-time-in-milliseconds" title="Query time in milliseconds"></div>

                <div class="vertical-divider"></div>
                <div id="settings" title="Open Table Settings"><i class="codicon codicon-settings-gear"></i></div>
            </div>
            <div class="header-row" id="header-filter">
                <div class="select" id="header-filter-select" tabindex="10"></div>
                <div class="vertical-divider"></div>
                <div id="header-filter-database">
                    <input id="header-filter-database-input" class="header-filter-input" value="${connectionConfig.advanced.filter.databasePrefilled || ''}">
                </div>
                <div id="header-filter-client">
                    <input id="header-filter-client-input" class="header-filter-input" value="${connectionConfig.advanced.filter.clientPrefilled || ''}">
                </div>
                <div id="header-filter-query">
                    <textarea id="header-filter-query-input" class="header-filter-input" value="${connectionConfig.advanced.filter.queryPrefilled || ''}"></textarea>
                    <i id="header-filter-query-run" class="codicon codicon-play success"></i>
                </div>
            </div>
            <div class="header-row d-none" id="error-message-container">
                <div class="icon error"><i class="codicon codicon-warning"></i></div>
                <pre id="error-message"></pre>
                <div class="icon error" id="error-close"><i class="codicon codicon-chrome-close"></i></div>
            </div>
    </div>
    <div id="readonly-notice" class=" ${connectionConfig.advanced.readonly ? '' : 'd-none'}">
        <i class="codicon codicon-lock"></i>
        <div class="readonly-text">Readonly. Edit your connection configuration to modify.</div>
    </div>
    <div id="loading">Loading...</div>
    <div id="popup" class="d-none">
        <div id="popup-content"></div>
        <div id="popup-close"><i class="codicon codicon-close"></i></div>
    </div>
    <div id="table-header"></div>
    <div id="table"></div>
    <div id="table-selection-context-menu" class="select-options">
        <div class="select-option" id="table-selection-context-menu-set-null">Set NULL</div>
        <div class="select-option" id="table-selection-context-menu-delete-row">Delete Row</div>
        <div class="select-option" id="table-selection-context-menu-delete-rows">Delete Selected Rows</div>
        <div class="horizontal-divider"></div>
        <div class="select-option" id="table-selection-context-menu-delete-row-clear">Clear Delete Row</div>
        <div class="select-option" id="table-selection-context-menu-delete-rows-clear">Clear Delete Selected Rows</div>
        <div class="horizontal-divider"></div>
        <div class="select-option" id="table-selection-context-menu-select-row">Select Row</div>
        <div class="select-option" id="table-selection-context-menu-select-column">Select Column</div>
        <div class="select-option" id="table-selection-context-menu-select-all">Select All</div>
    </div>
`
}