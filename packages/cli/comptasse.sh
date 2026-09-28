#!/bin/sh
# comptasse - Comptasse API CLI
# Requires: curl
# Config:   ~/.comptasse/config  (COMPTASSE_URL, COMPTASSE_ORGANIZATION)
#           ~/.comstasse/cookies.txt  (session cookie jar, set by `login`)
set -e

# ── Version ─────────────────────────────────────────────────────────────────────
# Read at runtime from a `version` file that ships next to this script. That file
# is generated from the single source of truth (root `VERSION`) by
# `just build-cli` / `.scripts/release-cli.sh`. No hardcoded version string lives
# in this file. Override via COMPTASSE_VERSION_FILE if needed.
_self="$0"
if command -v "$_self" >/dev/null 2>&1; then _self="$(command -v "$_self")"; fi
_script_dir="$(dirname "$_self")"
SCRIPT_DIR="$(cd "$_script_dir" 2>/dev/null && pwd)" || SCRIPT_DIR="$_script_dir"

# Primary source: a co-shipped `version` file (generated from root VERSION).
VERSION_FILE="${COMPTASSE_VERSION_FILE:-$SCRIPT_DIR/version}"
VERSION="$(cat "$VERSION_FILE" 2>/dev/null | tr -d '[:space:]')"

# Dev convenience fallback: if no shipped version file exists (e.g. fresh dev
# checkout with `version` git-ignored), walk up from the script dir to find the
# repo-root `VERSION` file (the source of truth) and strip a leading `v`.
if [ -z "$VERSION" ]; then
    _d="$SCRIPT_DIR"
    while [ "$_d" != "/" ]; do
        if [ -f "$_d/VERSION" ]; then
            VERSION="$(tr -d 'v[:space:]' < "$_d/VERSION" 2>/dev/null)"
            break
        fi
        _d="$(dirname "$_d")"
    done
fi
[ -n "$VERSION" ] || VERSION="unknown"

DEFAULT_URL="https://api.comptasse.com"
CONFIG_FILE="${COMPTASSE_CONFIG:-${HOME}/.comptasse/config}"

# ── Utilities ─────────────────────────────────────────────────────────────────

_die()      { printf 'comptasse: %s\n' "$*" >&2; exit 1; }
_need_cmd() { command -v "$1" >/dev/null 2>&1 || _die "'$1' is required but not found"; }
_jesc()     { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

_check_version() {
    latest=$(curl -fsSL --max-time 5 "https://comptasse.com/cli/version" 2>/dev/null) || return 0
    latest=$(printf '%s' "$latest" | tr -d '[:space:]')
    # Ignore response if it doesn't look like a semver (e.g. HTML fallback)
    case "$latest" in
        [0-9]*.[0-9]*.[0-9]*) ;;
        *) return 0 ;;
    esac
    [ "$latest" = "$VERSION" ] || _die "CLI is outdated (installed: $VERSION, latest: $latest). Update: curl -fsSL https://comptasse.com/cli/install.sh | sh"
}

# JSON body accumulator
_JBODY=''
_jbody_reset() { _JBODY=''; }
_jbody_raw() {
    [ -n "$_JBODY" ] && _JBODY="${_JBODY},"
    _JBODY="${_JBODY}\"$1\":$2"
}
# _jstr: add "key":"value" - skip if value is empty
_jstr()      { [ -n "$2" ] && _jbody_raw "$1" "\"$(_jesc "$2")\"" || true; }
# _jstr_null: add "key":"value" or "key":null
_jstr_null() {
    if [ -n "$2" ]; then _jbody_raw "$1" "\"$(_jesc "$2")\""; else _jbody_raw "$1" "null"; fi
}
# _jnum: add "key":number - skip if value is empty
_jnum()  { [ -n "$2" ] && _jbody_raw "$1" "$2" || true; }
# _jbool: add "key":true|false
_jbool() { _jbody_raw "$1" "$2"; }
# _jbody: emit the accumulated JSON object
_jbody() { printf '{%s}' "$_JBODY"; }

# ── Config ────────────────────────────────────────────────────────────────────

COMPTASSE_DIR="${COMPTASSE_DIR:-${HOME}/.comptasse}"
COOKIE_JAR="${COMPTASSE_COOKIE_JAR:-${COMPTASSE_DIR}/cookies.txt}"

_cfg_read() {
    COMPTASSE_URL="$DEFAULT_URL"
    COMPTASSE_ORGANIZATION=''
    [ -f "$CONFIG_FILE" ] && . "$CONFIG_FILE"
}

_cfg_write() {
    # $1=url  $2=organization_id
    mkdir -p "$(dirname "$CONFIG_FILE")"
    printf 'COMPTASSE_URL=%s\nCOMPTASSE_ORGANIZATION=%s\n' "$1" "$2" > "$CONFIG_FILE"
    chmod 600 "$CONFIG_FILE"
}

# Auth gate: cookie-session flow (the API signs in via /auth/sign-in and sets
# the `comptasse_id_user_session` cookie). No API key is used.
_require_cfg() {
    _cfg_read
    [ -f "$COOKIE_JAR" ] || _die "Not logged in. Run: comptasse login --email <email> --password <password>"
}

# Resolve the active organization id. The API scopes all org endpoints under
# /organizations/:idOrganization; cookie-session auth has no org yet, so we list
# the user's organizations once and persist the first one.
# Priority: COMPTASSE_ORGANIZATION env -> saved config -> /auth/get-all-my-organization.
IDORG=''
_org_id() {
    _require_cfg
    [ -n "$IDORG" ] && return 0
    _cfg_read
    if [ -z "$COMPTASSE_ORGANIZATION" ]; then
        COMPTASSE_ORGANIZATION="$(
            curl -sS -b "$COOKIE_JAR" "${COMPTASSE_URL}/auth/get-all-my-organization" 2>/dev/null \
            | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n1
        )"
        [ -n "$COMPTASSE_ORGANIZATION" ] || _die "Could not resolve organization. Pass --org <idOrganization> or log in with one."
        _cfg_write "$COMPTASSE_URL" "$COMPTASSE_ORGANIZATION"
    fi
    IDORG="$COMPTASSE_ORGANIZATION"
}

# ── HTTP ──────────────────────────────────────────────────────────────────────

