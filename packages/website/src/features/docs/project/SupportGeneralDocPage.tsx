import { IconBrandGithub, IconBrandX, IconExternalLink, IconMail } from "@tabler/icons-react"
import { DocHeader } from "../../../components/document/DocHeader.js"
import { DocLink } from "../../../components/document/DocLink.js"
import { DocParagraph } from "../../../components/document/DocParagraph.js"
import { DocRoot } from "../../../components/document/DocRoot.js"
import { DocSection } from "../../../components/document/DocSection.js"

export function SupportGeneralDocPage() {
    return (
        <DocRoot>
            <DocHeader
                title="Support"
                description="Besoin d'aide ? Nous sommes là pour vous accompagner."
            />

            <DocSection
                title="Nous contacter"
                depth={1}
            >
                <DocSection
                    title="Email"
                    depth={2}
                >
                    <DocParagraph>Contactez-nous par email pour toute question ou demande d'assistance.</DocParagraph>
                    <DocParagraph>
                        <DocLink
                            href="mailto:support@comptasse.com"
                            buttonProps={{
                                leftIcon: <IconMail />,
                                text: "support@comptasse.com",
                                rightIcon: <IconExternalLink />,
                            }}
                        />
                    </DocParagraph>
                </DocSection>

                <DocSection
                    title="GitHub"
                    depth={2}
                >
                    <DocParagraph>Signalez un bug, proposez une amélioration ou consultez le code source.</DocParagraph>
                    <DocParagraph>
                        <DocLink
                            href="https://github.com/comptasse/comptasse"
                            target="_blank"
                            rel="noopener noreferrer"
                            buttonProps={{
                                leftIcon: <IconBrandGithub />,
                                text: "comptasse/comptasse",
                                rightIcon: <IconExternalLink />,
                            }}
                        />
                    </DocParagraph>
                </DocSection>

                <DocSection
                    title="X (Twitter)"
                    depth={2}
                >
                    <DocParagraph>Suivez-nous pour les dernières actualités et mises à jour.</DocParagraph>
                    <DocParagraph>
                        <DocLink
                            href="https://x.com/comptasse"
                            target="_blank"
                            rel="noopener noreferrer"
                            buttonProps={{
                                leftIcon: <IconBrandX />,
                                text: "@comptasse",
                                rightIcon: <IconExternalLink />,
                            }}
                        />
                    </DocParagraph>
                </DocSection>
            </DocSection>

            <DocSection
                title="Ressources utiles"
                depth={1}
            >
                <DocSection
                    title="Cours de comptabilité"
                    depth={2}
                >
                    <DocParagraph>Les bases de la comptabilité expliquées simplement</DocParagraph>
                    <DocParagraph>
                        <DocLink
                            to="/documentation/comptabilité/introduction/"
                            buttonProps={{
                                text: "Commencer le cours",
                            }}
                        />
                    </DocParagraph>
                </DocSection>
                <DocSection
                    title="Guide d'utilisation"
                    depth={2}
                >
                    <DocParagraph>Apprenez à utiliser l'application</DocParagraph>
                    <DocParagraph>
                        <DocLink
                            to="/documentation/guide/démarrer"
                            buttonProps={{
                                text: "Ouvrir le guide",
                            }}
                        />
                    </DocParagraph>
                </DocSection>
            </DocSection>
        </DocRoot>
    )
}
