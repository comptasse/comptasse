import { LinkContent } from "@comptasse/ui"
import { DocTip } from "../../../components/document/DocTip.js"

export function DataError() {
    return (
        <DocTip variant="info">
            Si vous constatez une erreur ou une inexactitude, n'hésitez pas à{" "}
            <a
                href="https://github.com/comptasse/comptasse/issues"
                target="_blank"
                rel="noopener noreferrer"
            >
                <LinkContent>ouvrir un ticket sur Github</LinkContent>
            </a>{" "}
            afin que nous puissions la corriger
        </DocTip>
    )
}