_RESP=$(mktemp)
trap 'rm -f "$_RESP"' EXIT INT TERM

_api() {
    # _api METHOD /path [json_body]
    method="$1"; path="$2"; body="${3:-}"
    url="${COMPTASSE_URL}${path}"
    if [ -n "$body" ]; then
        HTTP_CODE=$(curl -sS -o "$_RESP" -w "%{http_code}" \
            -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -d "$body" "$url")
    else
        HTTP_CODE=$(curl -sS -o "$_RESP" -w "%{http_code}" \
            -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
            -X "$method" \
            "$url")
    fi
    case "$HTTP_CODE" in
        2??) cat "$_RESP" ;;
        *)   cat "$_RESP" >&2; exit 1 ;;
    esac
}

# Nested REST paths, scoped to the resolved organization (no more `/me` placeholder).
_org_path()  { _org_id >/dev/null; printf '/organizations/%s' "$IDORG"; }
_year_path() { _org_id >/dev/null; printf '/organizations/%s/years/%s' "$IDORG" "$1"; }

# ── login / whoami / logout ───────────────────────────────────────────────────

_cmd_login() {
    email=''; password=''; base_url=''; org=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --email)    email="$2";     shift ;;
            --password) password="$2";  shift ;;
            --url)      base_url="$2";  shift ;;
            --org)      org="$2";       shift ;;
            *) _die "Unknown option: $1" ;;
        esac; shift
    done
    [ -n "$email" ] || _die "--email is required"
    [ -n "$password" ] || _die "--password is required"
    base_url="${base_url:-$DEFAULT_URL}"; base_url="${base_url%/}"
    mkdir -p "$(dirname "$COOKIE_JAR")"
    : > "$COOKIE_JAR"; chmod 600 "$COOKIE_JAR"
    # Cookie-session sign-in: -c writes Set-Cookie into the jar.
    HTTP_CODE=$(curl -sS -o "$_RESP" -w "%{http_code}" \
        -c "$COOKIE_JAR" \
        -X POST "$base_url/auth/sign-in" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$(_jesc "$email")\",\"password\":\"$(_jesc "$password")\"}")
    if ! case "$HTTP_CODE" in 2??) true ;; *) false ;; esac; then
        cat "$_RESP" >&2 2>/dev/null
        rm -f "$COOKIE_JAR"
        _die "Login failed (HTTP $HTTP_CODE)."
    fi
    # Persist base URL + chosen org (resolved lazily if not provided).
    _cfg_write "$base_url" "$org"
    printf 'Logged in (%s). Session saved to %s\n' "$base_url" "$COOKIE_JAR"
}

_cmd_whoami() {
    _require_cfg
    # Valid session if the user's organizations are reachable.
    curl -sS -b "$COOKIE_JAR" "${COMPTASSE_URL}/auth/get-all-my-organization"
}

_cmd_logout() {
    _cfg_read
    if [ -f "$COOKIE_JAR" ]; then
        curl -sS -b "$COOKIE_JAR" -X POST "${COMPTASSE_URL}/auth/sign-out" >/dev/null 2>&1 || true
    fi
    rm -f "$COOKIE_JAR"
    _cfg_write "${COMPTASSE_URL:-$DEFAULT_URL}" ""
    printf 'Logged out.\n'
}

# ── org ───────────────────────────────────────────────────────────────────────

_cmd_org() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        get)
            _require_cfg; _api GET "$(_org_path)"
            ;;
        update)
            _org_update "$@"
            ;;
        delete)
            _require_cfg
            _api DELETE "$(_org_path)" > /dev/null
            printf 'Organization deleted.\n'
            ;;
        *) _die "comptasse org: unknown subcommand '$subcmd'. Use: get, update, delete" ;;
    esac
}

_org_update() {
    name=''; email=''; siren=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --name)  name="$2";  shift ;;
            --email) email="$2"; shift ;;
            --siren) siren="$2"; shift ;;
            *) _die "Unknown option: $1" ;;
        esac; shift
    done
    _require_cfg
    _jbody_reset; _jstr name "$name"; _jstr email "$email"; _jstr siren "$siren"
    _api PATCH "$(_org_path)" "$(_jbody)"
}

# ── years ─────────────────────────────────────────────────────────────────────

_cmd_years() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)                    _require_cfg; _api GET "$(_org_path)/years" ;;
        get)                     _years_get "$@" ;;
        create)                  _years_create "$@" ;;
        update)                  _years_update "$@" ;;
        delete)                  _years_delete "$@" ;;
        close)                   _years_close "$@" ;;
        open)                    _years_open "$@" ;;
        settle-balance-sheet)    _years_settle_bs "$@" ;;
        settle-income-statement) _years_settle_is "$@" ;;
        *) _die "comptasse years: unknown subcommand '$subcmd'" ;;
    esac
}

_years_get() {
    id="${1:?Usage: comptasse years get <idYear>}"
    _require_cfg; _api GET "$(_year_path "$id")"
}

_years_create() {
    start=''; end=''; label=''
    while [ $# -gt 0 ]; do
        case "$1" in --start) start="$2"; shift ;; --end) end="$2"; shift ;; --label) label="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift
    done
    [ -n "$start" ] || _die "--start is required"
    [ -n "$end"   ] || _die "--end is required"
    _require_cfg; _jbody_reset; _jstr startingAt "$start"; _jstr endingAt "$end"; _jstr label "$label"
    _api POST "$(_org_path)/years" "$(_jbody)"
}

_years_update() {
    id="${1:?Usage: comptasse years update <idYear>}"; shift
    start=''; end=''; label=''
    while [ $# -gt 0 ]; do
        case "$1" in --start) start="$2"; shift ;; --end) end="$2"; shift ;; --label) label="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift
    done
    _require_cfg; _jbody_reset; _jstr startingAt "$start"; _jstr endingAt "$end"; _jstr label "$label"
    _api PATCH "$(_year_path "$id")" "$(_jbody)"
}

_years_delete() {
    id="${1:?Usage: comptasse years delete <idYear>}"
    _require_cfg; _api DELETE "$(_year_path "$id")" > /dev/null
    printf 'Year %s deleted.\n' "$id"
}

