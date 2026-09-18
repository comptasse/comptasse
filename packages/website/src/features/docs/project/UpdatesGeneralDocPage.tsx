import { IconBrandGithub, IconExternalLink } from "@tabler/icons-react"
import { DocHeader } from "../../../components/document/DocHeader.js"
import { DocLink } from "../../../components/document/DocLink.js"
import { DocParagraph } from "../../../components/document/DocParagraph.js"
import { DocRoot } from "../../../components/document/DocRoot.js"
import { DocSection } from "../../../components/document/DocSection.js"

export function UpdatesGeneralDocPage() {
    return (
        <DocRoot>
            <DocHeader
                title="Mises à jour"
                description="Historique des versions et nouveautés de Comptasse."
            />
            <DocSection title="Suivre les mises à jour">
                <DocParagraph>
                    Les mises à jour de Comptasse sont publiées directement sur GitHub Releases avec les nouveautés,
                    corrections et changements par version.
                </DocParagraph>
                <DocParagraph>
                    <DocLink
                        href="https://github.com/comptasse/comptasse/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        buttonProps={{
                            leftIcon: <IconBrandGithub />,
                            text: "Voir les mises à jours sur GitHub",
                            rightIcon: <IconExternalLink />,
                        }}
                    />
                </DocParagraph>
            </DocSection>
        </DocRoot>
    )
}
