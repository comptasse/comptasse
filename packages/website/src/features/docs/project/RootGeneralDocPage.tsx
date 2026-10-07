import { ButtonOutlineContent } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconBook, IconChevronRight, IconCode, IconCompass, IconTerminal } from "@tabler/icons-react"
import { DocHeader } from "../../../components/document/DocHeader.js"
import { DocParagraph } from "../../../components/document/DocParagraph.js"
import { DocRoot } from "../../../components/document/DocRoot.js"
import { DocSectionCard } from "../../../components/document/DocSectionCard.js"
import { LinkButton } from "../../../components/LinkButton.js"

export function RootGeneralDocPage() {
    return (
        <DocRoot>
            <DocHeader
                title="Documentation"
                description="Bienvenue dans la documentation de Comptasse. Vous pouvez ici découvrir le projet, reprendre les bases de la comptabilité ou apprendre à utiliser le logiciel."
            />

            {/* About section */}
            <div
                className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    padding: "1.5rem",
                    borderRadius: "lg",
                    border: "1px solid",
                    borderColor: "neutral/10",
                    backgroundColor: "white",
                })}
            >
                <DocParagraph>
                    Comptasse est un logiciel de comptabilité open source conçu pour tous. Accessible, moderne et
                    respectueux des normes comptables françaises, il vous permet de gérer vos écritures comptables, vos
                    documents, générer vos documents fiscaux et collaborer avec votre équipe.
                </DocParagraph>
                <div
                    className={css({
                        display: "flex",
                        gap: "0.5rem",
                    })}
                >
                    <LinkButton to="/documentation/fonctionnalités">
                        <ButtonOutlineContent
                            text="Voir les fonctionnalités"
                            rightIcon={<IconChevronRight />}
                        />
                    </LinkButton>
                </div>
            </div>

            {/* Section cards */}
            <div
                className={css({
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "1rem",
                    sm: {
                        gridTemplateColumns: "1fr",
                    },
                })}
            >
                <DocSectionCard
                    icon={<IconBook />}
                    iconColor="primary"
                    title="Comptabilité"
                    description="Apprenez les bases de la comptabilité française : la partie double, les écritures, les comptes, les documents comptables et les ressources de référence."
                    links={[
                        {
                            to: "/documentation/comptabilité/introduction/",
                            label: "Introduction",
                        },
                        {
                            to: "/documentation/comptabilité/documents",
                            label: "Documents comptables",
                        },
                        {
                            to: "/documentation/comptabilité/ressources/comptes",
                            label: "Liste des comptes",
                        },
                    ]}
                    ctaTo="/documentation/comptabilité"
                    ctaLabel="Voir la section"
                />
                <DocSectionCard
                    icon={<IconCompass />}
                    iconColor="information"
                    title="Guide d'utilisation"
                    description="Guide d'utilisation de Comptasse : organisations, exercices, saisie des écritures, stockage, documents comptables et assistant IA."
                    links={[
                        {
                            to: "/documentation/guide/démarrer",
                            label: "Démarrage",
                        },
                        {
                            to: "/documentation/guide/écritures",
                            label: "Saisie des écritures",
                        },
                        {
                            to: "/documentation/guide/agent",
                            label: "Assistant IA",
                        },
                    ]}
                    ctaTo="/documentation/guide"
                    ctaLabel="Voir la section"
                />
                <DocSectionCard
                    icon={<IconCode />}
                    iconColor="success"
                    title="API"
                    description="Référence complète de l'API REST de Comptasse : authentification, gestion des organisations, exercices, écritures, exports et bien plus."
                    links={[
                        {
                            to: "/documentation/guide/référence-api",
                            label: "Référence API",
                        },
                        {
                            to: "/documentation/guide/authentification",
                            label: "Authentification",
                        },
                        {
                            to: "/documentation/guide/écritures",
                            label: "Écritures",
                        },
                    ]}
                    ctaTo="/documentation/guide/référence-api"
                    ctaLabel="Voir la section"
                />
                <DocSectionCard
                    icon={<IconTerminal />}
                    iconColor="warning"
                    title="CLI"
                    description="Installez et utilisez l'interface en ligne de commande de Comptasse pour gérer vos organisations, exercices, écritures et exports depuis votre terminal."
                    links={[
                        {
                            to: "/documentation/guide/installation",
                            label: "Installation",
                        },
                        {
                            to: "/documentation/guide/authentification",
                            label: "Authentification",
                        },
                        {
                            to: "/documentation/guide/référence-cli",
                            label: "Référence CLI",
                        },
                    ]}
                    ctaTo="/documentation/guide/référence-cli"
                    ctaLabel="Voir la section"
                />
            </div>
        </DocRoot>
    )
}