_years_close() {
    id="${1:?Usage: comptasse years close <idYear>}"
    _require_cfg; _api POST "$(_year_path "$id")/close"
}

_years_open() {
    id="${1:?Usage: comptasse years open <idYear>}"; shift
    journal_opening=''
    while [ $# -gt 0 ]; do
        case "$1" in --journal-opening) journal_opening="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift
    done
    [ -n "$journal_opening" ] || _die "--journal-opening is required"
    _require_cfg; _jbody_reset; _jstr idJournalOpening "$journal_opening"
    _api POST "$(_year_path "$id")/open" "$(_jbody)"
}

_years_settle_bs() {
    id="${1:?Usage: comptasse years settle-balance-sheet <idYear>}"; shift
    journal_closing=''
    while [ $# -gt 0 ]; do
        case "$1" in --journal-closing) journal_closing="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift
    done
    [ -n "$journal_closing" ] || _die "--journal-closing is required"
    _require_cfg; _jbody_reset; _jstr idJournalClosing "$journal_closing"
    _api POST "$(_year_path "$id")/settle-balance-sheet" "$(_jbody)"
}

_years_settle_is() {
    id="${1:?Usage: comptasse years settle-income-statement <idYear>}"; shift
    journal_closing=''
    while [ $# -gt 0 ]; do
        case "$1" in --journal-closing) journal_closing="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift
    done
    [ -n "$journal_closing" ] || _die "--journal-closing is required"
    _require_cfg; _jbody_reset; _jstr idJournalClosing "$journal_closing"
    _api POST "$(_year_path "$id")/settle-income-statement" "$(_jbody)"
}

# ── journals ──────────────────────────────────────────────────────────────────

_cmd_journals() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)   _journals_list "$@" ;; get)    _journals_get "$@" ;;
        create) _journals_create "$@" ;; update) _journals_update "$@" ;;
        delete) _journals_delete "$@" ;;
        *) _die "comptasse journals: unknown subcommand '$subcmd'" ;;
    esac
}

_journals_base() { printf '%s/journals' "$(_year_path "$1")"; }

_journals_list() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api GET "$(_journals_base "$year")"
}

_journals_get() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse journals get <idJournal> --year <id>"
    _require_cfg; _api GET "$(_journals_base "$year")/$id"
}

_journals_create() {
    year=''; code=''; label=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; --code) code="$2"; shift ;; --label) label="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift
    done
    [ -n "$year" ] && [ -n "$code" ] && [ -n "$label" ] || _die "--year, --code, and --label are required"
    _require_cfg; _jbody_reset; _jstr code "$code"; _jstr label "$label"
    _api POST "$(_journals_base "$year")" "$(_jbody)"
}

_journals_update() {
    id=''; year=''; code=''; label=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; --code) code="$2"; shift ;; --label) label="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift
    done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse journals update <idJournal> --year <id>"
    _require_cfg; _jbody_reset; _jstr code "$code"; _jstr label "$label"
    _api PATCH "$(_journals_base "$year")/$id" "$(_jbody)"
}

_journals_delete() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse journals delete <idJournal> --year <id>"
    _require_cfg; _api DELETE "$(_journals_base "$year")/$id" > /dev/null
    printf 'Journal %s deleted.\n' "$id"
}

# ── accounts ──────────────────────────────────────────────────────────────────

_cmd_accounts() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)   _accounts_list "$@" ;; get)    _accounts_get "$@" ;;
        create) _accounts_create "$@" ;; update) _accounts_update "$@" ;;
        delete) _accounts_delete "$@" ;;
        *) _die "comptasse accounts: unknown subcommand '$subcmd'" ;;
    esac
}

_accounts_base() { printf '%s/accounts' "$(_year_path "$1")"; }

_accounts_list() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api GET "$(_accounts_base "$year")"
}

_accounts_get() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse accounts get <idAccount> --year <id>"
    _require_cfg; _api GET "$(_accounts_base "$year")/$id"
}

_accounts_create() {
    year=''; number=''; label=''; type=''; parent=''; selectable='true'
    while [ $# -gt 0 ]; do
        case "$1" in
            --year)          year="$2";   shift ;;
            --number)        number="$2"; shift ;;
            --label)         label="$2";  shift ;;
            --type)          type="$2";   shift ;;
            --parent)        parent="$2"; shift ;;
            --no-selectable) selectable='false' ;;
            *) _die "Unknown: $1" ;;
        esac; shift
    done
    [ -n "$year" ] && [ -n "$number" ] && [ -n "$label" ] && [ -n "$type" ] && [ -n "$parent" ] || \
        _die "--year, --number, --label, --type, and --parent are required"
    _require_cfg; _jbody_reset
    _jstr number "$number"; _jstr label "$label"; _jstr type "$type"
    _jstr idAccountParent "$parent"; _jbool isSelectable "$selectable"
    _api POST "$(_accounts_base "$year")" "$(_jbody)"
}

_accounts_update() {
    id=''; year=''; number=''; label=''; type=''; parent=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --year) year="$2"; shift ;; --number) number="$2"; shift ;; --label) label="$2"; shift ;;
            --type) type="$2"; shift ;; --parent) parent="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;;
        esac; shift
    done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse accounts update <idAccount> --year <id>"
    _require_cfg; _jbody_reset; _jstr number "$number"; _jstr label "$label"; _jstr type "$type"; _jstr idAccountParent "$parent"
    _api PATCH "$(_accounts_base "$year")/$id" "$(_jbody)"
}

_accounts_delete() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse accounts delete <idAccount> --year <id>"
    _require_cfg; _api DELETE "$(_accounts_base "$year")/$id" > /dev/null
    printf 'Account %s deleted.\n' "$id"
}

# ── tags ──────────────────────────────────────────────────────────────────────

_cmd_tags() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)   _tags_list "$@" ;; get)    _tags_get "$@" ;;
        create) _tags_create "$@" ;; update) _tags_update "$@" ;;
        delete) _tags_delete "$@" ;;
        *) _die "comptasse tags: unknown subcommand '$subcmd'" ;;
    esac
}

_tags_base() { printf '%s/tags' "$(_year_path "$1")"; }

_tags_list() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api GET "$(_tags_base "$year")"
}

