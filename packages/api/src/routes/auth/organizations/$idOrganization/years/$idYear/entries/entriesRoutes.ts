import { $idEntryRoutes } from "./$idEntry/$idEntryRoutes.js"
import { entryLinesRoutes } from "./$idEntry/entryLines/entryLinesRoutes.js"
import { entryTagsRoutes } from "./$idEntry/entryTags/entryTagsRoutes.js"
import { auditMissingAttachmentsRoute } from "./auditMissingAttachments.js"
import { auditNonBalancedEntriesRoute } from "./auditNonBalancedEntries.js"
import { createOneEntryRoute } from "./createOneEntry.js"
import { createOneEntryFromTemplateRoute } from "./createOneEntryFromTemplate.js"
import { readAllEntriesRoute } from "./readAllEntries.js"
import { readAllEntryTagsRoute } from "./readAllEntryTags.js"
import { updateManyEntriesRoute } from "./updateManyEntries.js"

export const entriesRoutes = [
    createOneEntryRoute,
    createOneEntryFromTemplateRoute,
    readAllEntriesRoute,
    readAllEntryTagsRoute,
    updateManyEntriesRoute,
    auditMissingAttachmentsRoute,
    auditNonBalancedEntriesRoute,

    // entryLinesRoutes and the audit routes must come before $idEntryRoutes so
    // that .../entries/lines and .../entries/audit/... match before
    // .../entries/:idEntry/...
    ...entryLinesRoutes,
    ...$idEntryRoutes,
    ...entryTagsRoutes,
]