_tags_get() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse tags get <idTag> --year <id>"
    _require_cfg; _api GET "$(_tags_base "$year")/$id"
}

_tags_create() {
    year=''; label=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; --label) label="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] && [ -n "$label" ] || _die "--year and --label are required"
    _require_cfg; _jbody_reset; _jstr label "$label"
    _api POST "$(_tags_base "$year")" "$(_jbody)"
}

_tags_update() {
    id=''; year=''; label=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; --label) label="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse tags update <idTag> --year <id>"
    _require_cfg; _jbody_reset; _jstr label "$label"
    _api PATCH "$(_tags_base "$year")/$id" "$(_jbody)"
}

_tags_delete() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse tags delete <idTag> --year <id>"
    _require_cfg; _api DELETE "$(_tags_base "$year")/$id" > /dev/null
    printf 'Tag %s deleted.\n' "$id"
}

# ── entries ───────────────────────────────────────────────────────────────────

_cmd_entries() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)      _entries_list "$@" ;;      get)       _entries_get "$@" ;;
        create)    _entries_create "$@" ;;    update)    _entries_update "$@" ;;
        duplicate) _entries_duplicate "$@" ;; reverse)   _entries_reverse "$@" ;;
        delete)    _entries_delete "$@" ;;    compute)   _entries_compute "$@" ;;
        missing-attachments) _entries_missing_attachments "$@" ;;
        non-balanced)        _entries_non_balanced "$@" ;;
        lines)     _cmd_entry_lines "$@" ;;   tags)      _cmd_entry_tags "$@" ;;
        *) _die "comptasse entries: unknown subcommand '$subcmd'" ;;
    esac
}

_entries_base() { printf '%s/entries' "$(_year_path "$1")"; }

_entries_list() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api GET "$(_entries_base "$year")"
}

_entries_get() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse entries get <idEntry> --year <id>"
    _require_cfg; _api GET "$(_entries_base "$year")/$id"
}

_entries_create() {
    year=''; journal=''; label=''; date=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; --journal) journal="$2"; shift ;; --label) label="$2"; shift ;; --date) date="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift
    done
    [ -n "$year" ] && [ -n "$journal" ] || _die "--year and --journal are required"
    date="${date:-$(date +%Y-%m-%d)}"
    _require_cfg; _jbody_reset; _jstr idYear "$year"; _jstr idJournal "$journal"; _jstr label "$label"; _jstr date "$date"
    _api POST "$(_entries_base "$year")" "$(_jbody)"
}

_entries_update() {
    id=''; year=''; label=''; date=''; journal=''; file=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --year)    year="$2";    shift ;; --label)   label="$2";   shift ;;
            --date)    date="$2";    shift ;; --journal) journal="$2"; shift ;;
            --file)    file="$2";    shift ;; -*)         _die "Unknown: $1" ;; *) id="$1" ;;
        esac; shift
    done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse entries update <idEntry> --year <id>"
    _require_cfg; _jbody_reset; _jstr idYear "$year"; _jstr idEntry "$id"; _jstr label "$label"; _jstr date "$date"; _jstr idJournal "$journal"; _jstr idFile "$file"
    _api PATCH "$(_entries_base "$year")/$id" "$(_jbody)"
}

_entries_duplicate() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse entries duplicate <idEntry> --year <id>"
    _require_cfg; _api POST "$(_entries_base "$year")/$id/duplicate"
}

_entries_reverse() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse entries reverse <idEntry> --year <id>"
    _require_cfg; _api POST "$(_entries_base "$year")/$id/reverse"
}

_entries_delete() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse entries delete <idEntry> --year <id>"
    _require_cfg; _api DELETE "$(_entries_base "$year")/$id" > /dev/null
    printf 'Entry %s deleted.\n' "$id"
}

_entries_compute() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse entries compute <idEntry> --year <id>"
    _require_cfg; _api POST "$(_entries_base "$year")/$id/compute"
}

_entries_missing_attachments() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _jbody_reset; _jstr idYear "$year"
    _api POST "$(_entries_base "$year")/audit/missing-attachments" "$(_jbody)"
}

_entries_non_balanced() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _jbody_reset; _jstr idYear "$year"
    _api POST "$(_entries_base "$year")/audit/non-balanced" "$(_jbody)"
}

# ── entries lines ─────────────────────────────────────────────────────────────

_cmd_entry_lines() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)   _lines_list "$@" ;; get)    _lines_get "$@" ;;
        create) _lines_create "$@" ;; update) _lines_update "$@" ;;
        delete) _lines_delete "$@" ;;
        *) _die "comptasse entries lines: unknown subcommand '$subcmd'" ;;
    esac
}

_lines_base() { printf '%s/%s/lines' "$(_entries_base "$1")" "$2"; }

_lines_list() {
    entry=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) entry="$1" ;; esac; shift; done
    [ -n "$year" ] || _die "Usage: comptasse entries lines list [<idEntry>] --year <id>"
    _require_cfg
    # Entry lines are collected through the year-scoped route
    # (GET .../entries/lines?idYear=...), optionally filtered by idEntry. The
    # per-entry route GET .../entries/:idEntry/lines no longer exists.
    if [ -n "$entry" ]; then
        _api GET "$(_entries_base "$year")/lines?idYear=$year&idEntry=$entry"
    else
        _api GET "$(_entries_base "$year")/lines?idYear=$year"
    fi
}

_lines_get() {
    entry=''; line=''; year=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;;
            *) if [ -z "$entry" ]; then entry="$1"; else line="$1"; fi ;;
        esac; shift
    done
    [ -n "$entry" ] && [ -n "$line" ] && [ -n "$year" ] || _die "Usage: comptasse entries lines get <idEntry> <idLine> --year <id>"
    _require_cfg; _api GET "$(_lines_base "$year" "$entry")/$line"
}

_lines_create() {
    entry=''; year=''; account=''; label=''; debit=''; credit=''; computed='false'
    while [ $# -gt 0 ]; do
        case "$1" in
            --year)    year="$2";    shift ;; --account) account="$2"; shift ;;
            --label)   label="$2";   shift ;; --debit)   debit="$2";   shift ;;
            --credit)  credit="$2";  shift ;; --computed) computed='true' ;;
            --manual)  computed='false' ;;
            -*)        _die "Unknown: $1" ;;
            *)         entry="$1" ;;
        esac; shift
    done
    [ -n "$entry" ] && [ -n "$year" ] && [ -n "$account" ] || \
        _die "Usage: comptasse entries lines create <idEntry> --year <id> --account <id>"
    _require_cfg; _jbody_reset; _jstr idYear "$year"; _jstr idEntry "$entry"; _jstr idAccount "$account"; _jstr label "$label"; _jstr debit "$debit"; _jstr credit "$credit"
    # The API requires the computed flags on every entry line (computed = e.g. from
    # an income-statement/amortization generation; false for manually entered lines).
    _jbool isComputedForJournalReport "$computed"
    _jbool isComputedForLedgerReport "$computed"
    _jbool isComputedForBalanceReport "$computed"
    _jbool isComputedForBalanceSheetReport "$computed"
    _jbool isComputedForIncomeStatementReport "$computed"
    _api POST "$(_lines_base "$year" "$entry")" "$(_jbody)"
}

_lines_update() {
    entry=''; line=''; year=''; label=''; debit=''; credit=''; computed='true'; account=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --year)   year="$2";   shift ;; --label)  label="$2";  shift ;;
            --account) account="$2"; shift ;;
            --debit)  debit="$2";  shift ;; --credit) credit="$2"; shift ;;
            --computed)     computed='true' ;;
            --manual)       computed='false' ;;
            -*) _die "Unknown: $1" ;; *) if [ -z "$entry" ]; then entry="$1"; else line="$1"; fi ;;
        esac; shift
    done
    [ -n "$entry" ] && [ -n "$line" ] && [ -n "$year" ] || _die "Usage: comptasse entries lines update <idEntry> <idLine> --year <id>"
    _require_cfg; _jbody_reset; _jstr idYear "$year"; _jstr idEntry "$entry"; _jstr idEntryLine "$line"; _jstr idAccount "$account"; _jstr label "$label"; _jstr debit "$debit"; _jstr credit "$credit"
    _jbool isComputedForJournalReport "$computed"
    _jbool isComputedForLedgerReport "$computed"
    _jbool isComputedForBalanceReport "$computed"
    _jbool isComputedForBalanceSheetReport "$computed"
    _jbool isComputedForIncomeStatementReport "$computed"
    _api PATCH "$(_lines_base "$year" "$entry")/$line" "$(_jbody)"
}

_lines_delete() {
    entry=''; line=''; year=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;;
            *) if [ -z "$entry" ]; then entry="$1"; else line="$1"; fi ;;
        esac; shift
    done
    [ -n "$entry" ] && [ -n "$line" ] && [ -n "$year" ] || _die "Usage: comptasse entries lines delete <idEntry> <idLine> --year <id>"
    _require_cfg; _api DELETE "$(_lines_base "$year" "$entry")/$line" > /dev/null
    printf 'Line %s deleted.\n' "$line"
}

# ── entries tags ──────────────────────────────────────────────────────────────

_cmd_entry_tags() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        add)    _entry_tag_add "$@" ;;
        remove) _entry_tag_remove "$@" ;;
        *) _die "comptasse entries tags: use 'add' or 'remove'" ;;
    esac
}

_entry_tag_add() {
    entry=''; year=''; tag=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; --tag) tag="$2"; shift ;; -*) _die "Unknown: $1" ;; *) entry="$1" ;; esac; shift
    done
    [ -n "$entry" ] && [ -n "$year" ] && [ -n "$tag" ] || \
        _die "Usage: comptasse entries tags add <idEntry> --year <id> --tag <id>"
    _require_cfg; _jbody_reset; _jstr idTag "$tag"
    _api POST "$(_entries_base "$year")/$entry/tags" "$(_jbody)"
}

_entry_tag_remove() {
    entry=''; tag=''; year=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;;
            *) if [ -z "$entry" ]; then entry="$1"; else tag="$1"; fi ;;
        esac; shift
    done
    [ -n "$entry" ] && [ -n "$tag" ] && [ -n "$year" ] || \
        _die "Usage: comptasse entries tags remove <idEntry> <idTag> --year <id>"
    _require_cfg; _api DELETE "$(_entries_base "$year")/$entry/tags/$tag" > /dev/null
    printf 'Tag removed.\n'
}

# ── files ─────────────────────────────────────────────────────────────────────

_cmd_files() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)    _files_list "$@" ;; get)        _files_get "$@" ;;
        upload)  _files_upload "$@" ;; update)  _files_update "$@" ;;
        delete)  _files_delete "$@" ;; download) _files_download "$@" ;;
        ocr)     _files_ocr "$@" ;;
        folders) _cmd_folders "$@" ;;
        *) _die "comptasse files: unknown subcommand '$subcmd'" ;;
    esac
}

_files_base() { printf '%s/files' "$(_year_path "$1")"; }

_files_list() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api GET "$(_files_base "$year")"
}

_files_get() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse files get <idFile> --year <id>"
    _require_cfg; _api GET "$(_files_base "$year")/$id"
}

_files_create() {
    year=''; name=''; reference=''; hash=''; folder=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --year)      year="$2";      shift ;; --name)      name="$2";      shift ;;
            --reference) reference="$2"; shift ;; --hash)      hash="$2";      shift ;;
            --folder)    folder="$2";    shift ;; *) _die "Unknown: $1" ;;
        esac; shift
    done
    [ -n "$year" ] && [ -n "$name" ] && [ -n "$reference" ] && [ -n "$hash" ] || \
        _die "--year, --name, --reference, and --hash are required"
    _require_cfg; _jbody_reset; _jstr name "$name"; _jstr reference "$reference"; _jstr hash "$hash"; _jstr idFolder "$folder"
    _api POST "$(_files_base "$year")" "$(_jbody)"
}

# Upload a file: create a file record and upload the binary content in a single
# multipart POST to the API (server-side S3 I/O, no signed URLs).
_files_upload() {
    year=''; name=''; reference=''; folder=''; file_path=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --year)      year="$2";      shift ;; --name)      name="$2";      shift ;;
            --reference) reference="$2"; shift ;;
            --folder)    folder="$2";    shift ;; --file)      file_path="$2"; shift ;; -*) _die "Unknown: $1" ;;
        esac; shift
    done
    [ -n "$year" ] && [ -n "$file_path" ] || _die "--year and --file are required"
    [ -f "$file_path" ] || _die "File not found: $file_path"
    _require_cfg
    [ -n "$name" ] || name="$(basename "$file_path")"
    if [ -z "$reference" ]; then
        reference="$(basename "$file_path")"
        reference="${reference%.*}"
    fi
    hash="$(sha256sum "$file_path" | awk '{print $1}')"
    # Multipart upload: the file binary + metadata fields go directly to the API.
    if [ -n "$folder" ]; then
        HTTP_CODE=$(curl -sS -o "$_RESP" -w "%{http_code}" \
            -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
            -X POST \
            -F "file=@${file_path}" \
            -F "name=${name}" \
            -F "reference=${reference}" \
            -F "hash=${hash}" \
            -F "idFolder=${folder}" \
            "${COMPTASSE_URL}$(_files_base "$year")")
    else
        HTTP_CODE=$(curl -sS -o "$_RESP" -w "%{http_code}" \
            -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
            -X POST \
            -F "file=@${file_path}" \
            -F "name=${name}" \
            -F "reference=${reference}" \
            -F "hash=${hash}" \
            "${COMPTASSE_URL}$(_files_base "$year")")
    fi
    case "$HTTP_CODE" in
        2??) ;;
        *)   cat "$_RESP" >&2; exit 1 ;;
    esac
    idFile="$(printf '%s' "$(cat "$_RESP")" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"
    [ -n "$idFile" ] || { printf '%s\n' "$(cat "$_RESP")" >&2; _die "Could not upload file."; }
    printf 'Uploaded %s -> file %s\n' "$file_path" "$idFile"
}

_files_ocr() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse files ocr <idFile> --year <id>"
    _require_cfg
    printf 'OCR running for %s...\n' "$id"
    _api POST "$(_files_base "$year")/$id/ocr"
    printf 'OCR queued for file %s\n' "$id"
}

_files_update() {
    id=''; year=''; name=''; reference=''; date=''; folder=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --year)      year="$2";      shift ;; --name)      name="$2";      shift ;;
            --reference) reference="$2"; shift ;; --date)      date="$2";      shift ;;
            --folder)    folder="$2";    shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;;
        esac; shift
    done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse files update <idFile> --year <id>"
    _require_cfg; _jbody_reset; _jstr name "$name"; _jstr reference "$reference"; _jstr date "$date"; _jstr idFolder "$folder"
    _api PATCH "$(_files_base "$year")/$id" "$(_jbody)"
}

_files_delete() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse files delete <idFile> --year <id>"
    _require_cfg; _api DELETE "$(_files_base "$year")/$id" > /dev/null
    printf 'File %s deleted.\n' "$id"
}

_files_download() {
    id=''; year=''; output=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; --output) output="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse files download <idFile> --year <id> [--output <path>]"
    _require_cfg
    url="${COMPTASSE_URL}$(_files_base "$year")/$id/content"
    if [ -n "$output" ]; then
        curl -sS -b "$COOKIE_JAR" -o "$output" "$url" && printf 'Downloaded file %s -> %s\n' "$id" "$output"
    else
        curl -sS -b "$COOKIE_JAR" "$url"
    fi
}

# ── files folders ─────────────────────────────────────────────────────────────

_cmd_folders() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)   _folders_list "$@" ;; get)    _folders_get "$@" ;;
        create) _folders_create "$@" ;; update) _folders_update "$@" ;;
        delete) _folders_delete "$@" ;;
        *) _die "comptasse files folders: unknown subcommand '$subcmd'" ;;
    esac
}

_folders_base() { printf '%s/folders' "$(_year_path "$1")"; }

_folders_list() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api GET "$(_folders_base "$year")"
}

_folders_get() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse files folders get <idFolder> --year <id>"
    _require_cfg; _api GET "$(_folders_base "$year")/$id"
}

_folders_create() {
    year=''; name=''; parent=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; --name) name="$2"; shift ;; --parent) parent="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift
    done
    [ -n "$year" ] && [ -n "$name" ] || _die "--year and --name are required"
    _require_cfg; _jbody_reset; _jstr name "$name"; _jstr idFolderParent "$parent"
    _api POST "$(_folders_base "$year")" "$(_jbody)"
}

_folders_update() {
    id=''; year=''; name=''; parent=''
    while [ $# -gt 0 ]; do
        case "$1" in --year) year="$2"; shift ;; --name) name="$2"; shift ;; --parent) parent="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift
    done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse files folders update <idFolder> --year <id>"
    _require_cfg; _jbody_reset; _jstr name "$name"; _jstr idFolderParent "$parent"
    _api PATCH "$(_folders_base "$year")/$id" "$(_jbody)"
}

_folders_delete() {
    id=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift; done
    [ -n "$id" ] && [ -n "$year" ] || _die "Usage: comptasse files folders delete <idFolder> --year <id>"
    _require_cfg; _api DELETE "$(_folders_base "$year")/$id" > /dev/null
    printf 'Folder %s deleted.\n' "$id"
}

# ── scenarios ─────────────────────────────────────────────────────────────────

_cmd_scenarios() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list) _scenarios_list "$@" ;;
        get)  _scenarios_get "$@" ;;
        run)  _scenarios_run "$@" ;;
        *) _die "comptasse scenarios: unknown subcommand '$subcmd'. Use: list, get, run" ;;
    esac
}

_scenarios_list() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api GET "$(_year_path "$year")/scenarios"
}

_scenarios_get() {
    slug=''; year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; -*) _die "Unknown: $1" ;; *) slug="$1" ;; esac; shift; done
    [ -n "$slug" ] && [ -n "$year" ] || _die "Usage: comptasse scenarios get <slug> --year <id>"
    _require_cfg; _api GET "$(_year_path "$year")/scenarios/$slug"
}

_scenarios_run() {
    slug=''; year=''; journal=''; data=''; date=''
    while [ $# -gt 0 ]; do
        case "$1" in
            --year)   year="$2";   shift ;; --journal) journal="$2"; shift ;;
            --data)   data="$2";   shift ;; --date)    date="$2";    shift ;;
            -*) _die "Unknown: $1" ;; *) slug="$1" ;;
        esac; shift
    done
    [ -n "$slug" ] && [ -n "$year" ] && [ -n "$journal" ] || \
        _die "Usage: comptasse scenarios run <slug> --year <id> --journal <id> [--data '<json>'] [--date YYYY-MM-DD]"
    _require_cfg; _jbody_reset
    _jstr idYear "$year"; _jstr idJournal "$journal"
    [ -n "$date" ] && _jstr date "$date"
    if [ -n "$data" ]; then
        _JBODY="${_JBODY},\"params\":${data}"
    fi
    _api POST "$(_year_path "$year")/scenarios/$slug" "$(_jbody)"
}

# ── members ───────────────────────────────────────────────────────────────────

_cmd_members() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)   _require_cfg; _api GET "$(_org_path)/users" ;;
        get)    _members_get "$@" ;;
        invite) _members_invite "$@" ;;
        update) _members_update "$@" ;;
        remove) _members_remove "$@" ;;
        *) _die "comptasse members: unknown subcommand '$subcmd'" ;;
    esac
}

_members_get() {
    id="${1:?Usage: comptasse members get <idMember>}"
    _require_cfg; _api GET "$(_org_path)/users/$id"
}

_members_invite() {
    email=''; is_admin='false'
    while [ $# -gt 0 ]; do
        case "$1" in --email) email="$2"; shift ;; --admin) is_admin='true' ;; *) _die "Unknown: $1" ;; esac; shift
    done
    [ -n "$email" ] || _die "--email is required"
    _require_cfg
    _api POST "$(_org_path)/users" \
        "{\"isAdmin\":${is_admin},\"user\":{\"email\":\"$(_jesc "$email")\"}}"
}

_members_update() {
    id=''; is_admin=''
    while [ $# -gt 0 ]; do
        case "$1" in --admin) is_admin='true' ;; --no-admin) is_admin='false' ;; -*) _die "Unknown: $1" ;; *) id="$1" ;; esac; shift
    done
    [ -n "$id" ] || _die "Usage: comptasse members update <idMember> [--admin|--no-admin]"
    _require_cfg; _jbody_reset; [ -n "$is_admin" ] && _jbool isAdmin "$is_admin" || true
    _api PATCH "$(_org_path)/users/$id" "$(_jbody)"
}

_members_remove() {
    id="${1:?Usage: comptasse members remove <idMember>}"
    _require_cfg; _api DELETE "$(_org_path)/users/$id" > /dev/null
    printf 'Member %s removed.\n' "$id"
}

# ── exports ───────────────────────────────────────────────────────────────────

_cmd_exports() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        fec)                   _exports_fec "$@" ;;
        xbrl-balance-sheet)    _exports_xbrl_bs "$@" ;;
        xbrl-income-statement) _exports_xbrl_is "$@" ;;
        *) _die "comptasse exports: unknown subcommand '$subcmd'" ;;
    esac
}

_exports_fec() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api POST "$(_year_path "$year")/exports/fec" | sed 's/.*"url":"\([^"]*\)".*/\1/'
}

_exports_xbrl_bs() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api POST "$(_year_path "$year")/exports/balance-sheet" | sed 's/.*"url":"\([^"]*\)".*/\1/'
}

_exports_xbrl_is() {
    year=''
    while [ $# -gt 0 ]; do case "$1" in --year) year="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$year" ] || _die "--year is required"
    _require_cfg; _api POST "$(_year_path "$year")/exports/income-statement" | sed 's/.*"url":"\([^"]*\)".*/\1/'
}

# ── balance-sheets ────────────────────────────────────────────────────────────

_cmd_balance_sheets() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)   _bs_list "$@" ;; get)    _bs_get "$@" ;;
        create) _bs_create "$@" ;; update) _bs_update "$@" ;;
        delete) _bs_delete "$@" ;;
        *) _die "comptasse balance-sheets: unknown subcommand '$subcmd'" ;;
    esac
}

_bs_base() { printf '%s/balance-sheets' "$(_year_path "$1")"; }

_bs_list() {
    year="${1:?Usage: comptasse balance-sheets list <idYear>}"
    _require_cfg; _api GET "$(_bs_base "$year")"
}

_bs_get() {
    year="${1:?Usage: comptasse balance-sheets get <idYear> <id>}"
    bs="${2:?missing <idBalanceSheet>}"
    _require_cfg; _api GET "$(_bs_base "$year")/$bs"
}

_bs_create() {
    year="${1:?Usage: comptasse balance-sheets create <idYear>}"; shift
    parent=''; label=''
    while [ $# -gt 0 ]; do case "$1" in --parent) parent="$2"; shift ;; --label) label="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    _require_cfg; _jbody_reset; _jstr_null idBalanceSheetParent "$parent"; _jstr label "$label"
    _api POST "$(_bs_base "$year")" "$(_jbody)"
}

_bs_update() {
    year="${1:?Usage: comptasse balance-sheets update <idYear> <id>}"
    bs="${2:?missing <idBalanceSheet>}"; shift 2
    parent=''; label=''
    while [ $# -gt 0 ]; do case "$1" in --parent) parent="$2"; shift ;; --label) label="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    _require_cfg; _jbody_reset; _jstr idBalanceSheetParent "$parent"; _jstr label "$label"
    _api PATCH "$(_bs_base "$year")/$bs" "$(_jbody)"
}

_bs_delete() {
    year="${1:?Usage: comptasse balance-sheets delete <idYear> <id>}"
    bs="${2:?missing <idBalanceSheet>}"
    _require_cfg; _api DELETE "$(_bs_base "$year")/$bs" > /dev/null
    printf 'Balance sheet node %s deleted.\n' "$bs"
}

# ── income-statements ─────────────────────────────────────────────────────────

_cmd_income_statements() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)         _is_list "$@" ;; get)          _is_get "$@" ;;
        create)       _is_create "$@" ;; update)      _is_update "$@" ;;
        delete)       _is_delete "$@" ;; computations) _cmd_computations "$@" ;;
        *) _die "comptasse income-statements: unknown subcommand '$subcmd'" ;;
    esac
}

_is_base() { printf '%s/income-statements' "$(_year_path "$1")"; }

_is_list() {
    year="${1:?Usage: comptasse income-statements list <idYear>}"
    _require_cfg; _api GET "$(_is_base "$year")"
}

_is_get() {
    year="${1:?Usage: comptasse income-statements get <idYear> <id>}"
    is="${2:?missing <idIncomeStatement>}"
    _require_cfg; _api GET "$(_is_base "$year")/$is"
}

_is_create() {
    year="${1:?Usage: comptasse income-statements create <idYear>}"; shift
    label=''; parent=''
    while [ $# -gt 0 ]; do case "$1" in --label) label="$2"; shift ;; --parent) parent="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$label" ] || _die "--label is required"
    _require_cfg; _jbody_reset; _jstr label "$label"; _jstr_null idIncomeStatementParent "$parent"
    _api POST "$(_is_base "$year")" "$(_jbody)"
}

_is_update() {
    year="${1:?Usage: comptasse income-statements update <idYear> <id>}"
    is="${2:?missing <idIncomeStatement>}"; shift 2
    label=''; parent=''
    while [ $# -gt 0 ]; do case "$1" in --label) label="$2"; shift ;; --parent) parent="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    _require_cfg; _jbody_reset; _jstr label "$label"; _jstr idIncomeStatementParent "$parent"
    _api PATCH "$(_is_base "$year")/$is" "$(_jbody)"
}

_is_delete() {
    year="${1:?Usage: comptasse income-statements delete <idYear> <id>}"
    is="${2:?missing <idIncomeStatement>}"
    _require_cfg; _api DELETE "$(_is_base "$year")/$is" > /dev/null
    printf 'Income statement node %s deleted.\n' "$is"
}

# ── computations ──────────────────────────────────────────────────────────────

_cmd_computations() {
    subcmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$subcmd" in
        list)   _comp_list "$@" ;; get)    _comp_get "$@" ;;
        create) _comp_create "$@" ;; update) _comp_update "$@" ;;
        delete) _comp_delete "$@" ;;
        *) _die "comptasse income-statements computations: unknown subcommand '$subcmd'" ;;
    esac
}

_comp_base() { printf '%s/computations' "$(_year_path "$1")"; }

_comp_list() {
    year="${1:?Usage: comptasse income-statements computations list <idYear>}"
    _require_cfg; _api GET "$(_comp_base "$year")"
}

_comp_get() {
    year="${1:?Usage: comptasse income-statements computations get <idYear> <id>}"
    comp="${2:?missing <idComputation>}"
    _require_cfg; _api GET "$(_comp_base "$year")/$comp"
}

_comp_create() {
    year="${1:?Usage: comptasse income-statements computations create <idYear>}"; shift
    label=''
    while [ $# -gt 0 ]; do case "$1" in --label) label="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    [ -n "$label" ] || _die "--label is required"
    _require_cfg; _jbody_reset; _jstr label "$label"
    _api POST "$(_comp_base "$year")" "$(_jbody)"
}

_comp_update() {
    year="${1:?Usage: comptasse income-statements computations update <idYear> <id>}"
    comp="${2:?missing <idComputation>}"; shift 2
    label=''
    while [ $# -gt 0 ]; do case "$1" in --label) label="$2"; shift ;; *) _die "Unknown: $1" ;; esac; shift; done
    _require_cfg; _jbody_reset; _jstr label "$label"
    _api PATCH "$(_comp_base "$year")/$comp" "$(_jbody)"
}

_comp_delete() {
    year="${1:?Usage: comptasse income-statements computations delete <idYear> <id>}"
    comp="${2:?missing <idComputation>}"
    _require_cfg; _api DELETE "$(_comp_base "$year")/$comp" > /dev/null
    printf 'Computation %s deleted.\n' "$comp"
}

# ── usage ─────────────────────────────────────────────────────────────────────

_usage() {
    cat << 'EOF'
Usage: comptasse <command> [subcommand] [options]

Authentication:
  login --email <email> --password <password> [--url <url>] [--org <idOrganization>]
  whoami
  logout

Commands:
  org             get | update | delete
  years           list | get | create | update | delete | close | open
                  settle-balance-sheet | settle-income-statement
  journals        list | get | create | update | delete
  accounts        list | get | create | update | delete
  tags            list | get | create | update | delete
  entries         list | get | create | update | duplicate | reverse | delete | compute
    entries lines   list | get | create | update | delete
    entries tags    add | remove
   files           list | get | upload | update | delete | download | ocr
  scenarios       list | get | run
    files folders   list | get | create | update | delete
  members         list | get | invite | update | remove
  exports         fec | xbrl-balance-sheet | xbrl-income-statement
  balance-sheets  list | get | create | update | delete
  income-statements list | get | create | update | delete
    income-statements computations  list | get | create | update | delete

Options:
  --help, -h      Show this help
  --version, -v   Show version ($VERSION)

Output is JSON. Pipe through jq for filtering:
  comptasse years list --year yr_xxx | jq '.[].id'
EOF
}

# ── main ──────────────────────────────────────────────────────────────────────

main() {
    _need_cmd curl
    cmd="${1:-}"; [ $# -gt 0 ] && shift
    case "$cmd" in
        --version|-v) printf 'comptasse %s\n' "$VERSION"; return ;;
        --help|-h|''|help) _usage; return ;;
    esac
    _check_version
    case "$cmd" in
        login)             _cmd_login "$@" ;;
        whoami)            _cmd_whoami ;;
        logout)            _cmd_logout ;;
        org)               _cmd_org "$@" ;;
        years)             _cmd_years "$@" ;;
        journals)          _cmd_journals "$@" ;;
        accounts)          _cmd_accounts "$@" ;;
        tags)              _cmd_tags "$@" ;;
        entries)           _cmd_entries "$@" ;;
        files)             _cmd_files "$@" ;;
        scenarios)         _cmd_scenarios "$@" ;;
        members)           _cmd_members "$@" ;;
        exports)           _cmd_exports "$@" ;;
        balance-sheets)    _cmd_balance_sheets "$@" ;;
        income-statements) _cmd_income_statements "$@" ;;
        *) printf 'comptasse: unknown command "%s". Run "comptasse --help" for usage.\n' "$cmd" >&2; exit 1 ;;
    esac
}

main "$@"
